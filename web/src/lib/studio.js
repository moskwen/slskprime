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
const wishesKey='slskd-studio-wishes-v1';
const blockedKey='slskd-studio-blocked-v1';
const read=(key)=>{try{const data=JSON.parse(localStorage.getItem(key));return Array.isArray(data)?data:[];}catch{return[];}};
const write=(key,data)=>{localStorage.setItem(key,JSON.stringify(data));window.dispatchEvent(new Event('studio-preferences'));return data;};
export const getWishes=()=>read(wishesKey);
export const saveWish=(query)=>{
 const text=query.trim();if(!text)return getWishes();const current=getWishes();
 if(current.some(w=>w.query.toLowerCase()===text.toLowerCase()))return current;
 return write(wishesKey,[...current,{query:text,lastRunAt:null,lastSearchId:null}]);
};
export const removeWish=(query)=>write(wishesKey,getWishes().filter(w=>w.query!==query));
export const markWishRun=(query,id)=>write(wishesKey,getWishes().map(w=>w.query===query?{...w,lastRunAt:new Date().toISOString(),lastSearchId:id}:w));
export const getBlockedSources=()=>read(blockedKey);
export const isSourceBlocked=(name)=>getBlockedSources().some(n=>n.toLowerCase()===name.toLowerCase());
export const blockSource=(name)=>{if(!isSourceBlocked(name))write(blockedKey,[...getBlockedSources(),name]);};
export const unblockSource=(name)=>write(blockedKey,getBlockedSources().filter(n=>n!==name));
export const matchesTransferState=(file,filter)=>{
 const s=file.state||'';
 return filter==='all'||(filter==='active'&&['InProgress','Initializing'].includes(s))||(filter==='queued'&&(s.includes('Queued')||s==='Requested'))||(filter==='done'&&s==='Completed, Succeeded')||(filter==='error'&&s.startsWith('Completed')&&s!=='Completed, Succeeded');
};
export const transferRows=(groups,filter='all',query='')=>{
 const q=query.toLowerCase();return groups.flatMap(u=>(u.directories||[]).flatMap(d=>(d.files||[]).map(file=>({username:u.username,directory:d.directory,file})))).filter(r=>matchesTransferState(r.file,filter)&&(!q||[r.username,r.directory,r.file.filename].join(' ').toLowerCase().includes(q)));
};
export const groupTransferRows=(rows)=>{
 const users=new Map();for(const r of rows){if(!users.has(r.username))users.set(r.username,{username:r.username,directories:[]});const user=users.get(r.username);let dir=user.directories.find(d=>d.directory===r.directory);if(!dir){dir={directory:r.directory,files:[]};user.directories.push(dir);}dir.files.push(r.file);}return [...users.values()];
};
