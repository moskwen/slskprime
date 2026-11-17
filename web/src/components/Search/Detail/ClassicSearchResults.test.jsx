import React from 'react';
import ReactDOM from 'react-dom';
import {act,Simulate} from 'react-dom/test-utils';
import {MemoryRouter} from 'react-router-dom';
import Results from './ClassicSearchResults';
import * as searches from '../../../lib/searches';
import * as transfers from '../../../lib/transfers';
import * as users from '../../../lib/users';
jest.mock('../../../lib/searches',()=>({...jest.requireActual('../../../lib/searches'),getResponses:jest.fn()}));
jest.mock('../../../lib/transfers',()=>({download:jest.fn()}));
jest.mock('../../../lib/users',()=>({getDirectoryContents:jest.fn()}));
let root;
beforeEach(()=>{jest.clearAllMocks();localStorage.clear();root=document.createElement('div');document.body.appendChild(root);searches.getResponses.mockResolvedValue([{username:'peer',hasFreeUploadSlot:true,uploadSpeed:1000,files:[{filename:'Music\\Album\\one.flac',size:100,bitDepth:16,sampleRate:44100}],lockedFiles:[{filename:'Music\\Locked\\private.flac',size:200}]}]);transfers.download.mockResolvedValue({});});
afterEach(()=>{act(()=>{ReactDOM.unmountComponentAtNode(root);});root.remove();});
const render=async()=>{await act(async()=>{ReactDOM.render(<MemoryRouter><Results search={{id:'test',searchText:'Album',isComplete:true}}/></MemoryRouter>,root);});};
test('a row selects the exact file and Download selection queues its original peer and path',async()=>{
 await render();expect(root.querySelector('.classic-format-filter .text').textContent).toBe('All');
 const row=[...root.querySelectorAll('tbody tr')].find(r=>r.textContent.includes('one.flac'));
 act(()=>{Simulate.click(row.querySelector('.classic-file-cell'));});
 const download=[...root.querySelectorAll('button')].find(b=>b.textContent==='Download selection');
 expect(download.disabled).toBe(false);await act(async()=>{Simulate.click(download);});
 expect(transfers.download).toHaveBeenCalledWith({username:'peer',files:[{filename:'Music\\Album\\one.flac',size:100}]});
 expect(root.textContent).toContain('1 file(s) added to downloads');expect(root.querySelector('.classic-locked input').disabled).toBe(true);
});
test('Download folder fetches the complete remote directory, rather than downloading only matching search hits',async()=>{
 users.getDirectoryContents.mockResolvedValue([{name:'Music\\Album',files:[{filename:'one.flac',size:100},{filename:'two.flac',size:200}]}]);
 await render();act(()=>{Simulate.click(root.querySelector('tbody tr .classic-file-cell'));});
 const download=[...root.querySelectorAll('button')].find(b=>b.textContent==='Download folder');
 await act(async()=>{Simulate.click(download);});
 expect(users.getDirectoryContents).toHaveBeenCalledWith({username:'peer',directory:'Music\\Album'});
 expect(transfers.download).toHaveBeenCalledWith({username:'peer',files:[{filename:'Music\\Album\\one.flac',size:100},{filename:'Music\\Album\\two.flac',size:200}]});
});

test('numeric sorting, Ctrl/Shift selection and keyboard resizing work together',async()=>{
 searches.getResponses.mockResolvedValue([{username:'peer',files:[{filename:'Music/a.flac',size:100},{filename:'Music/b.flac',size:20},{filename:'Music/c.flac',size:300}]}]);
 await render();
 const size=[...root.querySelectorAll('th button')].find(b=>b.textContent==='Size');
 act(()=>Simulate.click(size));
 expect([...root.querySelectorAll('.classic-file-cell')].map(c=>c.textContent)).toEqual(['b.flac','a.flac','c.flac']);
 let cells=root.querySelectorAll('.classic-file-cell');
 act(()=>Simulate.click(cells[0]));act(()=>Simulate.click(cells[2],{shiftKey:true}));
 expect(root.querySelectorAll('tbody tr.active')).toHaveLength(3);
 act(()=>Simulate.click(cells[1],{ctrlKey:true}));expect(root.querySelectorAll('tbody tr.active')).toHaveLength(2);
 act(()=>Simulate.keyDown(root.querySelector('[aria-label="Resize column: Size"]'),{key:'ArrowRight'}));
 expect(JSON.parse(localStorage.getItem('slskprime-search-columns-v1')).Size).toBe(120);
});
test('right click offers actions on the chosen peer and opens its exact folder',async()=>{
 await render();act(()=>Simulate.contextMenu(root.querySelector('tbody tr'),{clientX:40,clientY:40}));
 expect(root.querySelector('[role="menu"]')).not.toBeNull();
 act(()=>window.dispatchEvent(new Event('scroll')));
 expect(root.querySelector('[role="menu"]')).not.toBeNull();
 const add=[...root.querySelectorAll('[role="menuitem"]')].find(b=>b.textContent==='Add user');
 act(()=>Simulate.click(add));
 expect(JSON.parse(localStorage.getItem('slskd-studio-favorites-v1'))).toContain('peer');
 expect(root.querySelector('[role="menu"]')).toBeNull();
 expect(transfers.download).not.toHaveBeenCalled();
});
