/* Copyright (c) 2026 slskprime contributors. AGPL-3.0-only with Additional Terms; see LICENSE. */
import React,{useEffect,useState} from 'react';
import {Button,Form,Input,Message,Segment} from 'semantic-ui-react';
import * as api from '../../../lib/options';
import {formValues,patchSettings} from '../../../lib/settingsForm';
import {t} from '../../../lib/i18n';
const organizations=[['${SOURCE_DIRECTORY}','Folder per album'],['${SOURCE_USERNAME}/${SOURCE_DIRECTORY}','User, then album'],['${SOURCE_USERNAME}','Folder per user']];
export default function SettingsForm({options={},section}){
 const [raw,setRaw]=useState(null),[values,setValues]=useState(()=>formValues('',options)),[changes,setChanges]=useState({}),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState(false),[newShare,setNewShare]=useState('');
 const remote=options.remoteConfiguration===true;
 const load=async()=>{setLoading(true);setError('');try{const source=remote?await api.getYaml():'';setRaw(source);setValues(formValues(source,options));setChanges({});setSaved(false);}catch(e){setError(e.message);}finally{setLoading(false);}};
 useEffect(()=>{load();},[remote]);
 const change=(key,value)=>{setValues(old=>({...old,[key]:value}));setChanges(old=>({...old,[key]:value}));setSaved(false);};
 const disabled=!remote||loading||saving||raw===null;
 const save=async()=>{setSaving(true);setError('');setSaved(false);try{
  const next=patchSettings(raw,changes);const validation=await api.validateYaml({yaml:next});if(validation)throw new Error(typeof validation==='string'?validation:t('Invalid configuration'));
  if(await api.getYaml()!==raw)throw new Error(t('Settings changed elsewhere. Reload before saving.'));
  await api.updateYaml({yaml:next});setRaw(next);setChanges({});setSaved(true);
 }catch(e){setError(typeof e.response?.data==='string'?e.response.data:e.message||t('Request failed'));}finally{setSaving(false);}};
 const field=(key,label,type='text')=><Form.Field key={key}><label htmlFor={'setting-'+key}>{t(label)}</label><Input id={'setting-'+key} type={type} min={type==='number'?0:undefined} step={type==='number'?1:undefined} value={values[key]} disabled={disabled} onChange={(_,d)=>change(key,d.value)}/></Form.Field>;
 const shares=Array.isArray(values.shares)?values.shares:[];
 return <Form className="classic-settings-form" loading={loading} onSubmit={e=>e.preventDefault()}>
  {!remote&&<Message warning>{t('Remote Configuration Disabled')}</Message>}
  {error&&<Message negative role="alert">{error}</Message>}{saved&&<Message positive role="status">{t('Settings saved. Existing files were not moved.')}</Message>}
  {section!=='shares'&&<Segment><h3>{t('Download folders')}</h3><p>{t('Choose folders available to the app. Existing files are not moved.')}</p><Form.Group widths="equal">{field('downloads','Completed downloads folder')}{field('incomplete','Incomplete downloads folder')}</Form.Group>
   <Form.Field><label htmlFor="setting-organization">{t('Organize completed downloads')}</label><select id="setting-organization" value={values.organization} disabled={disabled} onChange={e=>change('organization',e.target.value)}>{!organizations.some(([v])=>v===values.organization)&&<option value={values.organization}>{t('Custom organization')}</option>}{organizations.map(([v,label])=><option key={v} value={v}>{t(label)}</option>)}</select></Form.Field>
  </Segment>}
  <Segment id="shared-folders"><h3>{t('Shared folders')}</h3><p>{t('Only these folders are shared with other Soulseek users.')}</p>
   <ul className="classic-share-paths">{shares.map((path,i)=><li key={path+'-'+i}><code>{path}</code><Button type="button" size="mini" icon="close" aria-label={`${t('Remove shared folder')}: ${path}`} disabled={disabled} onClick={()=>change('shares',shares.filter((_,n)=>n!==i))}/></li>)}</ul>
   {!shares.length&&<p>{t('No shared folders configured')}</p>}
   <div className="classic-add-share"><Input aria-label={t('Shared folder path')} placeholder="/media" value={newShare} disabled={disabled} onChange={(_,d)=>setNewShare(d.value)}/><Button type="button" icon="folder open" content={t('Add folder')} disabled={disabled||!newShare.trim()||shares.includes(newShare.trim())} onClick={()=>{change('shares',[...shares,newShare.trim()]);setNewShare('');}}/></div>
   <p className="studio-note">{t('Use a folder path available inside the app, such as /media. Save, then check the Shares tab to see indexed files.')}</p>
  </Segment>
  {section!=='shares'&&<Segment><h3>{t('Transfer limits')}</h3><p>{t('Speed is in KiB/s. Set any limit to zero for unlimited.')}</p><Form.Group widths="equal">{field('downloadSpeed','Download speed limit','number')}{field('uploadSpeed','Upload speed limit','number')}</Form.Group><Form.Group widths="equal">{field('downloadSlots','Simultaneous downloads','number')}{field('uploadSlots','Simultaneous uploads','number')}</Form.Group></Segment>}
  <div className="classic-settings-actions"><Button type="button" positive icon="save" content={t('Save settings')} disabled={disabled||!Object.keys(changes).length} loading={saving} onClick={save}/><Button type="button" content={t('Reload settings')} disabled={saving||loading} onClick={load}/></div>
  <p className="studio-note">{t('Some server changes may require a reconnect or restart. Check System → Info after saving.')}</p>
 </Form>;
}
