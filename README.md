# HIVE-X website

Source of the official HIVE-X (HVX) website. Static site built with Vite and TypeScript, deployed
on Cloudflare Pages.

> **Official token contract (BNB Smart Chain):** `0x252Ce29d2a58B70f98fe80a67773747770Bb0028`
> Copies of this site on other domains are not operated by HIVE-X and show a warning banner.

## Development

```bash
npm ci
npm run dev       # local dev server
npm run build     # typecheck, i18n checks, production build into dist/
npm test          # end-to-end tests against the build (Playwright)
```

Configuration is read from environment variables; see [`.env.example`](.env.example).
Project brief, rules and status for contributors: [`CLAUDE.md`](CLAUDE.md).
Security reports: [`SECURITY.md`](SECURITY.md).

## License

Copyright © 2026 HIVE-X. All rights reserved. The source is published for transparency. The
HIVE-X name, logos, card designs and site content are not licensed for reuse.
