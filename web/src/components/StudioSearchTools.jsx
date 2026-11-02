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
import React,{useEffect,useState} from 'react';
import {Link,useHistory} from 'react-router-dom';
import {Button,Input,Modal} from 'semantic-ui-react';
import {toast} from 'react-toastify';
import {v4 as uuid} from 'uuid';
import {urlBase} from '../config';
import * as searches from '../lib/searches';
import {getWishes,saveWish,removeWish,markWishRun,getBlockedSources,unblockSource} from '../lib/studio';
export default function StudioSearchTools({searches:historySearches={}}){
 const [wishes,setWishes]=useState(getWishes);const [blocked,setBlocked]=useState(getBlockedSources);const [query,setQuery]=useState('');
 const [running,setRunning]=useState(false);const [clearOpen,setClearOpen]=useState(false);const [clearing,setClearing]=useState(false);const history=useHistory();
 useEffect(()=>{const update=()=>{setWishes(getWishes());setBlocked(getBlockedSources());};window.addEventListener('studio-preferences',update);return()=>window.removeEventListener('studio-preferences',update);},[]);
 const run=async(wish,navigate=true)=>{const id=uuid();await searches.create({id,searchText:wish.query});markWishRun(wish.query,id);if(navigate)history.push(`${urlBase}/searches/${id}`);};
 const runOne=async(w)=>{setRunning(true);try{await run(w);}catch(e){toast.error(e?.response?.data||e.message);}finally{setRunning(false);}};
 const runAll=async()=>{setRunning(true);let count=0;try{for(const wish of wishes){await run(wish,false);count++;await new Promise(resolve=>window.setTimeout(resolve,1000));}toast.success(`${count} searches started`);}catch(e){toast.error(`${count} searches started. ${e?.response?.data||e.message}`);}finally{setRunning(false);}};
 const ended=Object.values(historySearches).filter(s=>s.isComplete);
 const clear=async()=>{setClearing(true);try{for(const search of ended)await searches.remove({id:search.id});setClearOpen(false);toast.success('Completed search history cleared');}catch(e){toast.error(e?.response?.data||e.message);}finally{setClearing(false);}};
 return <section className="studio-saved-searches">
  <div className="studio-tools-heading"><div><strong>Saved searches</strong><small>Run again anytime · saved in this browser</small></div><div><Button size="small" icon="play" content="Run all" disabled={!wishes.length||running} loading={running} onClick={runAll}/><Button size="small" icon="trash alternate outline" content="Clear completed searches" disabled={!ended.length||running} onClick={()=>setClearOpen(true)}/></div></div>
  <form className="studio-save-form" onSubmit={e=>{e.preventDefault();saveWish(query);setQuery('');}}><Input placeholder="Save a search for later…" value={query} onChange={(_,d)=>setQuery(d.value)}/><Button type="submit" size="small" icon="bookmark outline" content="Save" disabled={!query.trim()}/></form>
  {wishes.map(w=><div className="studio-saved-row" key={w.query}><div><strong>{w.query}</strong><small>{w.lastRunAt?`Last run: ${new Date(w.lastRunAt).toLocaleString('en-US')}`:'Not run yet'}</small></div><div>{w.lastSearchId&&<Button as={Link} to={`${urlBase}/searches/${w.lastSearchId}`} size="small" content="Results"/>}<Button size="small" icon="search" content="Search" disabled={running} onClick={()=>runOne(w)}/><Button size="small" icon="bookmark" title="Remove from saved searches" disabled={running} onClick={()=>removeWish(w.query)}/></div></div>)}
  {blocked.length>0&&<details className="studio-blocked"><summary>Sources hidden from results ({blocked.length})</summary>{blocked.map(name=><div key={name}><span>{name}</span><Button size="mini" content="Show again" onClick={()=>unblockSource(name)}/></div>)}</details>}
  <Modal open={clearOpen} size="tiny" onClose={()=>!clearing&&setClearOpen(false)}><Modal.Header>Clear completed searches?</Modal.Header><Modal.Content>Remove {ended.length} searches from history. Downloads and saved searches are kept.</Modal.Content><Modal.Actions><Button content="Back" disabled={clearing} onClick={()=>setClearOpen(false)}/><Button negative content="Clear history" loading={clearing} disabled={clearing} onClick={clear}/></Modal.Actions></Modal>
 </section>;
}
