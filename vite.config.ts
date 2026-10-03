import { defineConfig, loadEnv, type Plugin } from 'vite';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'node-html-parser';
import { LANGS, HTML_LANG, OG_LOCALE, TOKEN, langPath, type Lang } from './src/config';
import { allocRows, addrRows, donutCircles, pageTitle, pageDescription, stripTags, type Dict } from './src/content';

const root = dirname(fileURLToPath(import.meta.url));
/** Official domain. SITE_URL can override it, e.g. for a staging build. */
const DEFAULT_SITE = 'https://hvxglobal.com';
const LANG_NAMES: Record<Lang, string> = { en: 'English', tl: 'Filipino', ja: '日本語', zh: '中文', ru: 'Русский' };

const dicts = Object.fromEntries(
  LANGS.map((l) => [l, JSON.parse(readFileSync(resolve(root, `i18n/${l}.json`), 'utf8')) as Dict]),
) as Record<Lang, Dict>;

/** Official channels and contacts. Env vars (see .env.example) override; empty values are omitted. */
interface Official { email: string; x: string; telegram: string; security: string }
/** Cloudflare Email Routing forwards this address to the owner's mailbox. */
const DEFAULT_EMAIL = 'contact@hvxglobal.com';
const readOfficial = (env: Record<string, string>): Official => ({
  email: env.OFFICIAL_EMAIL ?? DEFAULT_EMAIL,
  x: env.OFFICIAL_X ?? '',
  telegram: env.OFFICIAL_TELEGRAM ?? '',
  security: env.SECURITY_CONTACT || (env.OFFICIAL_EMAIL ?? DEFAULT_EMAIL),
});

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const handle = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, '');

/** <head> block for SEO and sharing. Replaces anything between the seo markers. */
function seoBlock(site: string, opts: { title: string; description: string; path: string; lang?: Lang; alternates?: boolean; noindex?: boolean }) {
  const url = site + opts.path;
  const tags = [
    `<meta name="description" content="${esc(opts.description)}">`,
    `<link rel="canonical" href="${url}">`,
  ];
  if (opts.noindex) tags.push('<meta name="robots" content="noindex">');
  if (opts.alternates) {
    for (const l of LANGS) tags.push(`<link rel="alternate" hreflang="${HTML_LANG[l]}" href="${site}${langPath(l)}">`);
    tags.push(`<link rel="alternate" hreflang="x-default" href="${site}/">`);
  }
  const ogLocale = OG_LOCALE[opts.lang ?? 'en'];
  tags.push(
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="HIVE-X">',
    `<meta property="og:title" content="${esc(opts.title)}">`,
    `<meta property="og:description" content="${esc(opts.description)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${site}/og.png">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:image:alt" content="HIVE-X Card">',
    `<meta property="og:locale" content="${ogLocale}">`,
    ...(opts.alternates ? LANGS.filter((l) => l !== (opts.lang ?? 'en')).map((l) => `<meta property="og:locale:alternate" content="${OG_LOCALE[l]}">`) : []),
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${esc(opts.title)}">`,
    `<meta name="twitter:description" content="${esc(opts.description)}">`,
    `<meta name="twitter:image" content="${site}/og.png">`,
  );
  return `<!--seo-->\n${tags.join('\n')}\n<!--/seo-->`;
}

const SEO_BLOCK = /<!--seo-->[\s\S]*?<!--\/seo-->/;
const withSeo = (html: string, block: string) =>
  SEO_BLOCK.test(html) ? html.replace(SEO_BLOCK, () => block) : html.replace('<!--seo-->', () => block);

/** Official channel links; labels use data-i18n so the runtime language switch updates them. */
function channelItems(d: Dict, site: string, o: Official): string {
  const item = (href: string, labelKey: string | null, label: string, value: string) =>
    `<li><a href="${esc(href)}"${href.startsWith('http') && !href.startsWith(site) ? ' target="_blank" rel="noopener"' : ''}>${labelKey ? `<span data-i18n="${labelKey}">${d[labelKey]}</span>` : label} <small>${esc(value)}</small></a></li>`;
  return [
    item(site + '/', 'channels.website', '', handle(site)),
    o.x && item(o.x, null, 'X', '@' + handle(o.x).split('/').pop()),
    o.telegram && item(o.telegram, null, 'Telegram', handle(o.telegram)),
    o.email && item('mailto:' + o.email, 'channels.email', '', o.email),
  ].filter(Boolean).join('');
}

