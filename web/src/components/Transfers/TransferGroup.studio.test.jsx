import React from 'react';
import ReactDOM from 'react-dom';
import {act,Simulate} from 'react-dom/test-utils';
import {MemoryRouter,Route,Switch} from 'react-router-dom';
import TransferGroup from './TransferGroup';
test.each([['profile','View user profile','/user-info'],['library','Browse files','/browse']])('transfer %s shortcut opens the correct peer',(_,label,path)=>{
  const root=document.createElement('div');document.body.appendChild(root);
  act(()=>{ReactDOM.render(<MemoryRouter initialEntries={['/uploads']}><Switch><Route path="/uploads" render={()=><TransferGroup direction="upload" user={{username:'Test peer',directories:[]}}/>}/><Route path={path} render={({location})=><div data-testid="peer">{location.state.user}</div>}/></Switch></MemoryRouter>,root);});
  const link=[...root.querySelectorAll('a')].find(e=>e.title===label||e.textContent===label);
  expect(link.getAttribute('href')).toBe(path);act(()=>{Simulate.click(link,{button:0});});
  expect(root.querySelector('[data-testid="peer"]').textContent).toBe('Test peer');
  act(()=>{ReactDOM.unmountComponentAtNode(root);});root.remove();
});
