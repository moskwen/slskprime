import {t} from '../../lib/i18n';
import './Transfers.css';
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Link,useHistory} from 'react-router-dom';
import {Button,Checkbox,Input,Message,Modal,Table} from 'semantic-ui-react';
import * as api from '../../lib/transfers';
import {clearTransferRecords} from '../../lib/clearTransfers';
import {transferRows} from '../../lib/studio';
import {formatBytes,getFileName} from '../../lib/util';
import {urlBase} from '../../config';
import LoaderSegment from '../Shared/LoaderSegment';

import ClassicContextMenu from '../Shared/ClassicContextMenu';
import PrivateMessageComposer from '../Shared/PrivateMessageComposer';
import {isFavorite,toggleFavorite} from '../StudioFavorites';
import {useViewState,useViewScroll} from '../../lib/viewState';
const rowKey=r=>`${r.username}\n${r.file.id}`;
const completed=f=>(f.state||'').startsWith('Completed');
const queued=f=>(f.state||'').includes('Queued')||f.state==='Requested';
const retryable=f=>completed(f)&&f.state!=='Completed, Succeeded';
const status=f=>t(({'Completed, Succeeded':'Completed','Queued, Remotely':'Queued remotely','Queued, Locally':'Queued locally','Queued':'Queued','Requested':'Requested','Initializing':'Connecting','InProgress':'In Progress','Completed, Cancelled':'Cancelled','Completed, TimedOut':'Timed out','Completed, Errored':'Failed','Completed, Rejected':'Rejected'})[f.state]||f.state);
const errorText=e=>typeof e?.response?.data==='string'?e.response.data:e?.response?.data?.message||e?.message||t('Request failed');
async function bounded(items,action,limit=4){let next=0;const errors=[];await Promise.all(Array.from({length:Math.min(limit,items.length)},async()=>{while(next<items.length){try{await action(items[next++]);}catch(e){errors.push(errorText(e));}}}));return errors;}

