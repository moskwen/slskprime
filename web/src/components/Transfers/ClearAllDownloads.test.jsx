import React from 'react';
import ReactDOM from 'react-dom';
import {act,Simulate} from 'react-dom/test-utils';
import ClearAllDownloads from './ClearAllDownloads';
test('requires confirmation, explains cancellation, and submits the original full snapshot',async()=>{
  const root=document.createElement('div');document.body.appendChild(root);
  const records=[{id:'done',username:'one',state:'Completed, Succeeded'},{id:'active',username:'two',state:'InProgress'}];
  const clear=jest.fn().mockResolvedValue({remaining:0});
  act(()=>{ReactDOM.render(<ClearAllDownloads records={records} onClear={clear}/>,root);});
  act(()=>{Simulate.click(root.querySelector('button'));});
  expect(clear).not.toHaveBeenCalled();expect(document.body.textContent).toContain('1 queued or active downloads will be cancelled');
  expect(document.body.textContent).toContain('Downloaded files and your download folders are kept');
  act(()=>{ReactDOM.render(<ClearAllDownloads records={[]} onClear={clear}/>,root);});
  const confirm=[...document.querySelectorAll('button')].find(b=>b.textContent==='Clear download list');
  await act(async()=>{Simulate.click(confirm);});expect(clear).toHaveBeenCalledWith(records);
  act(()=>{ReactDOM.unmountComponentAtNode(root);});root.remove();
});
