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
import React from 'react';
import { formatBytes } from '../lib/util';
export default function StudioTransferSummary({transfers,direction}) {
  const files=transfers.flatMap(u=>(u.directories||[]).flatMap(d=>d.files||[]));
  const done=files.filter(f=>f.state==='Completed, Succeeded');
  const active=files.filter(f=>f.state==='InProgress');
  const queue=files.filter(f=>f.state.includes('Queued')||f.state==='Requested');
  const errors=files.filter(f=>f.state.startsWith('Completed')&&!f.state.includes('Succeeded'));
  return <div className="studio-metrics">
    {[['Transferring',active.length,'live'],['Waiting for source',queue.length,'queue'],['Completed',done.length,'done'],['Needs attention',errors.length,'error']].map(([label,value,type])=><div className={`studio-metric ${type}`} key={label}><span>{label}</span><strong>{value.toLocaleString('en-US')}</strong><small>{type==='done'?formatBytes(done.reduce((sum,f)=>sum+f.size,0)):type==='live'?direction==='download'?'Downloading to your folder':'Uploading to the network':type==='queue'?'Queue position depends on the remote source':'Failed or cancelled'}</small></div>)}
  </div>;
}
