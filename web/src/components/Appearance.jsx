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
import React, { useState } from 'react';
import { Modal, Button, Menu, Icon } from 'semantic-ui-react';
import { themes, fonts, readAppearance, saveAppearance } from '../lib/appearance';
export default function Appearance() {
 const [open,setOpen]=useState(false), [value,setValue]=useState(readAppearance);
 const change=(key,next)=>{const updated={...value,[key]:next};setValue(updated);saveAppearance(updated);};
 return <><Menu.Item onClick={()=>setOpen(true)}><Icon name="paint brush"/>Appearance</Menu.Item>
 <Modal className="dc-appearance" size="small" open={open} onClose={()=>setOpen(false)} closeIcon>
 <Modal.Header>Appearance</Modal.Header><Modal.Content>
 <h3>Theme</h3><div className="dc-theme-grid">{Object.entries(themes).map(([id,label])=><button key={id} aria-pressed={value.theme===id} onClick={()=>change('theme',id)} className={'dc-theme dc-'+id}><span/><strong>{label}</strong>{value.theme===id&&<Icon name="check"/>}</button>)}</div>
 <h3>Font</h3><div className="dc-font-grid">{Object.entries(fonts).map(([id,label])=><button key={id} style={{fontFamily:id==='system'?'Segoe UI':label}} aria-pressed={value.font===id} onClick={()=>change('font',id)}><strong>Aa</strong>{label}</button>)}</div>
 <h3>Size</h3><div className="dc-sizes">{[[12,'Compact'],[13,'Default'],[14,'Comfortable']].map(([size,label])=><Button key={size} color={value.size===size?'green':undefined} onClick={()=>change('size',size)}>{label}</Button>)}</div>
 <p className="studio-note">Saved in this browser. Fonts are included locally; no external services.</p>
 </Modal.Content><Modal.Actions><Button color="green" onClick={()=>setOpen(false)}>Done</Button></Modal.Actions></Modal></>;
}
