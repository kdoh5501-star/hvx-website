// Verifies every data-i18n key used in the HTML exists in all locales, that all locales share
// the same key set, and that no Korean text ships anywhere (CLAUDE.md hard rule 1).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const LANGS = ['en', 'tl', 'ja', 'zh', 'ru'];
const dicts = Object.fromEntries(LANGS.map((l) => [l, JSON.parse(readFileSync(`i18n/${l}.json`, 'utf8'))]));
const errors = [];

const enKeys = Object.keys(dicts.en).sort();
for (const l of LANGS) {
  const missing = enKeys.filter((k) => !(k in dicts[l]));
  const extra = Object.keys(dicts[l]).filter((k) => !(k in dicts.en));
  if (missing.length) errors.push(`${l}.json missing: ${missing.join(', ')}`);
  if (extra.length) errors.push(`${l}.json has keys not in en.json: ${extra.join(', ')}`);
  for (const [k, v] of Object.entries(dicts[l])) if (typeof v !== 'string' || !v.trim()) errors.push(`${l}.json "${k}" is empty`);
}

const html = readFileSync('index.html', 'utf8');
for (const [, key] of html.matchAll(/data-i18n="([^"]+)"/g)) if (!(key in dicts.en)) errors.push(`index.html uses unknown key "${key}"`);

// Hangul Jamo, Compatibility Jamo and Syllables, built from code points so this file stays ASCII.
const r = (a, b) => `${String.fromCodePoint(a)}-${String.fromCodePoint(b)}`;
const HANGUL = new RegExp(`[${r(0x1100, 0x11ff)}${r(0x3130, 0x318f)}${r(0xac00, 0xd7af)}]`, 'u');
const SKIP = new Set(['node_modules', 'dist', 'prototype', '.git']);
const walk = (dir) => readdirSync(dir).flatMap((f) => {
  if (SKIP.has(f)) return [];
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
for (const f of walk('.')) {
  if (!/\.(html|ts|css|json|mjs|txt|xml|webmanifest|svg)$/.test(f) || f.endsWith('package-lock.json')) continue;
  if (HANGUL.test(readFileSync(f, 'utf8'))) errors.push(`Korean text found in ${f}`);
}

if (errors.length) {
  console.error('i18n check failed:\n- ' + errors.join('\n- '));
  process.exit(1);
}
console.log(`i18n check passed: ${enKeys.length} keys x ${LANGS.length} languages, no Korean text.`);
