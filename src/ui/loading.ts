/** Yield a browser paint before/after synchronous world construction. No artificial delay. */
export const paintedFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

export class LoadingScreen {
  element = document.querySelector<HTMLDialogElement>('#loading-screen')!;
  busy = false;
  stage(text: string) { this.element.querySelector('#loading-status')!.textContent = text; }
  async run(title: string, work: () => Promise<void>, allowRetry = true) {
    if (this.busy) return;
    this.busy = true;
    // The HTML shell is initially non-modal so it can paint before any JavaScript.
    if (this.element.open) this.element.close();
    this.element.showModal();
    this.element.oncancel = e => e.preventDefault();
    const app = document.querySelector<HTMLElement>('#app')!;
    app.inert = true;
    const retry = this.element.querySelector<HTMLButtonElement>('#loading-retry')!;
    const reload = this.element.querySelector<HTMLButtonElement>('#loading-reload')!;
    return new Promise<void>(resolve => {
      const attempt = async () => {
        retry.hidden = true; reload.hidden = true;
        this.element.dataset.phase = 'loading'; this.stage(title);
        try {
          await paintedFrame();
          await work();
          await paintedFrame();
          this.element.close(); app.inert = false; this.busy = false; resolve();
        } catch (error) {
          this.element.dataset.phase = 'error';
          this.stage(`Could not finish loading. ${error instanceof Error ? error.message : String(error)}`);
          retry.hidden = !allowRetry; reload.hidden = false; (allowRetry ? retry : reload).focus();
        }
      };
      retry.onclick = () => void attempt();
      void attempt();
    });
  }
}
