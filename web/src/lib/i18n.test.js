import { catalogs, languages, t, saveLanguage, getLanguage, readLanguage, languageKey } from './i18n';
import { parseFiltersFromString } from './searches';
import { createPreferencesBackup, restorePreferences } from './preferencesBackup';

beforeEach(()=>{localStorage.clear();saveLanguage('en');});
afterEach(()=>saveLanguage('en'));
test('all ten catalogs have complete, nonempty translations with exactly the same interpolation parameters',()=>{
  expect(languages).toHaveLength(10);expect(languages.some(l=>l.code==='pt-BR')).toBe(true);
  const keys=Object.keys(catalogs.en).sort();expect(keys.length).toBeGreaterThan(300);
  for(const {code} of languages){
    expect(Object.keys(catalogs[code]).sort()).toEqual(keys);
    for(const key of keys){const value=catalogs[code][key];expect(value.trim()).not.toBe('');expect((value.match(/\{\d+\}/g)||[]).sort()).toEqual((key.match(/\{\d+\}/g)||[]).sort());}
  }
});
test('Portuguese persists and translates controls while user text and filter operators remain intact',()=>{
  saveLanguage('pt-BR');expect(readLanguage()).toBe('pt-BR');expect(document.documentElement.lang).toBe('pt-BR');
  expect(t('Search')).toBe('Buscar');expect(t('Language')).toBe('Idioma');
  expect(t('Add to favorites {0}',['Someone <private>'])).toBe('Adicionar aos favoritos Someone <private>');
  expect(t('new untranslated message')).toBe('new untranslated message');
  expect(parseFiltersFromString('islossless -"live at"')).toMatchObject({isLossless:true,exclude:['live at']});
});
test.each(['ar','ur'])('%s uses RTL and restores LTR when English is chosen',code=>{
  saveLanguage(code);expect(document.documentElement.dir).toBe('rtl');expect(t('Search')).not.toBe('Search');
  saveLanguage('en');expect(document.documentElement.dir).toBe('ltr');
});
test('unsupported and corrupt language choices fall back safely',()=>{
  expect(saveLanguage('invalid')).toBe(false);expect(getLanguage()).toBe('en');
  localStorage.setItem(languageKey,'broken');expect(readLanguage()).toBe('en');
  localStorage.setItem(languageKey,'"invalid"');expect(readLanguage()).toBe('en');
});
test('backup carries the language, and older backups retain the current language',()=>{
  saveLanguage('pt-BR');const backup=createPreferencesBackup();expect(backup.language).toBe('pt-BR');
  saveLanguage('en');restorePreferences(JSON.stringify(backup));expect(readLanguage()).toBe('pt-BR');
  delete backup.language;saveLanguage('fr');restorePreferences(JSON.stringify(backup));expect(readLanguage()).toBe('fr');
});
