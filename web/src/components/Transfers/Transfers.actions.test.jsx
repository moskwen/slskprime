import React from 'react';
import ReactDOM from 'react-dom';
import {act,Simulate} from 'react-dom/test-utils';
import {MemoryRouter} from 'react-router-dom';
import Transfers from './Transfers';
import * as api from '../../lib/transfers';
jest.mock('../../lib/transfers',()=>({getAll:jest.fn(),clearCompleted:jest.fn(),cancel:jest.fn(),download:jest.fn()}));
let root;
const sample=[{username:'peer',directories:[{directory:'Album',files:[{id:'completed',filename:'Album\\done.flac',state:'Completed, Succeeded',size:100},{id:'queued',filename:'Album\\wait.flac',state:'Queued, Remotely',size:100}]}]}];
beforeEach(()=>{jest.clearAllMocks();localStorage.clear();sessionStorage.clear();root=document.createElement('div');document.body.appendChild(root);api.getAll.mockResolvedValue(sample);});
afterEach(()=>{act(()=>{ReactDOM.unmountComponentAtNode(root);});root.remove();});
const render=async()=>{await act(async()=>{ReactDOM.render(<MemoryRouter><Transfers direction="download" server={{isConnected:true}}/></MemoryRouter>,root);});};
test('Clear completed uses one bulk request and immediately refreshes the visible list',async()=>{
 await render();api.clearCompleted.mockResolvedValue({});api.getAll.mockResolvedValue([{username:'peer',directories:[{directory:'Album',files:[sample[0].directories[0].files[1]]}]}]);
 const button=[...root.querySelectorAll('button')].find(b=>b.textContent==='Clear completed');await act(async()=>{Simulate.click(button);});
 expect(api.clearCompleted).toHaveBeenCalledWith({direction:'download'});expect(root.textContent).not.toContain('done.flac');expect(root.textContent).toContain('wait.flac');
});
test('a failed clear shows the server error instead of silently doing nothing',async()=>{
 await render();api.clearCompleted.mockRejectedValue(new Error('Backend refused the operation'));
 await act(async()=>{Simulate.click([...root.querySelectorAll('button')].find(b=>b.textContent==='Clear completed'));});
 expect(root.querySelector('[role="alert"]').textContent).toContain('Backend refused the operation');expect(root.textContent).toContain('done.flac');
});

test('group cancellation targets the complete album across pages and leaves another peer alone',async()=>{
 const files=Array.from({length:105},(_,i)=>({id:'q'+i,filename:'Album/track'+i+'.flac',state:'Queued, Remotely',size:100}));
 const other={username:'other',directories:[{directory:'Album',files:[{id:'other',filename:'Album/other.flac',state:'Queued, Remotely',size:100}]}]};
 api.cancel.mockResolvedValue({});api.getAll.mockResolvedValue([{username:'peer',directories:[{directory:'Album',files}]},other]);
 await render();const folder=[...root.querySelectorAll('.classic-transfer-group-folder')].find(r=>r.textContent.includes('105 matching files'));
 await act(async()=>Simulate.click(folder.querySelector('[title="Cancel group"]')));
 expect(api.cancel).toHaveBeenCalledTimes(105);expect(api.cancel.mock.calls.every(([arg])=>arg.username==='peer')).toBe(true);
});
test('collapsing an album preserves its state after leaving the tab',async()=>{
 await render();const toggle=root.querySelector('.classic-transfer-group-folder .classic-group-toggle');act(()=>Simulate.click(toggle));expect(root.textContent).not.toContain('wait.flac');
 act(()=>ReactDOM.unmountComponentAtNode(root));await render();expect(root.querySelector('.classic-transfer-group-folder .classic-group-toggle').getAttribute('aria-expanded')).toBe('false');
});
