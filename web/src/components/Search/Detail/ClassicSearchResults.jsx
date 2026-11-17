/* Copyright (c) 2026 slskprime contributors. AGPL-3.0-only with Additional Terms; see LICENSE. */
import React,{useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {Button,Checkbox,Dropdown,Input,Message,Table} from 'semantic-ui-react';
import * as searches from '../../../lib/searches';
import * as transfers from '../../../lib/transfers';
import {getDirectoryContents} from '../../../lib/users';
import {formatBytes,formatSeconds,getDirectoryName,getFileName} from '../../../lib/util';
import {isSourceBlocked,saveWish} from '../../../lib/studio';
import {urlBase} from '../../../config';
import {t} from '../../../lib/i18n';
const key=r=>`${r.username}\n${r.file.filename}`;
const errorText=e=>typeof e?.response?.data==='string'?e.response.data:e?.message||t('Request failed');
export default function ClassicSearchResults({search,disabled,creating,removing,stopping,onCreate,onRemove,onStop}){
 const [responses,setResponses]=useState([]),[loading,setLoading]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [filter,setFilter]=useState(''),[format,setFormat]=useState(''),[freeOnly,setFreeOnly]=useState(false),[selected,setSelected]=useState(new Set()),[page,setPage]=useState(1),[working,setWorking]=useState(false);
 useEffect(()=>{let stopped=false;setResponses([]);setSelected(new Set());setPage(1);setError('');setNotice('');
  if(search.isComplete){setLoading(true);(async()=>{
   let result=[];
   for(let attempt=0;attempt<4&&!stopped;attempt++){
    result=await searches.getResponses({id:search.id});
    if(result?.length||!(search.fileCount||search.lockedFileCount))break;
    await new Promise(resolve=>setTimeout(resolve,250));
   }
   if(!stopped)setResponses(result||[]);
  })().catch(e=>{if(!stopped)setError(errorText(e));}).finally(()=>{if(!stopped)setLoading(false);});}
  return()=>{stopped=true;};
 },[search.id,search.isComplete]);
 const rows=useMemo(()=>responses.filter(r=>!isSourceBlocked(r.username)).flatMap(response=>[
  ...(response.files||[]).map(file=>({username:response.username,response,file,locked:false})),
  ...(response.lockedFiles||[]).map(file=>({username:response.username,response,file,locked:true}))
 ]),[responses]);
 const visible=useMemo(()=>{
  const filters=searches.parseFiltersFromString([filter,format].filter(Boolean).join(' '));
  return responses.filter(r=>!isSourceBlocked(r.username)&&(!freeOnly||r.hasFreeUploadSlot))
   .sort((a,b)=>Number(b.hasFreeUploadSlot)-Number(a.hasFreeUploadSlot)||b.uploadSpeed-a.uploadSpeed)
   .flatMap(response=>{const result=searches.filterResponse({response,filters});return [...(result.files||[]).map(file=>({username:response.username,response,file,locked:false})),...(result.lockedFiles||[]).map(file=>({username:response.username,response,file,locked:true}))];});
 },[responses,filter,format,freeOnly]);
 const chosen=rows.filter(r=>selected.has(key(r))&&!r.locked),first=chosen[0];
 const sameFolder=!!first&&chosen.every(r=>r.username===first.username&&getDirectoryName(r.file.filename)===getDirectoryName(first.file.filename));
 const pages=Math.max(1,Math.ceil(visible.length/100)),currentPage=Math.min(page,pages),shown=visible.slice((currentPage-1)*100,currentPage*100),available=shown.filter(r=>!r.locked);
 const download=async(list)=>{
  if(working||!list.length)return;
  if(list.length>5000){setError(t('Maximum number of selected files is limited to {0}. Narrow your selection.',[5000]));return;}
  setWorking(true);setError('');setNotice('');
  try{const users=new Map();for(const row of list){if(row.locked)continue;if(!users.has(row.username))users.set(row.username,new Map());users.get(row.username).set(row.file.filename,{filename:row.file.filename,size:row.file.size});}
   let count=0;for(const [username,files] of users){await transfers.download({username,files:[...files.values()]});count+=files.size;}
   setNotice(t('{0} file(s) added to downloads',[count]));setSelected(new Set());
  }catch(e){setError(errorText(e));}finally{setWorking(false);}
 };
 const downloadFolder=async()=>{
  if(!sameFolder||working)return;setWorking(true);setError('');
  try{const directory=getDirectoryName(first.file.filename),result=await getDirectoryContents({username:first.username,directory});
   const root=result?.find(d=>d.name===directory)||result?.[0];if(!root?.files?.length)throw new Error(t('No files match this filter'));
   if(root.files.length>5000)throw new Error(t('Maximum number of selected files is limited to {0}. Narrow your selection.',[5000]));
   const separator=directory.includes('\\')?'\\':'/';
   await transfers.download({username:first.username,files:root.files.map(file=>({filename:directory+separator+getFileName(file.filename),size:file.size}))});
   setNotice(t('{0} file(s) added to downloads',[root.files.length]));setSelected(new Set());
  }catch(e){setError(errorText(e));}finally{setWorking(false);}
 };
 const toggle=(row,checked)=>setSelected(old=>{const next=new Set(old);checked?next.add(key(row)):next.delete(key(row));return next;});
 return <section className="classic-search-results">
  <div className="classic-search-caption"><strong>{search.searchText}</strong><div><Button size="mini" icon="refresh" content={t('Search again')} disabled={disabled||creating||!search.isComplete} onClick={()=>onCreate({navigate:true,search:search.searchText})}/><Button size="mini" icon="bookmark outline" content={t('Save search')} onClick={()=>{saveWish(search.searchText);setNotice(t('Search saved'));}}/><Button size="mini" icon={search.isComplete?'close':'stop'} content={t(search.isComplete?'Close search':'Stop')} disabled={removing||stopping} onClick={()=>search.isComplete?onRemove(search):onStop(search)}/></div></div>
  <div className="classic-transfer-toolbar"><Button size="small" color="green" icon="download" content={t('Download selection')} loading={working} disabled={disabled||working||!chosen.length} onClick={()=>download(chosen)}/><Button size="small" icon="folder open outline" content={t('Download folder')} disabled={disabled||working||!sameFolder} onClick={downloadFolder}/>{first&&<Button as={Link} size="small" icon="user" content={t('Browse files')} to={{pathname:`${urlBase}/browse`,state:{user:first.username}}}/>}</div>
  <div className="classic-transfer-filterbar"><Input size="small" icon="filter" placeholder={t('Filter')} value={filter} onChange={(_,d)=>{setFilter(d.value);setPage(1);setSelected(new Set());}}/>
   <Dropdown compact selection aria-label={t('Format')} value={format} options={[{key:'all',value:'',text:t('All')},{key:'lossless',value:'islossless',text:t('Lossless')},{key:'mp3',value:'.mp3',text:'MP3'}]} onChange={(_,d)=>{setFormat(d.value);setPage(1);setSelected(new Set());}}/>
   <Checkbox label={t('Free upload slots only')} checked={freeOnly} onChange={(_,d)=>{setFreeOnly(d.checked);setPage(1);setSelected(new Set());}}/>
  </div>
  {error&&<Message negative role="alert">{error}</Message>}{notice&&<Message positive role="status">{notice}</Message>}
  {(!search.isComplete||loading)&&<p role="status">{loading?t('Loading results...'):t('Searching…')} · {search.fileCount||0} {t('Files')}</p>}
  <div className="classic-transfer-table"><Table compact selectable unstackable><Table.Header><Table.Row>
   <Table.HeaderCell collapsing><Checkbox aria-label={t('Select visible files')} checked={!!available.length&&available.every(r=>selected.has(key(r)))} onChange={(_,d)=>setSelected(old=>{const next=new Set(old);available.forEach(r=>d.checked?next.add(key(r)):next.delete(key(r)));return next;})}/></Table.HeaderCell>
   {['File','User','Directory','Size','Bitrate','Length','Speed','Queue'].map(label=><Table.HeaderCell key={label}>{t(label)}</Table.HeaderCell>)}
  </Table.Row></Table.Header><Table.Body>{shown.map(row=><Table.Row key={key(row)} active={selected.has(key(row))} className={row.locked?'classic-locked':''} onClick={event=>{if(!row.locked&&!event.target.closest?.("a,input,label,button,.checkbox"))setSelected(new Set([key(row)]));}} onDoubleClick={()=>!row.locked&&!disabled&&!working&&download([row])}>
   <Table.Cell collapsing><Checkbox aria-label={`${t('Select')} ${getFileName(row.file.filename)}`} disabled={row.locked||working} checked={selected.has(key(row))} onChange={(_,d)=>toggle(row,d.checked)}/></Table.Cell>
   <Table.Cell className="classic-file-cell" title={row.file.filename}>{row.locked?'🔒 ':''}{getFileName(row.file.filename)}</Table.Cell>
   <Table.Cell><Link to={{pathname:`${urlBase}/browse`,state:{user:row.username}}}>{row.username}</Link></Table.Cell>
   <Table.Cell className="classic-folder-cell" title={getDirectoryName(row.file.filename)}>{getDirectoryName(row.file.filename)}</Table.Cell>
   <Table.Cell>{formatBytes(row.file.size||0)}</Table.Cell><Table.Cell>{row.file.bitRate?`${row.file.bitRate} kbps`:row.file.bitDepth?`${row.file.bitDepth} bit`:'—'}</Table.Cell><Table.Cell>{formatSeconds(row.file.length)||'—'}</Table.Cell><Table.Cell>{formatBytes(row.response.uploadSpeed||0)}/s</Table.Cell><Table.Cell>{row.response.hasFreeUploadSlot?'✓':row.response.queueLength||'—'}</Table.Cell>
  </Table.Row>)}{!shown.length&&search.isComplete&&!loading&&<Table.Row><Table.Cell colSpan={9} className="classic-empty">{t('No files match this filter')}</Table.Cell></Table.Row>}</Table.Body></Table></div>
  <div className="classic-transfer-footer"><span>{t('{0} matching files',[visible.length])} · {t('{0} selected',[chosen.length])}</span><div><Button size="mini" icon="arrow left" aria-label={t('Previous')} disabled={currentPage<=1} onClick={()=>setPage(currentPage-1)}/><span>{currentPage} / {pages}</span><Button size="mini" icon="arrow right" aria-label={t('Next')} disabled={currentPage>=pages} onClick={()=>setPage(currentPage+1)}/></div></div>
 </section>;
}
