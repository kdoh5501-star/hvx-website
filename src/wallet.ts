// Connect Wallet modal: EIP-6963 discovery (desktop extensions), legacy window.ethereum fallback,
// optional WalletConnect v2 QR (Reown) for mobile wallets, and mobile deep links.
import { CHAIN_ID, CHAIN_ID_HEX, RPC, TOKEN } from './config';
import { t, onLangChange } from './i18n';
import { balanceOfData } from './live';
import { toast } from './ui';

interface Eip1193 {
  request(args: { method: string; params?: unknown[] | object }): Promise<any>;
  isMetaMask?: boolean;
  isTrust?: boolean;
}
interface WalletInfo { uuid: string; name: string; icon: string }
interface Announced { info: WalletInfo; provider: Eip1193 }

declare global {
  interface Window { ethereum?: Eip1193 }
}

const WC_PROJECT_ID = import.meta.env.VITE_WC_PROJECT_ID;
const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!;
const wallets = new Map<string, Announced>();
const M = $('#modal');
let lastFocus: Element | null = null;
let connectedLabel = '';

function renderDetected() {
  const box = $('#detected');
  const list = [...wallets.values()];
  if (!list.length && window.ethereum) {
    const p = window.ethereum;
    list.push({ info: { uuid: 'legacy', name: p.isTrust ? 'Trust Wallet' : p.isMetaMask ? 'MetaMask' : 'Browser wallet', icon: '' }, provider: p });
  }
  $('#detected-wrap').hidden = !list.length;
  box.innerHTML = '';
  for (const w of list) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'wopt';
    let ic: HTMLElement;
    if (w.info.icon) {
      const img = document.createElement('img');
      img.src = w.info.icon;
      img.alt = '';
      ic = img;
    } else {
      ic = document.createElement('span');
      ic.className = 'mono';
      ic.textContent = w.info.name.slice(0, 2).toUpperCase();
    }
    const lab = document.createElement('span');
    lab.textContent = w.info.name;
    const sm = document.createElement('small');
    sm.textContent = t('dyn.connectadd');
    lab.appendChild(sm);
    b.append(ic, lab);
    b.onclick = () => connect(w.provider, w.info.name);
    box.appendChild(b);
  }
}

const msg = (text: string, cls = '') => {
  const m = $('#wmsg');
  m.textContent = text;
  m.className = cls;
};

async function connect(p: Eip1193, name: string, { inModal = true } = {}) {
  if (inModal) msg(t('dyn.waiting').replace('{n}', name));
  try {
    const [acct] = (await p.request({ method: 'eth_requestAccounts' })) as string[];
    try {
      await p.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN_ID_HEX }] });
    } catch (err: any) {
      if (err?.code !== 4902) throw err;
      await p.request({
        method: 'wallet_addEthereumChain',
        params: [{ chainId: CHAIN_ID_HEX, chainName: 'BNB Smart Chain', nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 }, rpcUrls: [RPC], blockExplorerUrls: ['https://bscscan.com'] }],
      });
    }
    let bal = '';
    try {
      const raw = await p.request({ method: 'eth_call', params: [{ to: TOKEN, data: balanceOfData(acct) }, 'latest'] });
      bal = (Number(BigInt(raw) / 10n ** 14n) / 1e4).toLocaleString('en-US', { maximumFractionDigits: 4 });
    } catch { /* balance is optional */ }
    try {
      await p.request({ method: 'wallet_watchAsset', params: { type: 'ERC20', options: { address: TOKEN, symbol: 'HVX', decimals: 18 } } });
    } catch { /* not every wallet supports watchAsset */ }
    const short = `${acct.slice(0, 6)}…${acct.slice(-4)}`;
    const nb = $('#navConnect');
    nb.removeAttribute('data-i18n');
    connectedLabel = bal !== '' ? `${short} · ${bal} HVX` : short;
    nb.textContent = connectedLabel;
    toast(t('dyn.toastc'));
    if (inModal) {
      msg(t('dyn.connected').replace('{a}', short), 'ok');
      setTimeout(closeModal, 900);
    }
  } catch (err: any) {
    const text = err?.code === 4001 ? t('dyn.cancel') : t('dyn.fail');
    if (inModal) msg(text, 'err');
    else toast(text);
  }
}

async function connectWalletConnect() {
  msg(t('dyn.waiting').replace('{n}', 'WalletConnect'));
  try {
    // Loaded on demand so the WalletConnect / Reown bundle never weighs on first paint.
    const { EthereumProvider } = await import('@walletconnect/ethereum-provider');
    const origin = location.origin;
    const provider = await EthereumProvider.init({
      projectId: WC_PROJECT_ID!,
      chains: [CHAIN_ID],
      showQrModal: true,
      rpcMap: { [CHAIN_ID]: RPC },
      metadata: {
        name: 'HIVE-X',
        description: 'HIVE-X (HVX) cross-border payments on BNB Smart Chain',
        url: origin,
        icons: [`${origin}/icon-192.png`],
      },
    });
    // The WalletConnect QR modal opens on top; hide ours while it is shown.
    closeModal();
    await provider.connect();
    await connect(provider as unknown as Eip1193, 'WalletConnect', { inModal: false });
  } catch (err: any) {
    const text = err?.code === 4001 ? t('dyn.cancel') : t('dyn.fail');
    if (M.hidden) toast(text);
    else msg(text, 'err');
  }
}

function openModal() {
  lastFocus = document.activeElement;
  renderDetected();
  msg('');
  M.hidden = false;
  $('#mclose').focus();
}

function closeModal() {
  if (M.hidden) return;
  M.hidden = true;
  (lastFocus as HTMLElement | null)?.focus?.();
}

export function initWallet() {
  addEventListener('eip6963:announceProvider', ((e: CustomEvent<Announced>) => {
    const d = e.detail;
    if (d?.info) wallets.set(d.info.uuid, d);
    renderDetected();
  }) as EventListener);
  dispatchEvent(new Event('eip6963:requestProvider'));

  const site = location.href.split('#')[0];
  $<HTMLAnchorElement>('#m-mm').href = 'https://metamask.app.link/dapp/' + site.replace(/^https?:\/\//, '');
  $<HTMLAnchorElement>('#m-tw').href = 'https://link.trustwallet.com/open_url?coin_id=20000714&url=' + encodeURIComponent(site);
  $<HTMLAnchorElement>('#m-add').href = 'https://link.trustwallet.com/add_asset?asset=c20000714_t' + TOKEN;

  if (WC_PROJECT_ID) {
    $('#wc-wrap').hidden = false;
    $('#m-wc').addEventListener('click', connectWalletConnect);
  }

  document.querySelectorAll('[data-connect]').forEach((b) => b.addEventListener('click', openModal));
  $('#mclose').onclick = closeModal;
  M.addEventListener('click', (e) => { if (e.target === M) closeModal(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !M.hidden) closeModal(); });
  // Keep the connected address in the nav button across language switches.
  onLangChange(() => { if (connectedLabel) $('#navConnect').textContent = connectedLabel; });
}
