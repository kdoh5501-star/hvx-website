let hideTimer: number | undefined;

export function toast(message: string) {
  const el = document.querySelector<HTMLElement>('#toast')!;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => el.classList.remove('show'), 1800);
}
