// Anti-phishing banner: copies of this site served from any other host show a warning that
// points visitors to the official domain. Local development and this project's own Cloudflare
// Pages preview hosts are allowed.
declare const __OFFICIAL_HOST__: string;
declare const __PAGES_HOST__: string;

export function initGuard() {
  const official = __OFFICIAL_HOST__;
  const host = location.hostname;
  const allowed =
    host === official.replace(/:\d+$/, '') ||
    host === 'www.' + official ||
    host === 'localhost' || host === '127.0.0.1' || host === '[::1]' ||
    (!!__PAGES_HOST__ && (host === __PAGES_HOST__ || host.endsWith('.' + __PAGES_HOST__)));
  if (allowed) return;
  const banner = document.querySelector<HTMLElement>('#guard');
  if (banner) banner.hidden = false;
}
