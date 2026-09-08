/** Unavailable icon actions stay focusable so keyboard players can read the reason. */
export function actionAvailability(button: HTMLButtonElement, available: boolean, explanation: string) {
  button.disabled = false;
  button.setAttribute('aria-disabled', String(!available));
  button.title = explanation;
  button.setAttribute('aria-label', explanation);
}

export function mountActionHelp(root: HTMLElement) {
  const help = document.createElement('div');
  help.id = 'action-help'; help.setAttribute('role', 'tooltip'); help.hidden = true;
  root.append(help);
  let current: HTMLElement | undefined;
  const show = (target: EventTarget | null) => {
    const control = target instanceof Element ? target.closest<HTMLElement>('[title]') : null;
    current?.removeAttribute('aria-describedby');
    current = control ?? undefined;
    help.textContent = control?.title ?? '';
    help.hidden = !help.textContent;
    if (control) control.setAttribute('aria-describedby', help.id);
  };
  root.addEventListener('pointerover', e => show(e.target));
  root.addEventListener('pointerleave', () => show(null));
  root.addEventListener('focusin', e => show(e.target));
  root.addEventListener('focusout', () => show(null));
  root.addEventListener('click', e => {
    if (!(e.target instanceof Element)) return;
    const button = e.target.closest<HTMLButtonElement>('button[aria-disabled="true"]');
    if (button) { e.preventDefault(); e.stopImmediatePropagation(); show(button); }
  }, true);
  return () => { if (current?.isConnected) show(current); else show(null); };
}
