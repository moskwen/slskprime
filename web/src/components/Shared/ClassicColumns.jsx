/* Copyright (c) 2026 slskprime contributors. AGPL-3.0-only; see LICENSE. */
import React, {useEffect, useRef, useState} from 'react';
import {t} from '../../lib/i18n';
export function useClassicColumns(storageKey) {
 const [widths,setWidths]=useState(()=>{try{return JSON.parse(localStorage.getItem(storageKey))||{};}catch{return {};}});
 const cleanup=useRef(()=>{});
 useEffect(()=>()=>cleanup.current(),[]);
 const resize=(name,width)=>setWidths(old=>{const next={...old,[name]:Math.max(70,Math.min(900,width))};try{localStorage.setItem(storageKey,JSON.stringify(next));}catch{}return next;});
 const start=(event,name)=>{
  event.preventDefault();event.stopPropagation();cleanup.current();
  const x=event.clientX,width=event.currentTarget.parentElement.getBoundingClientRect().width;
  const move=e=>resize(name,width+e.clientX-x);
  const stop=()=>{window.removeEventListener('mousemove',move);window.removeEventListener('mouseup',stop);};
  cleanup.current=stop;window.addEventListener('mousemove',move);window.addEventListener('mouseup',stop);
 };
 return {widths,start,resize};
}
export default function ClassicColumn({name,columns,sort,onSort}) {
 return <th style={{width:columns.widths[name]||({File:290,User:120,Directory:260,Size:100,Quality:100,Attributes:150,Length:90,Speed:110,Queue:80}[name])}} aria-sort={sort?.key===name?(sort.desc?'descending':'ascending'):'none'} className="classic-column">
  <button type="button" className="classic-column-sort" onClick={()=>onSort(name)}>{t(name)}{sort?.key===name?(sort.desc?' ▾':' ▴'):''}</button>
  <span role="separator" tabIndex={0} aria-label={`${t('Resize column')}: ${t(name)}`} aria-orientation="vertical" className="classic-column-grip" onMouseDown={e=>columns.start(e,name)} onKeyDown={e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();columns.resize(name,(columns.widths[name]||140)+(e.key==='ArrowRight'?20:-20));}}}/>
 </th>;
}
export function compareValues(a,b) {return typeof a==='number'&&typeof b==='number'?a-b:String(a??'').localeCompare(String(b??''),undefined,{numeric:true,sensitivity:'base'});}
