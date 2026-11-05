/* Copyright (c) 2026 slskprime contributors. AGPL-3.0-only with Additional Terms; see LICENSE. */
import React, { useState } from 'react';
import { Button, Menu, Icon, Modal } from 'semantic-ui-react';
import { languages, getLanguage, saveLanguage, t } from '../lib/i18n';

export default function LanguageSelector({ onReload = () => window.location.reload() }) {
  const [open, setOpen] = useState(false);
  const current = languages.find(language => language.code === getLanguage());
  const choose = code => {
    if (code === getLanguage()) { setOpen(false); return; }
    if (saveLanguage(code)) { setOpen(false); onReload(); }
  };
  return <><Menu.Item as="button" type="button" className="studio-language studio-language-trigger"
    aria-label={t('Language')} aria-haspopup="dialog" aria-expanded={open}
    onClick={event => { event.stopPropagation(); setOpen(true); }}>
    <Icon name="world" />
    <span>{t('Language')}</span><small dir="auto">{current.name}</small>
  </Menu.Item>
    <Modal open={open} size="small" closeIcon role="dialog" aria-modal="true" onClose={() => setOpen(false)} aria-labelledby="studio-language-title">
      <Modal.Header id="studio-language-title">{t('Language')}</Modal.Header>
      <Modal.Content><div className="studio-language-grid">
        {languages.map(language => <button type="button" key={language.code} data-language={language.code}
          aria-pressed={language.code === getLanguage()} lang={language.code} dir="auto"
          onClick={() => choose(language.code)}>
          <span>{language.name}</span>{language.code === getLanguage() && <Icon name="check" />}
        </button>)}
      </div></Modal.Content>
      <Modal.Actions><Button onClick={() => setOpen(false)}>{t('Close')}</Button></Modal.Actions>
    </Modal></>;
}
