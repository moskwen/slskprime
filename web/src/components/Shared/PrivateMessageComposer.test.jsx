import React from 'react';import ReactDOM from 'react-dom';import {act,Simulate} from 'react-dom/test-utils';
import Composer from './PrivateMessageComposer';import * as chat from '../../lib/chat';
jest.mock('../../lib/chat',()=>({send:jest.fn()}));
test('opening a peer composer sends nothing; only an explicit Send transmits the draft',async()=>{
 const root=document.createElement('div');document.body.appendChild(root);const close=jest.fn();chat.send.mockResolvedValue({});
 act(()=>ReactDOM.render(<Composer username="peer" onClose={close}/>,root));expect(chat.send).not.toHaveBeenCalled();
 act(()=>Simulate.change(document.querySelector('textarea[aria-label="Message"]'),{target:{value:'Hello'}}));
 await act(async()=>Simulate.click([...document.querySelectorAll('button')].find(b=>b.textContent==='Send')));
 expect(chat.send).toHaveBeenCalledWith({username:'peer',message:'Hello'});expect(close).toHaveBeenCalledTimes(1);
 act(()=>ReactDOM.unmountComponentAtNode(root));root.remove();
});
