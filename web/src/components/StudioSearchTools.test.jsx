import React from 'react';
import ReactDOM from 'react-dom';
import {act,Simulate} from 'react-dom/test-utils';
import {MemoryRouter} from 'react-router-dom';
import StudioSearchTools from './StudioSearchTools';
import {saveWish,getWishes} from '../lib/studio';
jest.mock('../lib/searches',()=>({create:jest.fn().mockResolvedValue({})}));
test('existing searches default to manual and a user can enable a repeating schedule',()=>{
  localStorage.clear();saveWish('Rare album');
  const root=document.createElement('div');document.body.appendChild(root);
  act(()=>{ReactDOM.render(<MemoryRouter><StudioSearchTools/></MemoryRouter>,root);});
  expect(root.textContent).toContain('Manual only');
  const option=[...root.querySelectorAll('[role="option"]')].find(e=>e.textContent==='Every hour');
  act(()=>Simulate.click(option));
  expect(getWishes()[0].intervalMinutes).toBe(60);
  expect(root.textContent).toContain('while this app is open');
  act(()=>{ReactDOM.unmountComponentAtNode(root);});root.remove();
});
