/* Copyright (c) 2026 slskprime contributors. AGPL-3.0-only with Additional Terms; see LICENSE. */
import React, { useRef, useState } from 'react';
import { Button, Icon, Menu, Modal, Message } from 'semantic-ui-react';
import { createPreferencesBackup, parsePreferencesBackup, restorePreferences } from '../lib/preferencesBackup';

export default function PreferencesBackup() {
  const [open,setOpen] = useState(false), [pending,setPending] = useState(null), [error,setError] = useState('');
  const file = useRef();
  const download = () => {
    const blob = new Blob([JSON.stringify(createPreferencesBackup(),null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href=url; link.download=`slskprime-preferences-${new Date().toISOString().slice(0,10)}.json`; link.click();
    window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const inspect = async (event) => {
    const input = event.target, selected = input.files[0]; input.value=''; setPending(null); setError('');
    if (!selected) return;
    try {
      if (selected.size > 2*1024*1024) throw new Error('Choose a backup smaller than 2 MB.');
      const text = await selected.text(); const data = parsePreferencesBackup(text); setPending({text,data});
    } catch(e) { setError(e.message); }
  };
  return <><Menu.Item onClick={()=>{setOpen(true);setPending(null);setError('');}}><Icon name="save"/>Backup</Menu.Item>
    <Modal open={open} size="small" closeIcon onClose={()=>setOpen(false)}>
      <Modal.Header>Back up your preferences</Modal.Header><Modal.Content>
        <p>Take your contacts, personal notes, saved searches, hidden sources, theme and search filters to another browser.</p>
        <p className="studio-note">Account passwords, login tokens, downloaded files and server configuration are excluded.</p>
        <div className="studio-backup-actions"><Button icon="download" content="Export backup" onClick={download}/><Button icon="upload" content="Choose backup to import" onClick={()=>file.current.click()}/></div>
        <input type="file" accept="application/json,.json" hidden ref={file} aria-label="Preferences backup file" onChange={inspect}/>
        {error&&<Message negative role="alert">{error}</Message>}
        {pending&&<Message><Message.Header>Ready to import</Message.Header><p>{pending.data.contacts.length} contacts · {pending.data.wishes.length} searches · {Object.keys(pending.data.notes).length} notes</p><p>Contacts and searches are merged. Existing notes take priority. Theme and filter defaults come from the backup. Newly imported searches are manual until you enable a schedule.</p></Message>}
      </Modal.Content><Modal.Actions><Button onClick={()=>setOpen(false)}>Close</Button>{pending&&<Button positive icon="check" content="Import and reload" onClick={()=>{try{restorePreferences(pending.text);window.location.reload();}catch(e){setError(e.message);}}}/>}</Modal.Actions>
    </Modal></>;
}
