import React from 'react';
import ReactDOM from 'react-dom';
import {act,Simulate} from 'react-dom/test-utils';
import {MemoryRouter,Route} from 'react-router-dom';
import Searches from './Searches';
import {createSearchHubConnection} from '../../lib/hubFactory';
import * as searches from '../../lib/searches';
import {toast} from 'react-toastify';
jest.mock('../../lib/searches',()=>({...jest.requireActual('../../lib/searches'),create:jest.fn()}));
jest.mock('react-toastify',()=>({toast:{error:jest.fn()}}));
jest.mock('../../lib/hubFactory',()=>({createSearchHubConnection:jest.fn()}));
beforeEach(()=>createSearchHubConnection.mockImplementation(()=>{
  const handlers={};return {on:(event,handler)=>{handlers[event]=handler;},
    onreconnecting:jest.fn(),onreconnected:jest.fn(),onclose:jest.fn(),
    start:async()=>handlers.list([]),stop:jest.fn(),emit:(event,value)=>handlers[event](value)};
}));
test('live search updates and parent refreshes preserve focus in another control',async()=>{
  localStorage.clear();const root=document.createElement('div'),other=document.createElement('button');
  other.textContent='Language control';document.body.append(root,other);
  const render=()=>ReactDOM.render(<MemoryRouter initialEntries={['/searches']}><Route path="/searches/:id?" render={()=><Searches server={{isConnected:true}}/>}/></MemoryRouter>,root);
  await act(async()=>{render();});
  expect(document.activeElement).toBe(root.querySelector('input[type="search"]'));
  other.focus();act(()=>{render();});expect(document.activeElement).toBe(other);
  act(()=>{createSearchHubConnection.mock.results[0].value.emit('list',[]);});
  expect(document.activeElement).toBe(other);
  act(()=>{ReactDOM.unmountComponentAtNode(root);});root.remove();other.remove();
});
test('the single Search button opens its results tab even before the hub announces the new search',async()=>{
 localStorage.clear();searches.create.mockResolvedValue({});const root=document.createElement('div');document.body.appendChild(root);
 await act(async()=>{ReactDOM.render(<MemoryRouter initialEntries={['/searches']}><Route path="/searches/:id?" render={()=><Searches server={{isConnected:true}}/>}/></MemoryRouter>,root);});
 const button=[...root.querySelectorAll('button')].find(b=>b.textContent==='Search');expect(button.disabled).toBe(true);
 act(()=>{Simulate.change(root.querySelector('input[type="search"]'),{target:{value:'Rare album'}});});
 await act(async()=>{Simulate.click(button);});
 expect(searches.create).toHaveBeenCalledWith({id:expect.any(String),searchText:'Rare album'});
 expect(root.querySelector('.classic-search-caption strong').textContent).toBe('Rare album');
 act(()=>{ReactDOM.unmountComponentAtNode(root);});root.remove();
});
test('leaving a search tab during negotiation does not show a stale connection error',async()=>{
 let rejectStart;createSearchHubConnection.mockImplementation(()=>({on:jest.fn(),onreconnecting:jest.fn(),onreconnected:jest.fn(),onclose:jest.fn(),start:()=>new Promise((_,reject)=>{rejectStart=reject;}),stop:jest.fn()}));
 const root=document.createElement('div');document.body.appendChild(root);
 await act(async()=>{ReactDOM.render(<MemoryRouter><Searches server={{isConnected:true}}/></MemoryRouter>,root);});
 act(()=>{ReactDOM.unmountComponentAtNode(root);});await act(async()=>{rejectStart(new Error('The connection was stopped during negotiation.'));});
 expect(toast.error).not.toHaveBeenCalled();root.remove();
});
