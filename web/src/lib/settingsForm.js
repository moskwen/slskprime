/* Copyright (c) 2026 slskprime contributors. AGPL-3.0-only with Additional Terms; see LICENSE. */
import YAML from 'yaml';
export const settingPaths={downloads:['directories','downloads'],incomplete:['directories','incomplete'],organization:['transfers','download','destination','subdirectory'],downloadSpeed:['transfers','download','speed_limit'],uploadSpeed:['transfers','upload','speed_limit'],downloadSlots:['transfers','download','slots'],uploadSlots:['transfers','upload','slots'],shares:['shares','directories']};
export function formValues(raw,effective={}){
 const parsed=YAML.parse(raw)||{};const get=(path,fallback)=>path.reduce((o,k)=>o?.[k],parsed)??fallback;
 const values={downloads:get(settingPaths.downloads,effective.directories?.downloads||''),incomplete:get(settingPaths.incomplete,effective.directories?.incomplete||''),organization:get(settingPaths.organization,effective.transfers?.download?.destination?.subdirectory||'${SOURCE_DIRECTORY}'),downloadSpeed:get(settingPaths.downloadSpeed,effective.transfers?.download?.speedLimit??0),uploadSpeed:get(settingPaths.uploadSpeed,effective.transfers?.upload?.speedLimit??0),downloadSlots:get(settingPaths.downloadSlots,effective.transfers?.download?.slots??500),uploadSlots:get(settingPaths.uploadSlots,effective.transfers?.upload?.slots??20),shares:get(settingPaths.shares,effective.shares?.directories||[])};
 for(const key of ['downloadSpeed','uploadSpeed','downloadSlots','uploadSlots'])if(Number(values[key])>=2147483647)values[key]=0;
 return values;
}
export function patchSettings(raw,changes){
 const doc=YAML.parseDocument(raw);if(doc.errors.length)throw new Error('Invalid configuration');
 for(const [key,value] of Object.entries(changes)){
  if(!settingPaths[key])throw new Error('Unknown setting');
  if(['downloadSpeed','uploadSpeed','downloadSlots','uploadSlots'].includes(key)&&(String(value).trim()===''||!Number.isInteger(Number(value))||Number(value)<0||Number(value)>2147483647))throw new Error('Invalid numeric setting');
  if(['downloads','incomplete'].includes(key)&&(!String(value).trim()||!(/^(\/|[A-Za-z]:[\\/])/u.test(value))))throw new Error('Use an absolute directory path');
  if(!doc.contents)doc.contents=YAML.createNode({});
  const path=settingPaths[key];for(let depth=1;depth<path.length;depth++){const prefix=path.slice(0,depth),existing=doc.getIn(prefix);if(existing===null||existing===undefined)doc.setIn(prefix,YAML.createNode({}));else if(typeof existing!=='object'||Array.isArray(existing))throw new Error('Invalid configuration section');}
  doc.setIn(settingPaths[key],key.endsWith('Speed')||key.endsWith('Slots')?(Number(value)===0?2147483647:Number(value)):value);
 }
 return String(doc);
}
