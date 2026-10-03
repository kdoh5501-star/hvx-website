import '@fontsource-variable/plus-jakarta-sans/wght.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './styles/main.css';
import { initGuard } from './guard';
import { initI18n, t } from './i18n';
import { initLive } from './live';
import { initWallet } from './wallet';
import { toast } from './ui';

/* copy buttons */
document.addEventListener('click', (e) => {
  const b = (e.target as Element).closest<HTMLElement>('[data-copy]');
  if (!b) return;
  navigator.clipboard.writeText(b.dataset.copy!).then(() => toast(t('dyn.copied')), () => toast(t('dyn.blocked')));
});

/* hero card tilt */
(() => {
  const stage = document.querySelector<HTMLElement>('#stage');
  const card = document.querySelector<HTMLElement>('#card');
  if (!stage || !card || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  stage.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `rotateX(${10 - y * 16}deg) rotateY(${-14 + x * 22}deg) rotateZ(3deg)`;
    card.style.setProperty('--shine', `${-30 + x * 80}%`);
  });
  stage.addEventListener('pointerleave', () => {
    card.style.transform = '';
    card.style.removeProperty('--shine');
  });
})();

initGuard();
initWallet();
initLive();
initI18n();
