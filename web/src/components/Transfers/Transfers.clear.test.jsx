import React from 'react';
import ReactDOM from 'react-dom';
import {act,Simulate} from 'react-dom/test-utils';
import Transfers from './Transfers';
import * as api from '../../lib/transfers';
jest.mock('../../lib/transfers',()=>({getAll:jest.fn(),isStateRetryable:()=>false,isStateCancellable:()=>false}));
jest.mock('./TransferGroup',()=>()=>null);
test('Clear all counts the whole download list regardless of text filters and pagination',async()=>{
  const files=Array.from({length:52},(_,i)=>({id:String(i),filename:i===0?'rare.flac':`track-${i}.flac`,direction:'Download',state:'Completed, Succeeded',size:1}));
  api.getAll.mockResolvedValue([{username:'peer',directories:[{directory:'album',files}]}]);
  const root=document.createElement('div');document.body.appendChild(root);
  await act(async()=>{ReactDOM.render(<Transfers direction="download" server={{isConnected:true}}/>,root);});
  const input=root.querySelector('input');act(()=>{Simulate.change(input,{target:{value:'rare'}});});
  expect(root.textContent).toContain('1 matching files');
  const button=[...root.querySelectorAll('button')].find(b=>b.textContent==='Clear all');
  act(()=>{Simulate.click(button);});
  expect(document.body.textContent).toContain('Remove all 52 entries');
  act(()=>{ReactDOM.unmountComponentAtNode(root);});root.remove();
});
