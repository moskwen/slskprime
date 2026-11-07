/* Copyright (c) 2026 slskprime contributors. AGPL-3.0-only with Additional Terms; see LICENSE. */
import React, {useState} from 'react';
import {Button,Message,Modal} from 'semantic-ui-react';
import {t} from '../../lib/i18n';

export default function ClearAllDownloads({records,disabled,onClear}) {
  const [snapshot,setSnapshot]=useState(null),[working,setWorking]=useState(false),[error,setError]=useState('');
  const active=(snapshot||[]).filter(record=>!record.state.startsWith('Completed')).length;
  const clear=async()=>{
    setWorking(true);setError('');
    try {
      const result=await onClear(snapshot);
      if(result.remaining)setError(t('{0} entries could not be cleared. Try again.',[result.remaining]));
      else setSnapshot(null);
    } catch(e) {setError(t('Could not refresh the download list.'));}
    finally {setWorking(false);}
  };
  return <><div className="studio-transfer-top-actions"><Button size="small" icon="eraser" content={t('Clear all')}
    disabled={disabled||!records.length} onClick={()=>{setError('');setSnapshot(records.map(record=>({...record})));}}/></div>
    <Modal open={snapshot!==null} size="small" role="dialog" aria-modal="true" onClose={()=>!working&&setSnapshot(null)} closeOnDimmerClick={!working} closeOnEscape={!working}>
      <Modal.Header>{t('Clear all downloads?')}</Modal.Header><Modal.Content>
        <p>{t('Remove all {0} entries from the download list, including entries hidden by filters or on other pages.',[snapshot?.length||0])}</p>
        <p>{t('Downloaded files and your download folders are kept.')}</p>
        {active>0&&<Message warning>{t('{0} queued or active downloads will be cancelled. Partial files are kept.',[active])}</Message>}
        {error&&<Message negative role="alert">{error}</Message>}
      </Modal.Content><Modal.Actions><Button disabled={working} onClick={()=>setSnapshot(null)}>{t('Back')}</Button>
        <Button negative icon="eraser" content={t('Clear download list')} loading={working} disabled={working} onClick={clear}/>
      </Modal.Actions></Modal></>;
}
