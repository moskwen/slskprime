/* Copyright (c) 2026 slskprime contributors. AGPL-3.0-only with Additional Terms; see LICENSE. */
import en from '../locales/en.json';
import pt from '../locales/pt-BR.json';
import es from '../locales/es.json';
import zh from '../locales/zh-CN.json';
import hi from '../locales/hi.json';
import ar from '../locales/ar.json';
import fr from '../locales/fr.json';
import bn from '../locales/bn.json';
import id from '../locales/id.json';
import ur from '../locales/ur.json';

export const languageKey = 'slskprime-language-v1';
export const languages = [
  {code:'en',name:'English'}, {code:'zh-CN',name:'中文（简体）'},
  {code:'hi',name:'हिन्दी'}, {code:'es',name:'Español'},
  {code:'ar',name:'العربية',rtl:true}, {code:'fr',name:'Français'},
  {code:'bn',name:'বাংলা'}, {code:'pt-BR',name:'Português (Brasil)'},
  {code:'id',name:'Bahasa Indonesia'}, {code:'ur',name:'اردو',rtl:true},
];
export const catalogs = { en, 'pt-BR':pt, es, 'zh-CN':zh, hi, ar, fr, bn, id, ur };
export function readLanguage() {
  try { const value=JSON.parse(localStorage.getItem(languageKey));return languages.some(l=>l.code===value)?value:'en'; } catch { return 'en'; }
}
let language = readLanguage();
export const getLanguage = () => language;
export function applyLanguage() {
  document.documentElement.lang = language;
  document.documentElement.dir = languages.find(l=>l.code===language)?.rtl?'rtl':'ltr';
}
export function saveLanguage(code) {
  if (!languages.some(l=>l.code===code)) return false;
  language=code;
  try { localStorage.setItem(languageKey,JSON.stringify(code)); } catch {}
  applyLanguage();
  return true;
}
export function t(key, parameters=[]) {
  if (typeof key !== 'string') return key;
  const text = catalogs[language]?.[key] || catalogs.en[key] || key;
  return text.replace(/\{(\d+)\}/gu, (match,index) => {
    const value=parameters[index];
    if(value===undefined||value===null)return value===null?'':match;
    return typeof value==='number'?new Intl.NumberFormat(language).format(value):String(value);
  });
}
applyLanguage();
