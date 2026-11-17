/* Copyright (c) 2026 slskprime contributors. AGPL-3.0-only with Additional Terms; see LICENSE. */
import React,{useState} from 'react';
import {Button,Message,Modal,TextArea} from 'semantic-ui-react';
import * as chat from '../../lib/chat';
import {t} from '../../lib/i18n';
export default function PrivateMessageComposer({username,onClose}){
 const [message,setMessage]=useState(''),[sending,setSending]=useState(false),[error,setError]=useState('');
 const send=async()=>{if(sending||!message.trim())return;setSending(true);setError('');try{await chat.send({username,message:message.trim()});onClose();}catch(e){setError(typeof e.response?.data==='string'?e.response.data:e.message||t('Request failed'));}finally{setSending(false);}};
 return <Modal open={!!username} size="small" onClose={()=>!sending&&onClose()} closeOnEscape={!sending} closeOnDimmerClick={!sending}>
  <Modal.Header>{t('Send Private Message')} · {username}</Modal.Header>
  <Modal.Content><TextArea autoFocus aria-label={t('Message')} value={message} maxLength={10000} disabled={sending} onChange={(_,d)=>setMessage(d.value)} style={{width:'100%',minHeight:140}}/>{error&&<Message negative role="alert">{error}</Message>}</Modal.Content>
  <Modal.Actions><Button disabled={sending} onClick={onClose}>{t('Cancel')}</Button><Button positive loading={sending} disabled={sending||!message.trim()} onClick={send}>{t('Send')}</Button></Modal.Actions>
 </Modal>;
}
