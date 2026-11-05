/* Copyright (c) 2026 slskprime contributors. AGPL-3.0-only with Additional Terms; see LICENSE. */
import { getInstallationContacts } from './installationContacts';
import { readAppearance } from './appearance';
import { getLanguage, languages, t } from './i18n';
const keys = { contacts: 'slskd-studio-favorites-v1', wishes: 'slskd-studio-wishes-v1',
  notes: 'soulspool-user-notes-v1', hiddenSources: 'slskd-studio-blocked-v1',
  appearance: 'slskprime-appearance-v1', filters: 'soulspool-search-defaults-v1', language: 'slskprime-language-v1' };
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const invalid = () => { throw new Error(t('Invalid slskprime backup. No preferences were changed.')); };
const names = (value) => {
  if (!Array.isArray(value) || value.length > 10000 || value.some(v => typeof v !== 'string' || !v.trim() || v.length > 255)) return invalid();
  return value.map(v => v.trim());
};
const mergeNames = (first, second) => [...new Map([...first, ...second].map(name => [name.toLowerCase(), name])).values()];
export function createPreferencesBackup() {
  return { format: 'slskprime-preferences', version: 1, exportedAt: new Date().toISOString(),
    contacts: read(keys.contacts, getInstallationContacts()),
    wishes: read(keys.wishes, []).map(w => ({ query: w.query })),
    notes: read(keys.notes, {}), hiddenSources: read(keys.hiddenSources, []),
    appearance: readAppearance(), filters: read(keys.filters, {}), language:getLanguage() };
}
export function parsePreferencesBackup(text) {
  if (text.length > 2 * 1024 * 1024) return invalid();
  let value; try { value = JSON.parse(text); } catch { return invalid(); }
  if (!value || value.format !== 'slskprime-preferences' || value.version !== 1) return invalid();
  const contacts = names(value.contacts), hiddenSources = names(value.hiddenSources);
  if (!Array.isArray(value.wishes) || value.wishes.length > 1000 || value.wishes.some(w => !w || typeof w.query !== 'string' || !w.query.trim() || w.query.length > 1000)) return invalid();
  const notes = value.notes;
  if (!notes || Array.isArray(notes) || typeof notes !== 'object' || Object.keys(notes).length > 10000 || Object.entries(notes).some(([k,v]) => !k || k.length > 255 || ['__proto__','constructor','prototype'].includes(k) || typeof v !== 'string' || v.length > 4000)) return invalid();
  const a = value.appearance;
  if(value.language !== undefined && !languages.some(l=>l.code===value.language))return invalid();
  if (!a || !['jade','midnight','plum','paper'].includes(a.theme) || !['inter','manrope','plex','system'].includes(a.font) || ![12,13,14].includes(a.size)) return invalid();
  const f = value.filters || {};
  if (typeof f !== 'object' || Array.isArray(f)) return invalid();
  const filters = {};
  for (const k of ['hideLocked','hideNoFreeSlots','foldResults','favoritesOnly']) {
    if (f[k] !== undefined) { if (typeof f[k] !== 'boolean') return invalid(); filters[k] = f[k]; }
  }
  if (f.resultFilters !== undefined) { if (typeof f.resultFilters !== 'string' || f.resultFilters.length > 4000) return invalid(); filters.resultFilters = f.resultFilters; }
  if (f.resultSort !== undefined) { if (!['recommended','uploadSpeed','queueLength'].includes(f.resultSort)) return invalid(); filters.resultSort = f.resultSort; }
  return { contacts, hiddenSources, wishes: value.wishes.map(w => ({ query: w.query.trim(), intervalMinutes: 0 })),
    notes: { ...notes }, appearance: { theme:a.theme, font:a.font, size:a.size }, filters, language:value.language };
}
export function restorePreferences(text) {
  const value = parsePreferencesBackup(text);
  const oldWishes = read(keys.wishes, []);
  const queries = new Set(oldWishes.map(w => w.query.toLowerCase()));
  const updated = {
    contacts: mergeNames(read(keys.contacts, getInstallationContacts()), value.contacts),
    hiddenSources: mergeNames(read(keys.hiddenSources, []), value.hiddenSources),
    wishes: [...oldWishes, ...value.wishes.filter(w => { const k=w.query.toLowerCase(); if(queries.has(k))return false; queries.add(k); return true; })],
    notes: { ...value.notes, ...read(keys.notes, {}) }, appearance: value.appearance, filters: value.filters, language:value.language||getLanguage(),
  };
  const previous = Object.values(keys).map(key => [key, localStorage.getItem(key)]);
  try { for (const [name,key] of Object.entries(keys)) localStorage.setItem(key, JSON.stringify(updated[name])); }
  catch (error) { for (const [key,data] of previous) { if(data===null)localStorage.removeItem(key);else localStorage.setItem(key,data); } throw error; }
  window.dispatchEvent(new Event('studio-preferences'));
  return updated;
}
