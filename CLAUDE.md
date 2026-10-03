# HIVE-X (HVX) Official Website — Project Brief

This file is the single source of truth for the HVX website project. Read it fully before changing anything.

## 1. What this is
Official website for **HIVE-X**, a cross-border payment ecosystem built around the **HVX** BEP-20 token, a crypto-funded payment card (HIVE-X Card) and a wallet app in development (HIVE Wallet). The site must feel as trustworthy as a major international card issuer (think Amex / Revolut / Visa-level polish): clean, light, generous whitespace, product-first.

The approved design and content baseline is the original single-file prototype, kept unchanged in `prototype/index.html` (logos embedded as base64, index-aligned strings in `prototype/strings.json`). The live project is the Vite + vanilla TypeScript build described in §5a; its rendered output matches the prototype (verified by layout measurement at 1280px and 390px).

## 2. Verified on-chain facts (do not change without re-checking on-chain)
| Item | Value |
|---|---|
| Network | BNB Smart Chain (chain id 56 / 0x38) |
| Token name (on-chain) | **HiveX** |
| Symbol | **HVX** |
| Decimals | 18 |
| Total supply | 100,000,000,000 (fixed; no mint function, no owner) |
| Token contract | `0x252Ce29d2a58B70f98fe80a67773747770Bb0028` |
| Vesting vault | `0x04d4D102eed59b34A1A6527b48cCa690daEeC8a3` |
| Official website | **https://hvxglobal.com** (decided 2026-10-03; default in `vite.config.ts`) |
| Treasury (Safe 2-of-3) | `0xc5748294eE8884E7ac0bf27E0978cBA4c81b6d75` |

Brand name on the site is **HIVE-X**; the on-chain token name is **HiveX**. Use "HiveX (HVX)" in any exchange / listing / registry form.

Allocation: Sales 30% · Foundation 25% (25% at TGE, then linear 24 months) · Team 20% (same) · Ecosystem 10% · Liquidity 10% · Marketing 5%.

## 3. Product status (keep these labels honest)
| Feature | Status label on site |
|---|---|
| HVX token deployed + verified | Live / Completed |
| Safe 2-of-3 treasury, 24-month vesting | Live / Completed |
| Card: KYC onboarding | Live |
| Card: USDT top-up | Live |
| Card: real in-store payments tested | Live (pilot) |
| Card: HVX top-up | In development |
| Card network partnership | In progress (never say "completed") |
| HIVE Wallet app | In development |
| Exchange listing | Planned — not confirmed |
| Regional (Philippine) entity | Planned / in progress |

## 4. Hard rules
1. **No Korean language anywhere** (UI, meta tags, comments shipped to users, alt text). Supported languages: English (default), Filipino/Tagalog (`tl`), Japanese (`ja`), Simplified Chinese (`zh`), Russian (`ru`).
2. **No price, return or listing promises.** No "guaranteed", "x10", "listing price", "pre-listing price", "Mastercard partnership completed". Keep the risk disclosure in the footer in every language.
3. **No Visa / Mastercard logos or card numbers that look like a real BIN.** Card render shows `•••• •••• •••• 2026` only.
4. **No referral / multi-level reward language** on the site.
5. Never ask users for seed phrases or private keys; keep the anti-scam FAQ.
6. Wallet connection must be generic ("Connect Wallet"), supporting any BSC wallet — not Trust-Wallet-only.

## 5. Features already in the prototype
- Hero with 3D card render (pointer tilt + shine). Since 2026-10-03 it mirrors the issued physical card: mint portrait card, dark-green circular HVX hexagon emblem, chip, contactless, "business" label. Deliberately omitted: the Mastercard logo (rule 3), the card program partner logo, and any number except `•••• 2026`, floating status chips, official-contract copy pill.
- "Works with" wallet marquee, trust bar, products (Card / HIVE Wallet / HVX), how-it-works, HIVE Wallet phone preview (labelled SAMPLE SCREEN · IN DEVELOPMENT), dark security band, tokenomics donut + table, **live on-chain panel** (total supply, vault balance, Safe balance, latest block via public RPC, 30s refresh, static fallback), official addresses with BscScan links, manual add-token box, roadmap, FAQ, footer with Developers links.
- **Connect Wallet modal**: EIP-6963 multi-wallet discovery (MetaMask, Trust, Coinbase, OKX, Rabby…), legacy `window.ethereum` fallback, switch/add BSC, read HVX balance, `wallet_watchAsset` to add HVX. Mobile deep links: MetaMask (`metamask.app.link/dapp/…`), Trust Wallet open_url and add_asset (`c20000714_t<contract>`), HIVE Wallet "Soon".
- i18n: elements carry `data-i18n="<key>"` (e.g. `hero.title`); translations live in `i18n/<lang>.json` (flat keyed JSON, one file per language, same key set). Language picker + browser-language auto-detect on `/`; Korean browsers fall back to English.
- Light/dark theme via CSS tokens; mobile-safe down to 390px in all 5 languages.

