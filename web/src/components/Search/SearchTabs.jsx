/* Copyright (c) 2026 slskprime contributors. AGPL-3.0-only with Additional Terms; see LICENSE. */
import React from 'react';
import {NavLink} from 'react-router-dom';
import {urlBase} from '../../config';
import {t} from '../../lib/i18n';
export default function SearchTabs({searches}) {
 return <nav className="classic-search-tabs" aria-label={t('Search tabs')}>
  <NavLink exact to={`${urlBase}/searches`}>{t('New search')}</NavLink>
  {Object.values(searches).slice(-50).map(search=><NavLink key={search.id} to={`${urlBase}/searches/${search.id}`} title={search.searchText}>{search.searchText}</NavLink>)}
 </nav>;
}
