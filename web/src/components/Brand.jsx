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
import React from 'react';
export default function Brand({compact=false}) {
 return <div className={'prime-brand'+(compact?' compact':'')} aria-label="slskprime — Soulseek web client">
  <svg className="prime-symbol" viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="13" fill="currentColor" opacity=".1"/><path d="M13 34V14h14a8 8 0 0 1 0 16h-8" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/><path d="m33 10 3-5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><circle cx="27" cy="22" r="2.3" fill="currentColor"/></svg>
  <div className="prime-wordmark"><strong>slsk<span>prime</span></strong>{!compact&&<small>SOULSEEK WEB CLIENT</small>}</div>
 </div>;
}
