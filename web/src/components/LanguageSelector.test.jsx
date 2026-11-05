import React from 'react';
import ReactDOM from 'react-dom';
import {act,Simulate} from 'react-dom/test-utils';
import {MemoryRouter} from 'react-router-dom';
import LanguageSelector from './LanguageSelector';
import StudioSearchTools from './StudioSearchTools';
import {saveLanguage,readLanguage} from '../lib/i18n';
import {saveWish,getWishes} from '../lib/studio';
jest.mock('../lib/searches',()=>({create:jest.fn().mockResolvedValue({})}));
beforeEach(()=>{localStorage.clear();saveLanguage('en');});
afterEach(()=>saveLanguage('en'));
test('selector exposes ten native language names and saves Brazilian Portuguese before reloading',()=>{
  const root=document.createElement('div'),reload=jest.fn();document.body.appendChild(root);
  act(()=>{ReactDOM.render(<LanguageSelector onReload={reload}/>,root);});
  const select=root.querySelector('select');expect(select.options).toHaveLength(10);
  expect([...select.options].some(o=>o.text==='Português (Brasil)')).toBe(true);
  act(()=>{Simulate.change(select,{target:{value:'pt-BR'}});});
  expect(readLanguage()).toBe('pt-BR');expect(reload).toHaveBeenCalledTimes(1);
  act(()=>{ReactDOM.unmountComponentAtNode(root);});root.remove();
});
test('Portuguese controls keep internal schedule values unchanged',()=>{
  saveLanguage('pt-BR');saveWish('User-entered artist');const root=document.createElement('div');document.body.appendChild(root);
  act(()=>{ReactDOM.render(<MemoryRouter><StudioSearchTools/></MemoryRouter>,root);});
  expect(root.textContent).toContain('Buscas salvas');expect(root.textContent).toContain('User-entered artist');
  const option=[...root.querySelectorAll('[role="option"]')].find(o=>o.textContent==='A cada hora');
  act(()=>{Simulate.click(option);});expect(getWishes()[0].intervalMinutes).toBe(60);
  act(()=>{ReactDOM.unmountComponentAtNode(root);});root.remove();
});
