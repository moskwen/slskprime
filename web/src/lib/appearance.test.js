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
import { readAppearance, saveAppearance, appearanceKey } from './appearance';
beforeEach(()=>localStorage.clear());
test('keeps appearance preferences from the previous local edition',()=>{
 localStorage.setItem('soulforge-appearance-v1',JSON.stringify({theme:'plum',font:'plex',size:12}));
 expect(readAppearance()).toEqual({theme:'plum',font:'plex',size:12});
});
test('rejects unknown preferences and restores the default palette',()=>{
 localStorage.setItem(appearanceKey,JSON.stringify({theme:'invalid',font:'remote',size:200}));
 expect(readAppearance()).toEqual({theme:'jade',font:'inter',size:13});
});
test('persists and applies appearance without affecting the login',()=>{
 localStorage.setItem('auth-token','unchanged');
 saveAppearance({theme:'paper',font:'manrope',size:12});
 expect(readAppearance()).toEqual({theme:'paper',font:'manrope',size:12});
 expect(document.documentElement.dataset.palette).toBe('paper');
 expect(document.documentElement.style.getPropertyValue('--dc-font')).toBe('Manrope');
 expect(localStorage.getItem('auth-token')).toBe('unchanged');
});
