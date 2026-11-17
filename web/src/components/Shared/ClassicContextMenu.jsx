/* Copyright (c) 2026 slskprime contributors. AGPL-3.0-only; see LICENSE. */
import React,{useEffect,useRef} from 'react';
export default function ClassicContextMenu({position,onClose,items}) {
 const ref=useRef();
 useEffect(()=>{if(!position)return;const dismiss=e=>{if(!ref.current?.contains(e.target))onClose();};const key=e=>{if(e.key==='Escape')onClose();};document.addEventListener('mousedown',dismiss);document.addEventListener('keydown',key);ref.current?.querySelector('button:not(:disabled)')?.focus({preventScroll:true});return()=>{document.removeEventListener('mousedown',dismiss);document.removeEventListener('keydown',key);};},[position,onClose]);
 if(!position)return null;
 return <div ref={ref} className="classic-context-menu" role="menu" style={{left:Math.max(0,Math.min(position.x,window.innerWidth-250)),top:Math.max(0,Math.min(position.y,window.innerHeight-items.length*38-16))}} onKeyDown={e=>{if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();const buttons=[...ref.current.querySelectorAll('button:not(:disabled)')];const i=buttons.indexOf(document.activeElement);buttons[(i+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length]?.focus();}}}>{items.map(item=><button type="button" role="menuitem" key={item.label} disabled={item.disabled} onClick={()=>{onClose();item.action();}}>{item.label}</button>)}</div>;
}
