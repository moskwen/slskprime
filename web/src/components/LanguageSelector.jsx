/* Copyright (c) 2026 slskprime contributors. AGPL-3.0-only with Additional Terms; see LICENSE. */
import React from 'react';
import { Menu, Icon } from 'semantic-ui-react';
import { languages, getLanguage, saveLanguage, t } from '../lib/i18n';

export default function LanguageSelector({ onReload = () => window.location.reload() }) {
  return <Menu.Item className="studio-language">
    <Icon name="world" />
    <label htmlFor="slskprime-language">{t('Language')}</label>
    <select id="slskprime-language" aria-label={t('Language')} value={getLanguage()} dir="auto"
      onChange={event => { saveLanguage(event.target.value); onReload(); }}>
      {languages.map(language => <option key={language.code} value={language.code} lang={language.code} dir={language.rtl?'rtl':'ltr'}>{language.name}</option>)}
    </select>
  </Menu.Item>;
}
