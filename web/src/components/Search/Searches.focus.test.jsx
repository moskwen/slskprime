import React from 'react';
import ReactDOM from 'react-dom';
import {act} from 'react-dom/test-utils';
import {MemoryRouter,Route} from 'react-router-dom';
import Searches from './Searches';
import {createSearchHubConnection} from '../../lib/hubFactory';
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
