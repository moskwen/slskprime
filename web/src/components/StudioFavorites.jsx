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
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { urlBase } from '../config';
import * as users from '../lib/users';
import { Button, Input, Modal, TextArea } from 'semantic-ui-react';
import { getInstallationContacts } from '../lib/installationContacts';
const key = 'slskd-studio-favorites-v1';
export function getFavorites() { try { const list=JSON.parse(localStorage.getItem(key)); return Array.isArray(list)?list:getInstallationContacts(); } catch { return getInstallationContacts(); } }
export function isFavorite(name) { return getFavorites().some(n=>n.toLowerCase()===name.toLowerCase()); }
export function toggleFavorite(name) { const list=getFavorites();const found=isFavorite(name);localStorage.setItem(key,JSON.stringify(found?list.filter(n=>n.toLowerCase()!==name.toLowerCase()):[...list,name]));return !found; }
const labels={Online:'Online',Away:'Away',Offline:'Offline',Unknown:'No response'};
export default function StudioFavorites() {
 const [noteUser,setNoteUser]=useState(null),[note,setNote]=useState('');
 const editNote=name=>{setNoteUser(name);let notes={};try{notes=JSON.parse(localStorage.getItem('soulspool-user-notes-v1'))||{};}catch{}setNote(notes[name]||'');};
 const saveNote=()=>{let notes={};try{notes=JSON.parse(localStorage.getItem('soulspool-user-notes-v1'))||{};}catch{}if(note.trim())notes[noteUser]=note.trim();else delete notes[noteUser];localStorage.setItem('soulspool-user-notes-v1',JSON.stringify(notes));setNoteUser(null);};
 const [list,setList]=useState(getFavorites); const [query,setQuery]=useState('');
 const [status,setStatus]=useState({}); const [refreshing,setRefreshing]=useState(false);
 const [onlyOnline,setOnlyOnline]=useState(false);const [checked,setChecked]=useState(0);
 const cancelled=useRef(false);const refreshingRef=useRef(false);
 const refresh=async()=>{
  if(refreshingRef.current)return;refreshingRef.current=true;setRefreshing(true);setChecked(0);
  const names=getFavorites();let next=0;let finished=0;let pending={};
  await Promise.all(Array.from({length:4},async()=>{
   while(next<names.length&&!cancelled.current){
    const name=names[next++];let presence='Unknown';
    try{const response=await users.getStatus({username:name});presence=response.data.presence||'Unknown';}catch{}
    if(!cancelled.current){pending[name]=presence;finished++;if(finished%8===0||finished===names.length){const batch=pending;pending={};setStatus(old=>({...old,...batch}));setChecked(finished);}}
   }
  }));
  refreshingRef.current=false;if(!cancelled.current)setRefreshing(false);
 };
 useEffect(()=>{cancelled.current=false;refresh();return()=>{cancelled.current=true;};},[]);
 const download=()=>{const a=document.createElement('a');const url=URL.createObjectURL(new Blob([list.join('\n')],{type:'text/plain;charset=utf-8'}));a.href=url;a.download='slskprime-users.txt';a.click();URL.revokeObjectURL(url);};
 const add=()=>{const name=query.trim();if(name&&!isFavorite(name)){toggleFavorite(name);setList(getFavorites());}};
 const online=list.filter(n=>['Online','Away'].includes(status[n])).length;
 const visible=list.filter(n=>n.toLowerCase().includes(query.toLowerCase())).filter(n=>!onlyOnline||['Online','Away'].includes(status[n])).sort((a,b)=>a.localeCompare(b));
 return <div className="studio-users view"><Modal size="tiny" open={Boolean(noteUser)} onClose={()=>setNoteUser(null)} closeIcon><Modal.Header>Note · {noteUser}</Modal.Header><Modal.Content><TextArea aria-label="Personal note" style={{width:'100%',minHeight:130}} maxLength={4000} value={note} onChange={(_,d)=>setNote(d.value)}/><p className="studio-note">Private, saved in this browser.</p></Modal.Content><Modal.Actions><Button onClick={()=>setNoteUser(null)}>Cancel</Button><Button color="green" onClick={saveNote}>Save</Button></Modal.Actions></Modal>
  <div className="studio-user-toolbar"><div><strong>{list.length} users</strong><span>{online} online or away{refreshing?` · checking ${checked}/${list.length}`:''}</span></div><div><Button size="small" icon="refresh" content="Refresh presence" loading={refreshing} disabled={refreshing} onClick={refresh}/><Button size="small" icon="download" content="Export list" onClick={download}/><Button as={Link} to={`${urlBase}/user-info`} size="small" icon="user" content="Look up another user"/></div></div>
  <div className="studio-user-filters"><Input fluid icon="search" placeholder="Filter your user list…" value={query} onChange={(_,d)=>setQuery(d.value)}/><Button basic={onlyOnline} color={!onlyOnline?'green':undefined} content="All" onClick={()=>setOnlyOnline(false)}/><Button basic={!onlyOnline} color={onlyOnline?'green':undefined} content="Online" onClick={()=>setOnlyOnline(true)}/>{query.trim()&&!isFavorite(query.trim())&&<Button icon="plus" content="Add user" onClick={add}/>}</div>
  <div className="studio-user-list"><div className="studio-user-columns"><span>User</span><span>Presence</span><span>Shared files</span></div>
   {visible.map(name=><div className="studio-user-row" key={name}><Link className="studio-user-name" to={{pathname:`${urlBase}/browse`,state:{user:name}}}><span className={'studio-presence '+(status[name]||'Unchecked').toLowerCase()}/>{name}</Link><span className="studio-user-status">{status[name]?labels[status[name]]||status[name]:'Checking…'}</span><div className="studio-user-actions"><Button size="small" icon="sticky note outline" title="Personal note" onClick={()=>editNote(name)}/><Button as={Link} to={{pathname:`${urlBase}/browse`,state:{user:name}}} size="small" color="green" icon="folder open outline" content="Browse files"/><Button as={Link} to={{pathname:`${urlBase}/user-info`,state:{user:name}}} size="small" icon="info circle" title="User information"/><Button size="small" icon="star" title="Remove from this browser list" onClick={()=>{toggleFavorite(name);setList(getFavorites());}}/></div></div>)}
   {!visible.length&&<p className="studio-note">No users match your filter.</p>}
  </div>
 </div>;
}
