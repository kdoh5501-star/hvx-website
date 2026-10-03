// End-to-end checks against the production build (`npm run build` first).
import { test, expect, type Page } from '@playwright/test';

const HOME = [
  { path: '/', lang: 'en' },
  { path: '/tl/', lang: 'fil' },
  { path: '/ja/', lang: 'ja' },
  { path: '/zh/', lang: 'zh-Hans' },
  { path: '/ru/', lang: 'ru' },
];
const OTHER = ['/terms/', '/privacy/', '/risk-disclosure/', '/press/', '/404.html'];
const WIDTHS = [1280, 820, 390, 360, 320];

// CLAUDE.md hard rules: no promises of price, returns or listing, no referral language.
const BANNED = [/guaranteed/i, /\bx10\b/i, /listing price/i, /partnership completed/i, /referral/i, /multi-level/i];
const HANGUL = new RegExp('[' + String.fromCodePoint(0xac00) + '-' + String.fromCodePoint(0xd7af) + ']');

/** Elements that stick out of the viewport or have text squeezed into a very narrow box. */
async function layoutProblems(page: Page) {
  return page.evaluate(() => {
    const cw = document.documentElement.clientWidth;
    const skip = (e: Element) => !!e.closest('.track,.stage,.tbl,.modal,[hidden],.acts2,.cardsec-visual');
    const overflow = [...document.querySelectorAll('body *')]
      .filter((e) => !skip(e) && e.getBoundingClientRect().right > cw + 1)
      .map((e) => `${e.tagName}.${e.className}`);
    const squeezed = [...document.querySelectorAll('h1,h2,h3,p,li,td,dd,dt,summary,b,span')]
      .filter((e) => {
        if (skip(e)) return false;
        const r = e.getBoundingClientRect();
        const lh = parseFloat(getComputedStyle(e).lineHeight) || 20;
        return r.width > 0 && r.width < 110 && r.height / lh >= 3 && (e.textContent ?? '').trim().split(/\s+/).length > 1;
      })
      .map((e) => `${e.tagName}: ${(e.textContent ?? '').trim().slice(0, 30)}`);
    return { overflow: overflow.slice(0, 5), squeezed: squeezed.slice(0, 5) };
  });
}

for (const { path, lang } of HOME) {
  test.describe(`home ${path}`, () => {
    test('renders prerendered content without errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.locator('h1')).not.toBeEmpty();
      await expect(page.locator('#alloc tr')).toHaveCount(6);
      await expect(page.locator('#addrs .arow')).toHaveCount(3);
      await expect(page.locator('link[rel=alternate][hreflang=x-default]')).toHaveCount(1);
      await expect(page.locator('#guard')).toBeHidden();
      // Live RPC failures are tolerated (static fallback); everything else must be clean.
      expect(errors.filter((e) => !/bsc-dataseed|Failed to fetch|ERR_/.test(e))).toEqual([]);
    });

    for (const width of WIDTHS) {
      test(`layout at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);
        expect(await layoutProblems(page)).toEqual({ overflow: [], squeezed: [] });
      });
    }

    test('follows content rules', async ({ request }) => {
      const html = await (await request.get(path)).text();
      for (const re of BANNED) expect(html, `banned phrase ${re}`).not.toMatch(re);
      expect(html).not.toMatch(HANGUL);
      expect(html).not.toMatch(/mastercard|visa/i);
      expect(html).toContain('0x252Ce29d2a58B70f98fe80a67773747770Bb0028');
    });
  });
}

for (const path of OTHER) {
  test(`${path} loads and fits small screens`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1')).not.toBeEmpty();
    expect(await layoutProblems(page)).toEqual({ overflow: [], squeezed: [] });
  });
}

test('wallet modal opens, shows deep links and closes with Escape', async ({ page }) => {
  await page.goto('/');
  await page.locator('#navConnect').click();
  await expect(page.locator('#modal')).toBeVisible();
  await expect(page.locator('#m-mm')).toHaveAttribute('href', /^https:\/\/metamask\.app\.link\/dapp\//);
  await expect(page.locator('#m-add')).toHaveAttribute('href', /c20000714_t0x252Ce29d2a58B70f98fe80a67773747770Bb0028$/);
  await page.keyboard.press('Escape');
  await expect(page.locator('#modal')).toBeHidden();
});

test('language picker switches text and URL in place', async ({ page }) => {
  await page.goto('/');
  await page.locator('#langSel').selectOption('ja');
  await expect(page).toHaveURL(/\/ja\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  await expect(page.locator('#alloc tr').first()).toContainText('販売');
  await page.locator('#langSel').selectOption('en');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('h1')).toContainText('without borders');
});

test('security headers are sent', async ({ request }) => {
  const res = await request.get('/');
  const h = res.headers();
  expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(h['content-security-policy']).toContain("script-src 'self'");
  expect(h['x-frame-options']).toBe('DENY');
  expect(h['x-content-type-options']).toBe('nosniff');
});

test('SEO files are generated', async ({ request }) => {
  expect((await request.get('/robots.txt')).status()).toBe(200);
  const sitemap = await (await request.get('/sitemap.xml')).text();
  for (const p of ['/tl/', '/ja/', '/zh/', '/ru/', '/press/']) expect(sitemap).toContain(p);
});
