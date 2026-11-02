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
export const appearanceKey = 'slskprime-appearance-v1';
export const themes = { jade: 'Jade', midnight: 'Midnight', plum: 'Plum', paper: 'Paper' };
export const fonts = { inter: 'Inter', manrope: 'Manrope', plex: 'IBM Plex Sans', system: 'System' };
export function readAppearance() {
  let value = {};
  try { value = JSON.parse(localStorage.getItem(appearanceKey) || localStorage.getItem('soulspool-appearance-v1') || localStorage.getItem('soulforge-appearance-v1') || localStorage.getItem('duskcrate-appearance-v1')) || {}; } catch {}
  return { theme: themes[value.theme] ? value.theme : 'jade', font: fonts[value.font] ? value.font : 'inter', size: [12,13,14].includes(value.size) ? value.size : 13 };
}
export function applyAppearance(value) {
  document.documentElement.dataset.palette = value.theme;
  document.documentElement.style.setProperty('--dc-font', { inter: 'Inter', manrope: 'Manrope', plex: 'IBM Plex Sans', system: 'Segoe UI' }[value.font]);
  document.documentElement.style.setProperty('--dc-size', `${value.size}px`);
}
export function saveAppearance(value) { localStorage.setItem(appearanceKey, JSON.stringify(value)); applyAppearance(value); }
applyAppearance(readAppearance());
