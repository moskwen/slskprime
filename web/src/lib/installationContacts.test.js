/* Copyright (c) 2026 slskprime contributors. AGPL-3.0-only; see LICENSE and Additional Terms. */
import { getInstallationContacts, loadInstallationContacts } from './installationContacts';
test('loads only valid installation contacts and removes exact duplicates',async()=>{
 global.fetch=jest.fn(async()=>({ok:true,json:async()=>['example-listener',' example-listener ',null,42,'', 'demo-collector']}));
 await loadInstallationContacts();
 expect(getInstallationContacts()).toEqual(['example-listener','demo-collector']);
 expect(fetch.mock.calls[0][0]).toBe('/installation-contacts.json');
});
test('an absent installation file does not erase loaded contacts or prevent startup',async()=>{
 global.fetch=jest.fn(async()=>({ok:false}));
 await loadInstallationContacts();
 expect(getInstallationContacts()).toEqual(['example-listener','demo-collector']);
});
