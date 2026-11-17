/* Copyright (c) 2026 slskprime contributors. AGPL-3.0-only with Additional Terms; see LICENSE. */
import * as transfers from './transfers';
import { transferRows } from './studio';

// Only transfer records are removed. No filesystem API is used.
// The snapshot prevents transfers started after confirmation from being cleared.
export async function clearTransferRecords({ records, direction = 'download', api = transfers,
  pause = () => new Promise(resolve => setTimeout(resolve, 400)) }) {
  const key = record => `${record.username}\n${record.id}`;
  if(records.some(record=>!record.id||!record.username))throw new Error('A transfer is missing its ID or user. Refresh the list and try again.');
  const targets = [...new Map(records.map(record => [key(record),record])).values()];
  const ids = new Set(targets.map(key));
  let pending = targets, latest = [];
  let lastError;
  for (let attempt = 0; attempt < 12 && pending.length; attempt++) {
    let next = 0;
    await Promise.all(Array.from({length:Math.min(4,pending.length)},async()=>{
      while(next < pending.length) {
        const record=pending[next++];
        try { await api.cancel({direction,username:record.username,id:record.id,remove:true}); }
        catch(error) { if(error.response?.status!==404)lastError=error; }
      }
    }));
    if(attempt > 0) await pause();
    const response = await api.getAll({direction});
    if(!Array.isArray(response))throw new Error('Could not refresh the download list.');
    latest=response;
    pending=transferRows(latest).filter(row=>ids.has(key({username:row.username,id:row.file.id})))
      .map(row=>({username:row.username,id:row.file.id}));
  }
  return { latest, cleared:targets.length-pending.length, remaining:pending.length,
    error:pending.length&&lastError?(lastError.response?.data?.message||lastError.message||'Request failed'):null };
}
