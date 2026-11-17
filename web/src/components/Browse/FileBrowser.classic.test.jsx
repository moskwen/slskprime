import React from 'react';
import ReactDOM from 'react-dom';
import {act,Simulate} from 'react-dom/test-utils';
import FileBrowser from './FileBrowser';
test('browse columns sort sizes numerically and selection retains full remote paths',()=>{
 localStorage.clear();const root=document.createElement('div');document.body.appendChild(root);
 const onSelectionChange=jest.fn();const node={name:'Music/Album',files:[{filename:'large.flac',size:100},{filename:'small.flac',size:20}]};
 act(()=>ReactDOM.render(<FileBrowser rootDirectory={node} files={node.files.map(f=>({...f,filename:`Music/Album/${f.filename}`}))} separator="/" onSelectionChange={onSelectionChange}/>,root));
 act(()=>Simulate.click([...root.querySelectorAll('th button')].find(b=>b.textContent==='Size')));
 expect(root.querySelector('tbody tr').textContent).toContain('small.flac');
 act(()=>Simulate.change(root.querySelector('tbody input'),{target:{checked:true}}));
 // Semantic UI's checkbox forwards its change through the wrapper click.
 act(()=>Simulate.click(root.querySelector('tbody .checkbox')));
 expect(onSelectionChange).toHaveBeenCalledWith(['Music/Album/small.flac']);
 act(()=>ReactDOM.unmountComponentAtNode(root));root.remove();
});
