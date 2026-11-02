/*
 * Copyright (c) 2026 slskprime contributors.
 * Modified: independent branding, English UI, compact design and browser-local discovery tools.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, version 3.
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://www.gnu.org/licenses/.
 * This program is distributed with Additional Terms pursuant to Section 7
 * of the AGPLv3. See the LICENSE file for the complete terms and conditions.
 */
import {transferRows,groupTransferRows,saveWish,getWishes,blockSource,isSourceBlocked,unblockSource} from './studio';
beforeEach(()=>localStorage.clear());
test('saved searches and blocked sources deduplicate without case sensitivity',()=>{saveWish('Queen FLAC');saveWish('queen flac');expect(getWishes()).toHaveLength(1);blockSource('BrokenSource');expect(isSourceBlocked('brokensource')).toBe(true);unblockSource('BrokenSource');expect(isSourceBlocked('BrokenSource')).toBe(false);});
test('transfer categories keep failures separate from successful downloads and preserve grouping',()=>{const groups=[{username:'user',directories:[{directory:'Album',files:[{filename:'ok.flac',state:'Completed, Succeeded'},{filename:'bad.flac',state:'Completed, Errored'},{filename:'wait.flac',state:'Queued, Remotely'}]}]}];expect(transferRows(groups,'done')).toHaveLength(1);expect(transferRows(groups,'error')[0].file.filename).toBe('bad.flac');expect(transferRows(groups,'queued')[0].file.filename).toBe('wait.flac');expect(groupTransferRows(transferRows(groups,'all','bad'))[0].directories[0].files).toHaveLength(1);});
