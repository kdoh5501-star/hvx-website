// Live on-chain panel. Starts when the panel approaches the viewport, refreshes every 30 s
// while the tab is visible, and keeps the static values if the RPC is unreachable.
import { RPC, TOKEN, VAULT, SAFE, SHOW_TREASURY_BALANCE } from './config';
import { t, onLangChange } from './i18n';

const $ = (s: string) => document.querySelector<HTMLElement>(s)!;
let live = false;
let timer: number | undefined;

const rpc = (method: string, params: unknown[]) =>
  fetch(RPC, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  }).then((r) => r.json()).then((j) => {
    if (j.error) throw new Error(j.error.message);
    return j.result as string;
  });

export const balanceOfData = (a: string) => '0x70a08231' + a.slice(2).toLowerCase().padStart(64, '0');
const balOf = (a: string) => rpc('eth_call', [{ to: TOKEN, data: balanceOfData(a) }, 'latest']);
const fmt = (hex: string) => Number(BigInt(hex) / 10n ** 18n).toLocaleString('en-US');

async function load() {
  try {
    const [sup, v, s, blk] = await Promise.all([
      rpc('eth_call', [{ to: TOKEN, data: '0x18160ddd' }, 'latest']),
      balOf(VAULT),
      SHOW_TREASURY_BALANCE ? balOf(SAFE) : Promise.resolve(''),
      rpc('eth_blockNumber', []),
    ]);
    $('#lv-supply').innerHTML = fmt(sup) + ' <small>HVX</small>';
    $('#lv-vault').innerHTML = fmt(v) + ' <small>HVX</small>';
    if (SHOW_TREASURY_BALANCE) $('#lv-safe').innerHTML = fmt(s) + ' <small>HVX</small>';
    $('#lv-block').textContent = '#' + parseInt(blk, 16).toLocaleString('en-US');
    if (!live) {
      live = true;
      $('#pulse').classList.add('on');
      const txt = $('#pulseTxt');
      txt.removeAttribute('data-i18n');
      txt.textContent = t('dyn.livet');
    }
  } catch { /* keep static fallback */ }
}

function schedule() {
  clearInterval(timer);
  if (document.visibilityState === 'visible') timer = window.setInterval(load, 30_000);
}

export function initLive() {
  onLangChange(() => { if (live) $('#pulseTxt').textContent = t('dyn.livet'); });
  const start = () => {
    load();
    schedule();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') load();
      schedule();
    });
  };
  const panel = document.querySelector('.live');
  if (!panel || !('IntersectionObserver' in window)) return start();
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { io.disconnect(); start(); }
  }, { rootMargin: '600px 0px' });
  io.observe(panel);
}
