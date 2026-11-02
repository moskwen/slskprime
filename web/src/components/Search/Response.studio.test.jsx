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
import Response from './Response';
import * as transfers from '../../lib/transfers';
jest.mock('../../lib/transfers', () => ({ download: jest.fn(() => Promise.resolve({status:201})) }));
jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
const response = {username:'studio-test',hasFreeUploadSlot:true,uploadSpeed:1000,queueLength:0,files:[{filename:'Music\\Album A\\one.flac',size:100},{filename:'Music\\Album B\\two.flac',size:200}],lockedFiles:[]};
let root;
beforeEach(()=>{root=document.createElement('div');document.body.appendChild(root);transfers.download.mockClear();});
afterEach(()=>{act(()=>{ReactDOM.unmountComponentAtNode(root);});root.remove();});
test('each folder has a visible action and sends only files from that folder',async()=>{
 act(()=>{ReactDOM.render(<Response response={response} isInitiallyFolded={false} onHide={()=>{}}/>,root);});
 const buttons=[...root.querySelectorAll('button')].filter(b=>b.textContent.includes('Download folder'));
 expect(buttons).toHaveLength(2);
 await act(async()=>{Simulate.click(buttons[1]);});
 expect(transfers.download).toHaveBeenCalledWith({username:'studio-test',files:[{filename:'Music\\Album B\\two.flac',size:200}]});
});
test('folder actions respect a disconnected server',()=>{
 act(()=>{ReactDOM.render(<Response response={response} disabled isInitiallyFolded={false} onHide={()=>{}}/>,root);});
 const buttons=[...root.querySelectorAll('button')].filter(b=>b.textContent.includes('Download folder'));
 expect(buttons.every(b=>b.disabled)).toBe(true);
 expect(transfers.download).not.toHaveBeenCalled();
});