/** Prerender the home page in one language: text, tables, <head> metadata. */
function localizeHome(html: string, lang: Lang, site: string, official: Official): string {
  const d = dicts[lang];
  const title = pageTitle(d);
  html = withSeo(html, seoBlock(site, { title, description: pageDescription(d), path: langPath(lang), lang, alternates: true }));
  const doc = parse(html, { comment: true });
  const htmlEl = doc.querySelector('html')!;
  htmlEl.setAttribute('lang', HTML_LANG[lang]);
  htmlEl.setAttribute('data-lang', lang);
  doc.querySelector('title')!.set_content(esc(title));
  // Channel labels are prerendered first so the generic data-i18n pass below also covers them.
  doc.querySelector('#chlist')!.set_content(channelItems(d, site, official));
  for (const el of doc.querySelectorAll('[data-i18n]')) {
    const key = el.getAttribute('data-i18n')!;
    if (d[key] === undefined) throw new Error(`Missing i18n key "${key}" in ${lang}.json`);
    el.set_content(d[key]);
  }
  doc.querySelector('#alloc')!.set_content(allocRows(d));
  doc.querySelector('#addrs')!.set_content(addrRows(d));
  doc.querySelector('#donut')!.set_content(donutCircles());
  doc.querySelector('#kvc')!.set_content(TOKEN);
  const guardLink = doc.querySelector('#guardLink')!;
  guardLink.set_content(esc(new URL(site).host));
  guardLink.setAttribute('href', site + '/');
  for (const opt of doc.querySelectorAll('#langSel option')) {
    if (opt.getAttribute('value') === lang) opt.setAttribute('selected', '');
    else opt.removeAttribute('selected');
  }
  return doc.toString();
}

/** Risk disclosure page: the footer disclosure in every supported language. */
function riskSections(): string {
  return LANGS.map((l) =>
    `<section class="doc-lang" lang="${HTML_LANG[l]}"><h2>${LANG_NAMES[l]}</h2><p>${dicts[l]['footer.risk'].replace(/<br\s*\/?><br\s*\/?>©.*$/, '')}</p></section>`,
  ).join('\n');
}

/** Press kit: media contact and official links come from the deployment env. */
function pressContact(site: string, o: Official): string {
  const links = [
    `<a href="${site}/">${handle(site)}</a>`,
    o.x && `<a href="${esc(o.x)}" target="_blank" rel="noopener">X: ${esc(handle(o.x))}</a>`,
    o.telegram && `<a href="${esc(o.telegram)}" target="_blank" rel="noopener">Telegram: ${esc(handle(o.telegram))}</a>`,
  ].filter(Boolean).join(' · ');
  const mail = o.email ? `<a href="mailto:${esc(o.email)}">${esc(o.email)}</a>` : 'To be announced';
  return `<p><b>Media contact:</b> ${mail}</p>\n      <p><b>Official links:</b> ${links}</p>`;
}

const PAGES: Record<string, { title: string; description: string; noindex: boolean }> = {
  '/terms/': { title: 'Terms of use · HIVE-X', description: 'HIVE-X terms of use.', noindex: true },
  '/privacy/': { title: 'Privacy policy · HIVE-X', description: 'HIVE-X privacy policy.', noindex: true },
  '/risk-disclosure/': { title: 'Risk disclosure · HIVE-X', description: stripTags(dicts.en['footer.risk']).replace(/©.*$/, '').trim(), noindex: false },
  '/press/': { title: 'Press kit · HIVE-X', description: 'Facts, logos and contacts for media covering HIVE-X (HVX).', noindex: false },
  '/404.html': { title: 'Page not found · HIVE-X', description: 'Page not found.', noindex: true },
};

/** Headers from the "/*" block of public/_headers, so `vite preview` behaves like Cloudflare Pages. */
function productionHeaders(): Record<string, string> {
  const out: Record<string, string> = {};
  let inGlobal = false;
  for (const line of readFileSync(resolve(root, 'public/_headers'), 'utf8').split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) { inGlobal = line.trim() === '/*'; continue; }
    const i = line.indexOf(':');
    if (inGlobal && i > 0) out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return out;
}

