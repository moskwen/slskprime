import { createPreferencesBackup, parsePreferencesBackup, restorePreferences } from './preferencesBackup';
beforeEach(()=>localStorage.clear());
test('export contains preferences and never session credentials or arbitrary storage',()=>{
  localStorage.setItem('token','secret-token');localStorage.setItem('password','secret-password');
  localStorage.setItem('slskd-studio-favorites-v1',JSON.stringify(['Friend']));
  const backup=JSON.stringify(createPreferencesBackup());expect(backup).toContain('Friend');expect(backup).not.toContain('secret');
});
test('import merges contacts case-insensitively, preserves notes and disables new schedules',()=>{
  localStorage.setItem('slskd-studio-favorites-v1',JSON.stringify(['Friend']));
  localStorage.setItem('soulspool-user-notes-v1',JSON.stringify({Friend:'My note'}));
  const backup=createPreferencesBackup();backup.contacts=['friend','Another'];backup.notes.Friend='Old note';backup.wishes=[{query:'Rare',intervalMinutes:30}];
  const result=restorePreferences(JSON.stringify(backup));expect(result.contacts).toHaveLength(2);expect(result.notes.Friend).toBe('My note');expect(result.wishes[0].intervalMinutes).toBe(0);
});
test('rejects invalid, oversized and malicious backups before changing any storage',()=>{
  const original=JSON.stringify(createPreferencesBackup());
  localStorage.setItem('slskd-studio-favorites-v1','["Keep"]');
  for(const text of ['{}','broken','x'.repeat(2*1024*1024+1),original.replace('"notes":{}','"notes":{"__proto__":"bad"}'),original.replace('"contacts":[]','"contacts":[42]')]) {
    expect(()=>restorePreferences(text)).toThrow();expect(localStorage.getItem('slskd-studio-favorites-v1')).toBe('["Keep"]');
  }
  expect(parsePreferencesBackup(original).appearance.theme).toBe('jade');
});
