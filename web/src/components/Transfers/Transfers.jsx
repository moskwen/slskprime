import {t} from '../../lib/i18n';
import './Transfers.css';
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {Button,Checkbox,Input,Message,Modal,Table} from 'semantic-ui-react';
import * as api from '../../lib/transfers';
import {clearTransferRecords} from '../../lib/clearTransfers';
import {transferRows} from '../../lib/studio';
import {formatBytes,getFileName} from '../../lib/util';
import {urlBase} from '../../config';
import LoaderSegment from '../Shared/LoaderSegment';

const rowKey=r=>`${r.username}\n${r.file.id}`;
const completed=f=>(f.state||'').startsWith('Completed');
const queued=f=>(f.state||'').includes('Queued')||f.state==='Requested';
const retryable=f=>completed(f)&&f.state!=='Completed, Succeeded';
const status=f=>t(({'Completed, Succeeded':'Completed','Queued, Remotely':'Queued remotely','Queued, Locally':'Queued locally','Queued':'Queued','Requested':'Requested','Initializing':'Connecting','InProgress':'In Progress','Completed, Cancelled':'Cancelled','Completed, TimedOut':'Timed out','Completed, Errored':'Failed','Completed, Rejected':'Rejected'})[f.state]||f.state);
const errorText=e=>typeof e?.response?.data==='string'?e.response.data:e?.response?.data?.message||e?.message||t('Request failed');
async function bounded(items,action,limit=4){let next=0;const errors=[];await Promise.all(Array.from({length:Math.min(limit,items.length)},async()=>{while(next<items.length){try{await action(items[next++]);}catch(e){errors.push(errorText(e));}}}));return errors;}

export default function Transfers({direction,server={}}){
 const [data,setData]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const [filter,setFilter]=useState('all'),[query,setQuery]=useState(''),[page,setPage]=useState(1),[selected,setSelected]=useState(new Set());
 const [working,setWorking]=useState(''),[confirmation,setConfirmation]=useState(null);
 const busy=useRef(false),epoch=useRef(0),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useEffect(()=>{
  let stopped=false,timer;setLoading(true);setData([]);setSelected(new Set());setFilter('all');setQuery('');setPage(1);epoch.current++;
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
 const visible=useMemo(()=>transferRows(data,filter,query),[data,filter,query]);
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
 if(loading)return <LoaderSegment/>;
 const counts={all:rows.length,active:transferRows(data,'active').length,queued:queue.length,done:transferRows(data,'done').length,error:transferRows(data,'error').length};
 return <section className="classic-transfers">
  <div className="classic-transfer-toolbar">
   <Button size="small" icon="redo" content={t('Retry selected')} disabled={!!working||!retryRows.length||!server.isConnected} onClick={()=>perform('retry',retryRows)}/>
   <Button size="small" icon="stop" content={t('Cancel selected')} disabled={!!working||!cancelRows.length} onClick={()=>perform('cancel',cancelRows)}/>
   <Button size="small" icon="remove" content={t('Clear selected')} disabled={!!working||!chosen.length} onClick={()=>setConfirmation({title:'Clear selected downloads?',records:records(chosen)})}/>
   <span className="classic-toolbar-divider"/>
   <Button size="small" icon="check" content={t('Clear completed')} disabled={!!working||!done.length} onClick={()=>perform('completed')}/>
   {direction==='download'&&<><Button size="small" icon="clock outline" content={t('Clear queue')} disabled={!!working||!queue.length} onClick={()=>setConfirmation({title:'Clear queued downloads?',records:records(queue)})}/>
    <Button size="small" icon="eraser" content={t('Clear all')} disabled={!!working||!rows.length} onClick={()=>setConfirmation({title:'Clear all downloads?',records:records(rows)})}/></>}
  </div>
  {error&&<Message negative role="alert" onDismiss={()=>setError('')}>{error}</Message>}
  {!!working&&<p role="status" className="classic-transfer-status">{t('Working…')}</p>}
  <div className="classic-transfer-filterbar"><div className="classic-status-tabs">
   {[['all','All'],['active','In Progress'],['queued','Queued'],['done','Completed'],['error','Failed or cancelled']].map(([value,label])=><button type="button" key={value} aria-pressed={filter===value} onClick={()=>{setFilter(value);setPage(1);setSelected(new Set());}}>{t(label)} <span>{counts[value]}</span></button>)}
  </div><Input size="small" icon="search" aria-label={t('Filter')} placeholder={t('Filter by file, folder or user…')} value={query} onChange={(_,d)=>{setQuery(d.value);setPage(1);setSelected(new Set());}}/></div>
  <div className="classic-transfer-table"><Table compact selectable unstackable>
   <Table.Header><Table.Row>
    <Table.HeaderCell collapsing><Checkbox aria-label={t('Select visible files')} checked={!!shown.length&&shown.every(r=>selected.has(rowKey(r)))} indeterminate={shown.some(r=>selected.has(rowKey(r)))&&!shown.every(r=>selected.has(rowKey(r)))} onChange={(_,d)=>setSelected(old=>{const next=new Set(old);shown.forEach(r=>d.checked?next.add(rowKey(r)):next.delete(rowKey(r)));return next;})}/></Table.HeaderCell>
    {['File','User','Status','Progress','Size','Speed','Queue'].map(label=><Table.HeaderCell key={label}>{t(label)}</Table.HeaderCell>)}
   </Table.Row></Table.Header>
   <Table.Body>{shown.map(r=><Table.Row key={rowKey(r)} active={selected.has(rowKey(r))} onClick={event=>{if(!event.target.closest?.("a,input,label,button,.checkbox"))setSelected(new Set([rowKey(r)]));}}>
    <Table.Cell collapsing><Checkbox aria-label={`${t('Select')} ${getFileName(r.file.filename||'')}`} checked={selected.has(rowKey(r))} onChange={(_,d)=>selectRow(r,d.checked)}/></Table.Cell>
    <Table.Cell className="classic-file-cell" title={r.file.filename}><strong>{getFileName(r.file.filename||'')}</strong><small>{r.directory}</small></Table.Cell>
    <Table.Cell><Link to={{pathname:`${urlBase}/browse`,state:{user:r.username}}} title={t('Browse files')}>{r.username}</Link></Table.Cell>
    <Table.Cell className={retryable(r.file)?'classic-state-error':r.file.state==='Completed, Succeeded'?'classic-state-done':''}>{status(r.file)}</Table.Cell>
    <Table.Cell>{Math.min(100,Math.round(r.file.percentComplete||(r.file.size?(r.file.bytesTransferred||0)/r.file.size*100:0)))}%</Table.Cell>
    <Table.Cell>{formatBytes(r.file.size||0)}</Table.Cell><Table.Cell>{r.file.state==='InProgress'?`${formatBytes(r.file.averageSpeed||0)}/s`:'—'}</Table.Cell>
    <Table.Cell>{r.file.placeInQueue||'—'}</Table.Cell>
   </Table.Row>)}{!shown.length&&<Table.Row><Table.Cell colSpan={8} className="classic-empty">{t('No files match this filter')}</Table.Cell></Table.Row>}</Table.Body>
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