## 5a. Project structure and commands (Vite + vanilla TypeScript, static output)
```
npm ci
npm run dev        # local dev server
npm run build      # typecheck + i18n/Korean check + production build into dist/
npm test           # Playwright end-to-end tests against dist/ (run build first)
npm run preview    # serve dist/ locally, with the production headers from public/_headers
npm run icons      # regenerate favicons + web manifest in public/ from assets/
npm run og         # regenerate public/og.png (1200×630) from scripts/og.html via local Chrome/Edge
```
- `index.html` — home page template (English text inline). `src/main.ts` entry; `src/i18n.ts` (language switch), `src/wallet.ts` (Connect Wallet modal), `src/live.ts` (on-chain panel), `src/guard.ts` (anti-phishing banner), `src/content.ts` (allocation/address markup shared by build and runtime), `src/config.ts` (verified addresses, languages).
- `vite.config.ts` plugin `hvx-site` prerenders the home page into `/`, `/tl/`, `/ja/`, `/zh/`, `/ru/` (translated text, tables, official channels, `<title>`, description, canonical, hreflang, OG/Twitter), inlines CSS, and writes `robots.txt`, `sitemap.xml` and `/.well-known/security.txt`. The picker switches language in place and updates the URL.
- Env (`.env.example`, set in Cloudflare Pages → Settings → Variables): `SITE_URL` (defaults to `https://hvxglobal.com`; override only for staging — drives canonical/OG/sitemap/phishing guard), `OFFICIAL_EMAIL`, `OFFICIAL_X`, `OFFICIAL_TELEGRAM`, `SECURITY_CONTACT` (all optional; empty = hidden), `VITE_WC_PROJECT_ID` (optional; empty = WalletConnect code left out of the bundle).
- Fonts: Plus Jakarta Sans (variable) + IBM Plex Mono self-hosted via Fontsource. Japanese and Chinese use platform fonts (Hiragino/PingFang, Noto Sans CJK on Android, Yu Gothic/YaHei on Windows) — a CJK web font cost ~250 ms main-thread time on slow phones.
- Anti-phishing: on any host other than `SITE_URL`'s host, `localhost`, or this project's `*.pages.dev` (from `CF_PAGES_URL` at build), a red banner says the copy is not official and links to the real domain.
- Security headers (CSP, frame-ancestors none, nosniff, HSTS, Permissions-Policy) live in `public/_headers` (Cloudflare) and `vercel.json`; keep them in sync. The CSP already allows the WalletConnect/Reown hosts.
- CI: `.github/workflows/ci.yml` runs build + tests on every push/PR (actions pinned to commit SHAs, read-only token, no secrets). Dependabot updates npm and actions weekly.

## 6. Task status
- 2026-10-03: fixed layout bugs inherited from the prototype (HIVE Wallet feature titles squeezed by the `.feat div` selector; table/live panel/manual-add/footer squeezed on phones; overflow at 320–360px). Hero and in-app card renders now mirror the issued physical card (§5).
- 2026-10-03: added HIVE-X Card details section, official channels block, phishing guard, press kit (`/press/`), CSP + security headers, `security.txt`, `SECURITY.md`, README, Playwright tests (44: all languages × 5 widths, modal, language switch, headers, content rules), CI and Dependabot. Status colors darkened slightly for WCAG AA (`--live` #187a4f, `--prog` #905b00).

1. ✅ **Restructure** — done (§5a). Deliberate differences from the prototype: footer has Terms/Privacy/Press links, card render matches the real card, Chinese text uses Chinese glyph fonts.
2. 🟡 **WalletConnect v2 / Reown** — implemented, lazy-loaded on click. **Needs `VITE_WC_PROJECT_ID`** (cloud.reown.com) with the production domain on its allowlist; then test with a phone on the real domain.
3. ✅ **SEO & sharing** — per-language metadata, `og.png`, favicons, robots, sitemap.
4. ✅ **Pages** — `/terms/`, `/privacy/` (placeholders, `noindex` until counsel provides text — flip `PAGES[...].noindex` in `vite.config.ts`), `/risk-disclosure/`, `/press/`, `404.html`.
5. ✅ **Performance** — Lighthouse mobile (local, simulated throttling) on every language page: Performance 99, Accessibility 100, Best Practices 100, SEO 100; press/risk pages 100.
6. ⏳ **Deploy** — Cloudflare Pages via GitHub integration (build `npm run build`, output `dist`, Node 24, env vars above). Owner: register the domain, create the repo and Pages project, add the custom domain.
7. ⏳ **After deploy** — send the site URL + `assets/hvx-logo-256.png` to the token deployer for the BscScan token profile. Trust Wallet draft in `trustwallet/…/0x252Ce29d2a58B70f98fe80a67773747770Bb0028/`: fill `website` and `links`, check current submission rules/fees.

## 7. Open questions for the owner
- Treasury Safe currently holds 0 HVX on-chain while the vault holds ~60B. Decide whether to keep showing the "Treasury (Safe)" live figure.
- Official email and social links (X/Telegram) for the channels block, press kit and token profiles. (Domain decided: hvxglobal.com.)
- Native-speaker review of Filipino, Japanese, Chinese and Russian copy before launch.

## 8. Files in this package
```
hvx-website/
├── CLAUDE.md                ← this brief
├── index.html               ← home page template (Vite entry)
├── terms/ privacy/ risk-disclosure/ press/ 404.html   ← secondary pages
├── tests/                   ← Playwright end-to-end tests
├── .github/                 ← CI workflow, Dependabot
├── src/                     ← TypeScript + styles
├── i18n/{en,tl,ja,zh,ru}.json  ← keyed strings, incl. dynamic UI strings (dyn.*, alloc.*, addr.*)
├── public/                  ← favicons, manifest, og.png, press/ downloads, _headers (copied as-is)
├── scripts/                 ← check-i18n, make-icons, make-og (+ og.html)
├── vite.config.ts           ← build + prerender/SEO plugin
├── vercel.json, .env.example, README.md, SECURITY.md
├── trustwallet/             ← Trust Wallet assets submission draft
├── prototype/               ← original approved single-file prototype + index-aligned strings (reference only)
└── assets/
    ├── hvx-logo-original.png
    ├── hvx-logo-256.png     ← BscScan / Trust Wallet submission size
    ├── hvx-logo-160.png
    ├── hvx-logo-96.png
    └── hvx-logo-64.webp     ← used in the page (nav, card, footer)
```
