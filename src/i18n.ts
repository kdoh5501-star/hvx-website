import { LANGS, HTML_LANG, langPath, type Lang } from './config';
import { allocRows, addrRows, pageTitle, pageDescription, type Dict } from './content';

const loaders = import.meta.glob<Dict>('../i18n/*.json', { import: 'default' });
const cache = new Map<Lang, Dict>();
const listeners: Array<() => void> = [];

/** Language of the page as prerendered (set on <html data-lang> at build time). */
export let lang: Lang = (LANGS as readonly string[]).includes(document.documentElement.dataset.lang ?? '')
  ? (document.documentElement.dataset.lang as Lang)
  : 'en';

const $ = <T extends Element = HTMLElement>(s: string) => document.querySelector<T>(s);

export async function loadDict(l: Lang): Promise<Dict> {
  let d = cache.get(l);
  if (!d) {
    d = await loaders[`../i18n/${l}.json`]();
    cache.set(l, d);
  }
  return d;
}

/** Synchronous lookup for UI messages; the current dictionary is loaded during init. */
export const t = (key: string): string => cache.get(lang)?.[key] ?? cache.get('en')?.[key] ?? key;

export const onLangChange = (fn: () => void) => listeners.push(fn);


export async function setLang(l: Lang, opts: { persist?: boolean } = {}) {
  if (!(LANGS as readonly string[]).includes(l)) l = 'en';
  const d = await loadDict(l);
  const changed = l !== lang;
  lang = l;
  const root = document.documentElement;
  root.lang = HTML_LANG[l];
  root.dataset.lang = l;
  if (changed) {
    document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
      const v = d[el.dataset.i18n!];
      if (v !== undefined) el.innerHTML = v;
    });
    $('#alloc')!.innerHTML = allocRows(d);
    $('#addrs')!.innerHTML = addrRows(d);
    document.title = pageTitle(d);
    $<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', pageDescription(d));
    history.replaceState(history.state, '', langPath(l) + location.hash);
  }
  $<HTMLSelectElement>('#langSel')!.value = l;
  if (opts.persist) {
    try { localStorage.setItem('hvx-lang', l); } catch { /* storage unavailable */ }
  }
  listeners.forEach((fn) => fn());
}

function preferredLang(): Lang | null {
  let saved: string | null = null;
  try { saved = localStorage.getItem('hvx-lang'); } catch { /* storage unavailable */ }
  if (saved && (LANGS as readonly string[]).includes(saved)) return saved as Lang;
  // Unsupported browser languages (including Korean) fall back to English.
  const nav = (navigator.language || 'en').toLowerCase();
  if (nav.startsWith('fil') || nav.startsWith('tl')) return 'tl';
  for (const l of ['ja', 'zh', 'ru'] as const) if (nav.startsWith(l)) return l;
  return null;
}

export async function initI18n() {
  $<HTMLSelectElement>('#langSel')!.addEventListener('change', (e) =>
    setLang((e.target as HTMLSelectElement).value as Lang, { persist: true }));
  // Only the root URL auto-switches; /tl/, /ja/ … are explicit choices.
  const target = location.pathname === '/' ? preferredLang() ?? lang : lang;
  await Promise.all([loadDict('en'), setLang(target)]);
}
