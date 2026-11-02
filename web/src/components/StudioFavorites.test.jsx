/*
 * Copyright (c) 2026 slskprime contributors.
 * Modified: independent branding, English UI, compact design and browser-local discovery tools.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, version 3.
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 * This program is distributed with Additional Terms pursuant to Section 7
 * of the AGPLv3. See the LICENSE file for the complete terms and conditions.
 */
import React from 'react';
import ReactDOM from 'react-dom';
import { act, Simulate } from 'react-dom/test-utils';
import { MemoryRouter, Route, Switch } from 'react-router-dom';
import StudioFavorites from './StudioFavorites';
const recovered=['example-listener','demo-collector','test-browser'];
jest.mock('../lib/users',()=>({getStatus:jest.fn(()=>new Promise(()=>{}))}));
test('shows the complete contact list and opens the correct contact in the file browser',async()=>{
 localStorage.clear();localStorage.setItem('slskd-studio-favorites-v1',JSON.stringify(recovered));const root=document.createElement('div');document.body.appendChild(root);
 await act(async()=>{ReactDOM.render(<MemoryRouter initialEntries={['/users']}><Switch><Route exact path="/users" component={StudioFavorites}/><Route path="/browse" render={({location})=><div data-testid="target">{location.state.user}</div>}/></Switch></MemoryRouter>,root);});
 expect(root.querySelectorAll('.studio-user-row')).toHaveLength(recovered.length);
 const input=root.querySelector('input');
 act(()=>{Simulate.change(input,{target:{value:'test-browser'}});});
 expect(root.querySelectorAll('.studio-user-row')).toHaveLength(1);
 const link=[...root.querySelectorAll('a')].find(a=>a.textContent.includes('Browse files'));
 expect(link.getAttribute('href')).toBe('/browse');
 act(()=>{Simulate.click(link,{button:0});});
 expect(root.querySelector('[data-testid="target"]').textContent).toBe('test-browser');
 act(()=>{ReactDOM.unmountComponentAtNode(root);});root.remove();
});
test('keeps contact notes local and restores them when reopened',async()=>{
 localStorage.clear();localStorage.setItem('slskd-studio-favorites-v1',JSON.stringify(['example-listener']));
 const root=document.createElement('div');document.body.appendChild(root);
 await act(async()=>{ReactDOM.render(<MemoryRouter><StudioFavorites/></MemoryRouter>,root);});
 act(()=>{Simulate.click(root.querySelector('[title="Personal note"]'));});
 const text=document.querySelector('textarea[aria-label="Personal note"]');
 act(()=>{Simulate.change(text,{target:{value:'Rare jazz collector'}});});
 const save=[...document.querySelectorAll('button')].find(b=>b.textContent==='Save');
 act(()=>{Simulate.click(save);});
 expect(JSON.parse(localStorage.getItem('soulspool-user-notes-v1'))['example-listener']).toBe('Rare jazz collector');
 act(()=>{Simulate.click(root.querySelector('[title="Personal note"]'));});
 expect(document.querySelector('textarea').value).toBe('Rare jazz collector');
 act(()=>{ReactDOM.unmountComponentAtNode(root);});root.remove();
});
