import { t } from '../../lib/i18n';
/*
 * Copyright (c) 2026 slskprime contributors.
 * Modified: independent branding, English UI, compact design and browser-local discovery tools.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, version 3.
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 * This program is distributed with Additional Terms pursuant to Section 7
 * of the AGPLv3. See the LICENSE file for the complete terms and conditions.
 */
import './Transfers.css';
import { Button, Input } from 'semantic-ui-react';
import { transferRows, groupTransferRows } from '../../lib/studio';
import * as transfersLibrary from '../../lib/transfers';
import LoaderSegment from '../Shared/LoaderSegment';
import PlaceholderSegment from '../Shared/PlaceholderSegment';
import TransferGroup from './TransferGroup';
import TransfersHeader from './TransfersHeader';
import StudioTransferSummary from '../StudioTransferSummary';
import ClearAllDownloads from './ClearAllDownloads';
import { clearTransferRecords } from '../../lib/clearTransfers';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';

const Transfers = ({ direction, server }) => {
  const [filter,setFilter]=useState('all');
  const [query,setQuery]=useState('');
  const [page,setPage]=useState(1);
  const [paused,setPaused]=useState(false);
  const [connecting, setConnecting] = useState(true);
  const [transfers, setTransfers] = useState([]);

  const [retrying, setRetrying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [removing, setRemoving] = useState(false);
  const refreshEpoch = useRef(0);

  const fetch = async () => {
    try {
      const response = await transfersLibrary.getAll({ direction });
      return response;
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data ?? error?.message ?? error);
    }
  };

  useEffect(() => {
    let stopped=false,timer,working=false,first=true;
    const update=async()=>{
      if(stopped||working)return;
      if(paused){setConnecting(false);return;}
      if(document.hidden&&!first){timer=window.setTimeout(update,15000);return;}
      working=true;
      const epoch=refreshEpoch.current;
      const response=await fetch();
      if(!stopped){
        if(response&&epoch===refreshEpoch.current)setTransfers(response);
        setConnecting(false);first=false;
        const active=(response||[]).some(u=>(u.directories||[]).some(d=>(d.files||[]).some(f=>['InProgress','Initializing'].includes(f.state))));
        timer=window.setTimeout(update,active?2500:10000);
      }
      working=false;
    };
    const resume=()=>{if(!document.hidden){window.clearTimeout(timer);update();}};
    update();document.addEventListener('visibilitychange',resume);
    return()=>{stopped=true;window.clearTimeout(timer);document.removeEventListener('visibilitychange',resume);};
  }, [direction,paused]); // eslint-disable-line react-hooks/exhaustive-deps

  useMemo(() => {
    // this is used to prevent weird update issues if switching
    // between uploads and downloads.  useEffect fires _after_ the
    // prop 'direction' updates, meaning there's a flash where the
    // screen contents switch to the new direction for a brief moment
    // before the connecting animation shows.  this memo fires the instant
    // the direction prop changes, preventing this flash.
    setConnecting(true);
  }, [direction]); // eslint-disable-line react-hooks/exhaustive-deps

  const retry = async ({ file, suppressStateChange = false }) => {
    const { filename, size, username } = file;

    try {
      if (!suppressStateChange) setRetrying(true);
      await transfersLibrary.download({
        files: [{ filename, size }],
        username,
      });
      if (!suppressStateChange) setRetrying(false);
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data ?? error?.message ?? error);
      if (!suppressStateChange) setRetrying(false);
    }
  };

  const retryAll = async (transfersToRetry) => {
    setRetrying(true);
    await Promise.all(
      transfersToRetry.map((file) =>
        retry({ file, suppressStateChange: true }),
      ),
    );
    setRetrying(false);
  };

  const cancel = async ({ file, suppressStateChange = false }) => {
    const { id, username } = file;

    try {
      if (!suppressStateChange) setCancelling(true);
      await transfersLibrary.cancel({ direction, id, username });
      if (!suppressStateChange) setCancelling(false);
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data ?? error?.message ?? error);
      if (!suppressStateChange) setCancelling(false);
    }
  };

  const cancelAll = async (transfersToCancel) => {
    setCancelling(true);
    await Promise.all(
      transfersToCancel.map((file) =>
        cancel({ file, suppressStateChange: true }),
      ),
    );
    setCancelling(false);
  };

  const remove = async ({ file, suppressStateChange = false }) => {
    const { id, username } = file;

    try {
      if (!suppressStateChange) setRemoving(true);
      await transfersLibrary.cancel({ direction, id, remove: true, username });
      if (!suppressStateChange) setRemoving(false);
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data ?? error?.message ?? error);
      if (!suppressStateChange) setRemoving(false);
    }
  };

  const removeAll = async (transfersToRemove) => {
    setRemoving(true);
    await Promise.all(
      transfersToRemove.map((file) =>
        remove({ file, suppressStateChange: true }),
      ),
    );
    setRemoving(false);
  };

  const matching=useMemo(()=>transferRows(transfers,filter,query),[transfers,filter,query]);
  useEffect(()=>setPage(1),[filter,query,direction]);
  const pages=Math.max(1,Math.ceil(matching.length/50));
  const currentPage=Math.min(page,pages);
  const pageUsers=groupTransferRows(matching.slice((currentPage-1)*50,currentPage*50));
  const matchedUsers=groupTransferRows(matching);
  const allRecords=transferRows(transfers).map(({username,file})=>({username,id:file.id,state:file.state||''}));
  const clearAll=async(records)=>{
    setRemoving(true);refreshEpoch.current++;
    try {
      const result=await clearTransferRecords({records});
      refreshEpoch.current++;setTransfers(result.latest);setFilter('all');setQuery('');setPage(1);
      if(!result.remaining)toast.success(t('Download list cleared. Your files are kept.'));
      return result;
    } finally {refreshEpoch.current++;setRemoving(false);}
  };

  if (connecting) {
    return <LoaderSegment />;
  }

  return (
    <>
      {direction==='download'&&<ClearAllDownloads records={allRecords} disabled={removing||retrying||cancelling} onClear={clearAll}/>}
      <StudioTransferSummary transfers={transfers} direction={direction} />
      <div className="studio-transfer-filters">
        <div className="studio-quick-filters">{[['all',t("All")],['active',t("Active")],['queued',t("Queued")],['done',t("Completed")],['error',t("Failed or cancelled")]].map(([value,label])=><button type="button" key={value} className={filter===value?'active':''} onClick={()=>setFilter(value)}>{label}</button>)}</div>
        <div className="studio-transfer-search"><Input icon="search" placeholder={t("Filter by file, folder or user…")} value={query} onChange={(_,d)=>setQuery(d.value)}/><Button size="small" icon={paused?'play':'pause'} content={paused?t("Resume refresh"):t("Pause refresh")} onClick={()=>setPaused(!paused)}/></div>
        <p className="studio-note">{t("{0} matching files · bulk actions below apply to this filter. {1}", [matching.length, paused?t("Display updates paused. Transfers continue."):t("Auto-refresh pauses while this tab is hidden.")])}</p>
      </div>
      <TransfersHeader
        cancelling={cancelling}
        direction={direction}
        onCancelAll={cancelAll}
        onRemoveAll={removeAll}
        onRetryAll={retryAll}
        removing={removing}
        retrying={retrying}
        server={server}
        transfers={matchedUsers}
      />
      {matching.length === 0 ? (
        <PlaceholderSegment
          caption={t("No files match this filter")}
          icon={direction}
        />
      ) : (
        pageUsers.map((user) => (
          <TransferGroup
            cancel={cancel}
            cancelAll={cancelAll}
            direction={direction}
            key={[user.username,filter,query,currentPage].join('|')}
            remove={remove}
            removeAll={removeAll}
            retry={retry}
            retryAll={retryAll}
            user={user}
          />
        ))
      )}
      {pages>1&&<div className="studio-pagination"><Button size="small" icon="arrow left" content={t("Previous")} disabled={currentPage<=1} onClick={()=>setPage(currentPage-1)}/><span>{t("Page {0} of {1} · up to 50 files per page", [currentPage, pages])}</span><Button size="small" icon="arrow right" content={t("Next")} disabled={currentPage>=pages} onClick={()=>setPage(currentPage+1)}/></div>}
    </>
  );
};

export default Transfers;
