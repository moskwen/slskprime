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
import {act,Simulate} from 'react-dom/test-utils';
import {MemoryRouter,Route,Switch} from 'react-router-dom';
import TransferList from './TransferList';
import * as searches from '../../lib/searches';
jest.mock('../../lib/searches',()=>({create:jest.fn(()=>Promise.resolve())}));
jest.mock('react-toastify',()=>({toast:{error:jest.fn()}}));
test('alternative source action starts a search without cancelling or downloading files',async()=>{
 const root=document.createElement('div');document.body.appendChild(root);
 const file={id:'file-1',filename:'Music\\Album\\Artist - Track.flac',direction:'Download',state:'Completed, TimedOut',size:1024,bytesTransferred:0,attempts:1};
 act(()=>{ReactDOM.render(<MemoryRouter initialEntries={['/downloads']}><Switch><Route path="/downloads" render={()=><TransferList directoryName="Music\\Album" direction="download" files={[file]} onSelectionChange={()=>{}}/>}/><Route path="/searches/:id" render={()=><div data-testid="results">Results</div>}/></Switch></MemoryRouter>,root);});
 const button=root.querySelector('.studio-alternative');expect(button).not.toBeNull();
 await act(async()=>{Simulate.click(button);});
 expect(searches.create).toHaveBeenCalledWith({id:expect.any(String),searchText:'Artist - Track'});
 expect(root.querySelector('[data-testid="results"]')).not.toBeNull();
 act(()=>{ReactDOM.unmountComponentAtNode(root);});root.remove();
});
