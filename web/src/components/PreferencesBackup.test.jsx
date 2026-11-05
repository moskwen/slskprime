import React from 'react';
import ReactDOM from 'react-dom';
import { act, Simulate } from 'react-dom/test-utils';
import PreferencesBackup from './PreferencesBackup';
import { createPreferencesBackup } from '../lib/preferencesBackup';

test('backup importer previews valid files and rejects invalid files without modifying saved contacts',async()=>{
  localStorage.clear();localStorage.setItem('slskd-studio-favorites-v1','["Keep"]');
  const root=document.createElement('div');document.body.appendChild(root);
  act(()=>{ReactDOM.render(<PreferencesBackup/>,root);});
  act(()=>Simulate.click(root.querySelector('.item')));
  const input=document.querySelector('input[type="file"]');
  await act(async()=>{Simulate.change(input,{target:{files:[{size:10,text:async()=>'{}'}],value:''}});});
  expect(document.body.textContent).toContain('Invalid slskprime backup');
  const text=JSON.stringify(createPreferencesBackup());
  await act(async()=>{Simulate.change(input,{target:{files:[{size:text.length,text:async()=>text}],value:''}});});
  expect(document.body.textContent).toContain('Ready to import');
  expect(document.body.textContent).toContain('1 contacts');
  expect(localStorage.getItem('slskd-studio-favorites-v1')).toBe('["Keep"]');
  act(()=>{ReactDOM.unmountComponentAtNode(root);});root.remove();
});