function hvxSite(): Plugin {
  let site = DEFAULT_SITE;
  let official = readOfficial({});
  let outDir = 'dist';
  return {
    name: 'hvx-site',
    enforce: 'post',
    configResolved(c) {
      outDir = resolve(c.root, c.build.outDir);
      const env = loadEnv(c.mode, c.root, '');
      site = (env.SITE_URL || DEFAULT_SITE).replace(/\/+$/, '');
      official = readOfficial(env);
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const path = ctx.path.replace(/index\.html$/, '');
        if (path === '/') return localizeHome(html, 'en', site, official);
        const page = PAGES[path] ?? PAGES[ctx.path];
        if (!page) return html;
        html = withSeo(html, seoBlock(site, { title: page.title, description: page.description, path: path === '/404.html' ? '/' : path, noindex: page.noindex }));
        return html.replace('<!--risk-all-->', riskSections()).replace('<!--press-contact-->', () => pressContact(site, official));
      },
    },
    writeBundle() {
      // Inline the stylesheets: removes render-blocking round trips on slow mobile networks.
      const inlineCss = (html: string) =>
        html.replace(/<link rel="stylesheet" crossorigin href="(\/assets\/[^"]+\.css)">/g,
          (_, href: string) => `<style>${readFileSync(resolve(outDir, href.slice(1)), 'utf8').trim()}</style>`);
      for (const file of ['index.html', 'terms/index.html', 'privacy/index.html', 'risk-disclosure/index.html', 'press/index.html', '404.html']) {
        const p = resolve(outDir, file);
        writeFileSync(p, inlineCss(readFileSync(p, 'utf8')));
      }
      const home = readFileSync(resolve(outDir, 'index.html'), 'utf8');
      for (const l of LANGS) {
        if (l === 'en') continue;
        mkdirSync(resolve(outDir, l), { recursive: true });
        writeFileSync(resolve(outDir, l, 'index.html'), localizeHome(home, l, site, official));
      }
      if (official.security) {
        // RFC 9116. Expires one year after the build; any redeploy refreshes it.
        const expires = new Date(Date.now() + 365 * 864e5).toISOString().replace(/\.\d+Z$/, 'Z');
        const contact = official.security.includes(':') ? official.security : 'mailto:' + official.security;
        mkdirSync(resolve(outDir, '.well-known'), { recursive: true });
        writeFileSync(resolve(outDir, '.well-known/security.txt'),
          `Contact: ${contact}\nExpires: ${expires}\nPreferred-Languages: en\nCanonical: ${site}/.well-known/security.txt\n`);
      }
      writeFileSync(resolve(outDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`);
      const alt = LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${HTML_LANG[l]}" href="${site}${langPath(l)}"/>`).join('\n')
        + `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${site}/"/>`;
      const urls = [
        ...LANGS.map((l) => `  <url>\n    <loc>${site}${langPath(l)}</loc>\n${alt}\n  </url>`),
        ...Object.entries(PAGES).filter(([, p]) => !p.noindex).map(([path]) => `  <url>\n    <loc>${site}${path}</loc>\n  </url>`),
      ];
      writeFileSync(resolve(outDir, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, '');
  const officialHost = new URL(env.SITE_URL || DEFAULT_SITE).host;
  // Cloudflare Pages sets CF_PAGES_URL (https://<hash>.<project>.pages.dev) during its builds.
  const pagesHost = env.CF_PAGES_URL ? new URL(env.CF_PAGES_URL).host.split('.').slice(-3).join('.') : '';
  return {
    plugins: [hvxSite()],
    define: {
      __OFFICIAL_HOST__: JSON.stringify(officialHost),
      __PAGES_HOST__: JSON.stringify(pagesHost),
    },
    preview: { headers: productionHeaders() },
    build: {
      target: 'es2020',
      rollupOptions: {
        input: {
          main: resolve(root, 'index.html'),
          terms: resolve(root, 'terms/index.html'),
          privacy: resolve(root, 'privacy/index.html'),
          risk: resolve(root, 'risk-disclosure/index.html'),
          press: resolve(root, 'press/index.html'),
          notFound: resolve(root, '404.html'),
        },
      },
    },
  };
});
