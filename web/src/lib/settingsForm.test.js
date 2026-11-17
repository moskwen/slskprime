import YAML from 'yaml';
import {formValues,patchSettings} from './settingsForm';
const raw='# keep this comment\nweb:\n  authentication:\n    password: "example-secret"\ncustom: { keep: true }\ndirectories:\n  downloads: /downloads\nshares:\n  directories: [/media]\ntransfers:\n  download:\n    destination:\n      subdirectory: ${SOURCE_USERNAME}/${SOURCE_DIRECTORY}\n      exists: rename\n';
test('a form patch preserves unrelated settings, secrets, comments and download organization',()=>{
 const next=patchSettings(raw,{uploadSpeed:200,shares:['/media','/music']});
 const expected=YAML.parse(raw);expected.transfers.upload={speed_limit:200};expected.shares.directories.push('/music');
 expect(YAML.parse(next)).toEqual(expected);expect(next).toContain('# keep this comment');
});
test('invalid paths and numeric limits are rejected before saving',()=>{
 expect(()=>patchSettings(raw,{downloads:'relative/path'})).toThrow();expect(()=>patchSettings(raw,{uploadSlots:-1})).toThrow();expect(()=>patchSettings(raw,{uploadSpeed:'abc'})).toThrow();
});
test('form values use effective defaults without writing them into the YAML',()=>{
 expect(formValues(raw,{transfers:{upload:{slots:12}}}).uploadSlots).toBe(12);
 expect(formValues(raw).organization).toBe('${SOURCE_USERNAME}/${SOURCE_DIRECTORY}');
});

test('unlimited limits are shown as zero and encoded as the backend maximum',()=>{
 expect(formValues('',{transfers:{upload:{slots:2147483647,speedLimit:2147483647}}}).uploadSlots).toBe(0);
 expect(YAML.parse(patchSettings(raw,{uploadSlots:0,downloadSpeed:0})).transfers.upload.slots).toBe(2147483647);
});
