import React from 'react';import ReactDOM from 'react-dom';import {act,Simulate} from 'react-dom/test-utils';
import SettingsForm from './SettingsForm';import * as api from '../../../lib/options';
jest.mock('../../../lib/options',()=>({getYaml:jest.fn(),validateYaml:jest.fn(),updateYaml:jest.fn()}));
const raw='directories:\n  downloads: /downloads\n  incomplete: /incomplete\nshares:\n  directories: [/media]\n';let root;
beforeEach(()=>{jest.clearAllMocks();api.getYaml.mockResolvedValue(raw);api.validateYaml.mockResolvedValue(null);api.updateYaml.mockResolvedValue({});root=document.createElement('div');document.body.appendChild(root);});
afterEach(()=>{act(()=>ReactDOM.unmountComponentAtNode(root));root.remove();});
const render=async()=>act(async()=>ReactDOM.render(<SettingsForm options={{remoteConfiguration:true}}/>,root));
const save=()=>[...root.querySelectorAll('button')].find(b=>b.textContent==='Save settings');
test('common settings are fields, and adding a share requires an explicit save',async()=>{
 await render();expect(root.querySelector('#setting-downloads').value).toBe('/downloads');expect(root.textContent).toContain('/media');
 act(()=>Simulate.change(root.querySelector('[aria-label="Shared folder path"]'),{target:{value:'/music'}}));
 act(()=>Simulate.click([...root.querySelectorAll('button')].find(b=>b.textContent==='Add folder')));
 expect(api.updateYaml).not.toHaveBeenCalled();await act(async()=>Simulate.click(save()));
 expect(api.updateYaml.mock.calls[0][0].yaml).toContain('/music');expect(root.textContent).toContain('Settings saved.');
});
test('server validation and concurrent edits prevent an overwrite',async()=>{
 await render();act(()=>Simulate.change(root.querySelector('#setting-uploadSpeed'),{target:{value:'200'}}));
 api.validateYaml.mockResolvedValue('Invalid limit');await act(async()=>Simulate.click(save()));expect(api.updateYaml).not.toHaveBeenCalled();expect(root.textContent).toContain('Invalid limit');
 api.validateYaml.mockResolvedValue(null);api.getYaml.mockResolvedValue(raw+'debug: true\n');await act(async()=>Simulate.click(save()));expect(api.updateYaml).not.toHaveBeenCalled();expect(root.textContent).toContain('Settings changed elsewhere');
});