export default function Transfers({direction,server={}}){
 const history=useHistory(),viewKey=`transfers:${direction}`;
 const [grouped,setGrouped]=useViewState(viewKey+':grouped',true),[collapsed,setCollapsed]=useViewState(viewKey+':collapsed',[]);
 const [menu,setMenu]=useState(null),[messageUser,setMessageUser]=useState(null);
 const [data,setData]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const [filter,setFilter]=useViewState(viewKey+':filter','all'),[query,setQuery]=useViewState(viewKey+':query',''),[page,setPage]=useViewState(viewKey+':page',1),[selected,setSelected]=useState(new Set());
 const [working,setWorking]=useState(''),[confirmation,setConfirmation]=useState(null);
 const scrollRef=useViewScroll(viewKey,!loading);
 const busy=useRef(false),epoch=useRef(0),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useEffect(()=>{
  let stopped=false,timer;setLoading(true);setData([]);setSelected(new Set());epoch.current++;
  const poll=async()=>{
   if(stopped)return;
   if(busy.current||document.hidden){timer=setTimeout(poll,1000);return;}
   const version=epoch.current;
   try{const next=await api.getAll({direction});if(!Array.isArray(next))throw new Error(t('Could not refresh the download list.'));
    if(!stopped&&version===epoch.current){setData(next);setError('');setLoading(false);}
   }catch(e){if(!stopped){setError(errorText(e));setLoading(false);}}
   if(!stopped)timer=setTimeout(poll,3000);
  };
  poll();return()=>{stopped=true;clearTimeout(timer);};
 },[direction]);
 const rows=useMemo(()=>transferRows(data),[data]);
 const visible=useMemo(()=>{const result=transferRows(data,filter,query);return grouped?result.sort((a,b)=>a.username.localeCompare(b.username)||String(a.directory||'').localeCompare(String(b.directory||''))):result;},[data,filter,query,grouped]);
 const pages=Math.max(1,Math.ceil(visible.length/100)),currentPage=Math.min(page,pages),shown=visible.slice((currentPage-1)*100,currentPage*100);
 const chosen=rows.filter(r=>selected.has(rowKey(r))),retryRows=chosen.filter(r=>retryable(r.file)),cancelRows=chosen.filter(r=>!completed(r.file));
 const done=rows.filter(r=>completed(r.file)),queue=rows.filter(r=>queued(r.file));
 const records=list=>list.map(r=>({username:r.username,id:r.file.id,state:r.file.state}));
 const selectRow=(row,checked)=>setSelected(old=>{const next=new Set(old);checked?next.add(rowKey(row)):next.delete(rowKey(row));return next;});
 const refresh=async()=>{const next=await api.getAll({direction});if(!Array.isArray(next))throw new Error(t('Could not refresh the download list.'));if(alive.current){epoch.current++;setData(next);}return next;};
 const perform=async(kind,targets=[])=>{
  if(busy.current)return;busy.current=true;epoch.current++;setWorking(kind);setError('');
  try{
   let failures=[];
   if(kind==='clear'){
    const result=await clearTransferRecords({records:targets,direction});
    if(alive.current){epoch.current++;setData(result.latest);}
    if(result.remaining)throw new Error(t('{0} entries could not be cleared. Try again.',[result.remaining])+(result.error?` ${result.error}`:''));
   }else if(kind==='completed'){await api.clearCompleted({direction});await refresh();}
   else if(kind==='cancel'){failures=await bounded(targets,r=>api.cancel({direction,username:r.username,id:r.file.id}));await refresh();}
   else if(kind==='retry'){
    const users=new Map();for(const r of targets){if(!users.has(r.username))users.set(r.username,[]);users.get(r.username).push({filename:r.file.filename,size:r.file.size});}
    failures=await bounded([...users],([username,files])=>api.download({username,files}),2);await refresh();
   }
   if(failures.length)throw new Error([...new Set(failures)].join(' · '));
   if(alive.current){setSelected(new Set());setConfirmation(null);setPage(1);}
  }catch(e){if(alive.current)setError(errorText(e));}
  finally{busy.current=false;epoch.current++;if(alive.current)setWorking('');}
 };
 const scopes=useMemo(()=>{const map=new Map();for(const row of visible){for(const id of [JSON.stringify([row.username]),JSON.stringify([row.username,row.directory])]){if(!map.has(id))map.set(id,[]);map.get(id).push(row);}}return map;},[visible]);
 const scopeRows=(username,directory)=>scopes.get(JSON.stringify(directory===undefined?[username]:[username,directory]))||[];
 const toggleGroup=id=>setCollapsed(old=>old.includes(id)?old.filter(x=>x!==id):[...old,id]);
 const groupHeader=(id,label,targets,level)=>{
  const bytes=targets.reduce((n,r)=>n+(r.file.size||0),0),transferred=targets.reduce((n,r)=>n+(r.file.state==='Completed, Succeeded'?(r.file.size||0):Math.min(r.file.size||0,r.file.bytesTransferred||(r.file.size||0)*(r.file.percentComplete||0)/100)),0);
  const checked=targets.length>0&&targets.every(r=>selected.has(rowKey(r)));
  return <Table.Row key={id} className={'classic-transfer-group classic-transfer-group-'+level}>
   <Table.Cell><Checkbox aria-label={`${t('Select group')}: ${label}`} checked={checked} indeterminate={!checked&&targets.some(r=>selected.has(rowKey(r)))} onChange={(_,d)=>setSelected(old=>{const next=new Set(old);targets.forEach(r=>d.checked?next.add(rowKey(r)):next.delete(rowKey(r)));return next;})}/></Table.Cell>
   <Table.Cell colSpan={7}><div className="classic-group-line"><button type="button" className="classic-group-toggle" aria-expanded={!collapsed.includes(id)} onClick={()=>toggleGroup(id)}>{collapsed.includes(id)?'▸':'▾'} {label}</button><span>{t('{0} matching files',[targets.length])} · {formatBytes(bytes)} · {bytes?Math.round(transferred/bytes*100):0}%</span><div className="classic-group-actions">
    {direction==='download'&&<Button size="mini" title={t('Retry group')} aria-label={`${t('Retry group')}: ${label}`} icon="redo" disabled={!!working||!server.isConnected||!targets.some(r=>retryable(r.file))} onClick={()=>perform('retry',targets.filter(r=>retryable(r.file)))}/>}
    <Button size="mini" title={t('Cancel group')} aria-label={`${t('Cancel group')}: ${label}`} icon="stop" disabled={!!working||!targets.some(r=>!completed(r.file))} onClick={()=>perform('cancel',targets.filter(r=>!completed(r.file)))}/>
    <Button size="mini" title={t('Clear group')} aria-label={`${t('Clear group')}: ${label}`} icon="eraser" disabled={!!working} onClick={()=>setConfirmation({title:'Clear selected downloads?',records:records(targets)})}/>
   </div></div></Table.Cell>
  </Table.Row>;
 };
 const openMenu=(event,row)=>{event.preventDefault();if(!selected.has(rowKey(row)))setSelected(new Set([rowKey(row)]));const rect=event.currentTarget.getBoundingClientRect();setMenu({x:event.clientX||rect.left+40,y:event.clientY||rect.top,row});};
 if(loading)return <LoaderSegment/>;
 const counts={all:rows.length,active:transferRows(data,'active').length,queued:queue.length,done:transferRows(data,'done').length,error:transferRows(data,'error').length};
 return <section className="classic-transfers" ref={scrollRef}>
  {messageUser&&<PrivateMessageComposer key={messageUser} username={messageUser} onClose={()=>setMessageUser(null)}/>}
  <ClassicContextMenu position={menu} onClose={()=>setMenu(null)} items={menu?[
   {label:t('Retry selected'),disabled:direction!=='download'||!!working||!server.isConnected||!retryRows.length,action:()=>perform('retry',retryRows)},
   {label:t('Cancel selected'),disabled:!!working||!cancelRows.length,action:()=>perform('cancel',cancelRows)},
   {label:t('Clear selected'),disabled:!!working||!chosen.length,action:()=>setConfirmation({title:'Clear selected downloads?',records:records(chosen)})},
   {label:t('Browse files'),action:()=>history.push({pathname:`${urlBase}/browse`,state:{user:menu.row.username,directory:menu.row.directory}})},
   {label:t('Send Private Message'),action:()=>setMessageUser(menu.row.username)},
   {label:t('Add user'),disabled:isFavorite(menu.row.username),action:()=>{if(!isFavorite(menu.row.username))toggleFavorite(menu.row.username);}},
   {label:t('User information'),action:()=>history.push({pathname:`${urlBase}/user-info`,state:{user:menu.row.username}})}]:[]}/>

  <div className="classic-transfer-toolbar">
   <Button size="small" icon="redo" content={t('Retry selected')} disabled={direction!=='download'||!!working||!retryRows.length||!server.isConnected} onClick={()=>perform('retry',retryRows)}/>
   <Button size="small" icon="stop" content={t('Cancel selected')} disabled={!!working||!cancelRows.length} onClick={()=>perform('cancel',cancelRows)}/>
   <Button size="small" icon="remove" content={t('Clear selected')} disabled={!!working||!chosen.length} onClick={()=>setConfirmation({title:'Clear selected downloads?',records:records(chosen)})}/>
   <span className="classic-toolbar-divider"/>
   <Button size="small" icon="check" content={t('Clear completed')} disabled={!!working||!done.length} onClick={()=>perform('completed')}/>
   {direction==='download'&&<><Button size="small" icon="clock outline" content={t('Clear queue')} disabled={!!working||!queue.length} onClick={()=>setConfirmation({title:'Clear queued downloads?',records:records(queue)})}/>
    <Button size="small" icon="eraser" content={t('Clear all')} disabled={!!working||!rows.length} onClick={()=>setConfirmation({title:'Clear all downloads?',records:records(rows)})}/></>}
  </div>
  {error&&<Message negative role="alert" onDismiss={()=>setError('')}>{error}</Message>}
  {!!working&&<p role="status" className="classic-transfer-status">{t('Working…')}</p>}
  <div className="classic-transfer-filterbar"><Checkbox label={t('Group by user and folder')} checked={grouped} onChange={(_,d)=>setGrouped(d.checked)}/><div className="classic-status-tabs">
   {[['all','All'],['active','In Progress'],['queued','Queued'],['done','Completed'],['error','Failed or cancelled']].map(([value,label])=><button type="button" key={value} aria-pressed={filter===value} onClick={()=>{setFilter(value);setPage(1);setSelected(new Set());}}>{t(label)} <span>{counts[value]}</span></button>)}
  </div><Input size="small" icon="search" aria-label={t('Filter')} placeholder={t('Filter by file, folder or user…')} value={query} onChange={(_,d)=>{setQuery(d.value);setPage(1);setSelected(new Set());}}/></div>
  <div className="classic-transfer-table" data-scroll-region="table"><Table compact selectable unstackable>
   <Table.Header><Table.Row>
    <Table.HeaderCell collapsing><Checkbox aria-label={t('Select visible files')} checked={!!shown.length&&shown.every(r=>selected.has(rowKey(r)))} indeterminate={shown.some(r=>selected.has(rowKey(r)))&&!shown.every(r=>selected.has(rowKey(r)))} onChange={(_,d)=>setSelected(old=>{const next=new Set(old);shown.forEach(r=>d.checked?next.add(rowKey(r)):next.delete(rowKey(r)));return next;})}/></Table.HeaderCell>
    {['File','User','Status','Progress','Size','Speed','Queue'].map(label=><Table.HeaderCell key={label}>{t(label)}</Table.HeaderCell>)}
   </Table.Row></Table.Header>
   <Table.Body>{shown.map((r,index)=>{const userId=JSON.stringify([r.username]),dirId=JSON.stringify([r.username,r.directory]);return <React.Fragment key={rowKey(r)}>{grouped&&(!index||shown[index-1].username!==r.username)&&groupHeader(userId,r.username,scopeRows(r.username),'user')}{grouped&&!collapsed.includes(userId)&&(!index||shown[index-1].username!==r.username||shown[index-1].directory!==r.directory)&&groupHeader(dirId,getFileName(r.directory||'')||r.directory,scopeRows(r.username,r.directory),'folder')}{(!grouped||(!collapsed.includes(userId)&&!collapsed.includes(dirId)))&&<Table.Row key={rowKey(r)} active={selected.has(rowKey(r))} onContextMenu={event=>openMenu(event,r)} tabIndex={0} onKeyDown={event=>{if(event.key==='ContextMenu'||(event.shiftKey&&event.key==='F10'))openMenu(event,r);}} onClick={event=>{if(!event.target.closest?.("a,input,label,button,.checkbox"))setSelected(new Set([rowKey(r)]));}}>
    <Table.Cell collapsing><Checkbox aria-label={`${t('Select')} ${getFileName(r.file.filename||'')}`} checked={selected.has(rowKey(r))} onChange={(_,d)=>selectRow(r,d.checked)}/></Table.Cell>
    <Table.Cell className="classic-file-cell" title={r.file.filename}><strong>{getFileName(r.file.filename||'')}</strong><small>{r.directory}</small></Table.Cell>
    <Table.Cell><Link to={{pathname:`${urlBase}/browse`,state:{user:r.username}}} title={t('Browse files')}>{r.username}</Link></Table.Cell>
    <Table.Cell className={retryable(r.file)?'classic-state-error':r.file.state==='Completed, Succeeded'?'classic-state-done':''}>{status(r.file)}</Table.Cell>
    <Table.Cell>{Math.min(100,Math.round(r.file.state==='Completed, Succeeded'?100:r.file.percentComplete||(r.file.size?(r.file.bytesTransferred||0)/r.file.size*100:0)))}%</Table.Cell>
    <Table.Cell>{formatBytes(r.file.size||0)}</Table.Cell><Table.Cell>{r.file.state==='InProgress'?`${formatBytes(r.file.averageSpeed||0)}/s`:'—'}</Table.Cell>
    <Table.Cell>{r.file.placeInQueue||'—'}</Table.Cell>
   </Table.Row>}</React.Fragment>;})}{!shown.length&&<Table.Row><Table.Cell colSpan={8} className="classic-empty">{t('No files match this filter')}</Table.Cell></Table.Row>}</Table.Body>
  </Table></div>
  <div className="classic-transfer-footer"><span>{t('{0} matching files',[visible.length])} · {t('{0} selected',[chosen.length])}</span><div><Button size="mini" icon="arrow left" aria-label={t('Previous')} disabled={currentPage<=1} onClick={()=>setPage(currentPage-1)}/><span>{currentPage} / {pages}</span><Button size="mini" icon="arrow right" aria-label={t('Next')} disabled={currentPage>=pages} onClick={()=>setPage(currentPage+1)}/></div></div>
  <Modal open={!!confirmation} size="small" role="dialog" aria-modal="true" onClose={()=>!working&&setConfirmation(null)} closeOnDimmerClick={!working} closeOnEscape={!working}>
   <Modal.Header>{t(confirmation?.title||'Clear all downloads?')}</Modal.Header><Modal.Content>
    <p>{t('Remove {0} entries from the list. Files on disk are kept.',[confirmation?.records.length||0])}</p>
    {confirmation?.records.some(f=>!completed(f))&&<Message warning>{t('{0} queued or active downloads will be cancelled. Partial files are kept.',[confirmation.records.filter(f=>!completed(f)).length])}</Message>}
    {error&&<Message negative>{error}</Message>}
   </Modal.Content><Modal.Actions><Button disabled={!!working} onClick={()=>setConfirmation(null)}>{t('Back')}</Button><Button negative content={t('Clear download list')} loading={!!working} disabled={!!working} onClick={()=>perform('clear',confirmation.records)}/></Modal.Actions>
  </Modal>
 </section>;
}
