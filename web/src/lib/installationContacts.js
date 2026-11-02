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
import { urlBase } from '../config';
let contacts = [];
export const getInstallationContacts = () => contacts;
export async function loadInstallationContacts() {
 const controller = new AbortController();
 const timeout = window.setTimeout(() => controller.abort(), 2000);
 try {
  const response = await fetch(`${urlBase}/installation-contacts.json`, {cache:'no-store',signal:controller.signal});
  if (!response.ok) return;
  const value = await response.json();
  if (!Array.isArray(value)) return;
  contacts = [...new Set(value.filter(name=>typeof name==='string' && name.trim().length>0 && name.length<=255).map(name=>name.trim()))].slice(0,10000);
 } catch {} finally { window.clearTimeout(timeout); }
}
