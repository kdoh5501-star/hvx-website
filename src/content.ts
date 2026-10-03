// Markup shared by the build-time prerender (vite.config.ts) and the runtime language switch.
import { TOKEN, VAULT, SAFE } from './config';

export type Dict = Record<string, string>;

export const ALLOC: ReadonlyArray<readonly [key: string, pct: number, color: string]> = [
  ['sales', 30, '#d6202f'],
  ['foundation', 25, '#8e0f1a'],
  ['team', 20, '#4a4f5b'],
  ['ecosystem', 10, '#c7cad1'],
  ['liquidity', 10, '#8d929c'],
  ['marketing', 5, '#e9a1a8'],
];

const ADDRS: ReadonlyArray<readonly [key: string, address: string, kind: 'token' | 'address']> = [
  ['token', TOKEN, 'token'],
  ['vault', VAULT, 'address'],
  ['treasury', SAFE, 'address'],
];

export function donutCircles(): string {
  const R = 88, C = 2 * Math.PI * R;
  let off = 0;
  return ALLOC.map(([, p, c]) => {
    const s = `<circle r="${R}" stroke="${c}" stroke-dasharray="${(C * p / 100 - 2.5).toFixed(3)} ${C.toFixed(3)}" stroke-dashoffset="${(-off).toFixed(3)}"></circle>`;
    off += C * p / 100;
    return s;
  }).join('');
}

export const allocRows = (d: Dict) =>
  ALLOC.map(([k, p, c]) =>
    `<tr><td><span class="sw" style="background:${c}"></span>${d[`alloc.${k}.name`]}</td><td class="num">${p}% · ${p}B HVX</td><td class="note">${d[`alloc.${k}.release`]}</td></tr>`,
  ).join('');

export const addrRows = (d: Dict) =>
  ADDRS.map(([k, a, kind]) =>
    `<div class="arow"><b>${d[`addr.${k}.name`]}<small>${d[`addr.${k}.desc`]}</small></b><code>${a}</code><div class="acts"><button class="mini" type="button" data-copy="${a}">${d['dyn.copy']}</button><a class="mini" href="https://bscscan.com/${kind}/${a}" target="_blank" rel="noopener">BscScan ↗</a></div></div>`,
  ).join('');

/** Plain-text page title and description per language, derived from existing hero copy. */
export const stripTags = (s: string) => s.replace(/<[^>]+>/g, '');
export const pageTitle = (d: Dict) => `HIVE-X (HVX) · ${stripTags(d['hero.title'])}`;
export const pageDescription = (d: Dict) => stripTags(d['hero.lead']);
