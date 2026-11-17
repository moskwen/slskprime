/* Copyright (c) 2026 slskprime contributors. AGPL-3.0-only with Additional Terms; see LICENSE. */
import {useEffect,useRef,useState} from 'react';
const prefix='slskprime-view-v1:';
export function readView(key,fallback){try{const value=JSON.parse(sessionStorage.getItem(prefix+key));return value===null?fallback:value;}catch{return fallback;}}
export function writeView(key,value){try{sessionStorage.setItem(prefix+key,JSON.stringify(value));}catch{}}
export function useViewState(key,initial){
 const [entry,setEntry]=useState(()=>({key,value:readView(key,initial)}));
 const value=entry.key===key?entry.value:readView(key,initial);
 const current=useRef({key,value});current.current={key,value};
 const set=next=>{const value=typeof next==='function'?next(current.current.value):next;current.current={key,value};writeView(key,value);setEntry({key,value});};
 return [value,set];
}
export function useViewScroll(key,ready=true){
 const root=useRef();
 useEffect(()=>{
  if(!ready||!root.current)return;
  const saved=readView(key+':scroll',null);let frame;
  const restore=()=>{if(saved){window.scrollTo(saved.x||0,saved.y||0);for(const el of root.current?.querySelectorAll('[data-scroll-region]')||[]){const p=saved.regions?.[el.dataset.scrollRegion];if(p){el.scrollTop=p.y;el.scrollLeft=p.x;}}}};
  frame=requestAnimationFrame(restore);
  const save=event=>{if(event.target!==document&&!root.current?.contains(event.target))return;const regions={};for(const el of root.current?.querySelectorAll('[data-scroll-region]')||[])regions[el.dataset.scrollRegion]={x:el.scrollLeft,y:el.scrollTop};writeView(key+':scroll',{x:window.scrollX,y:window.scrollY,regions});};
  document.addEventListener('scroll',save,true);
  return()=>{cancelAnimationFrame(frame);document.removeEventListener('scroll',save,true);};
 },[key,ready]);
 return root;
}
