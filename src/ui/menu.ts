import { playableLevels } from '../content/playable-levels';
import { presentation } from '../content/presentation';
import './menu.css';

export class MainMenu {
  element = document.createElement('dialog');
  selected = playableLevels[0].id;
  busy = false;
  onStart: (mode: 'campaign' | 'free-play', id?: string) => Promise<void> = async () => {};
  constructor() {
    this.element.id = 'main-menu'; this.element.setAttribute('aria-label', 'Stonewake main menu');
    document.body.append(this.element);
    this.element.addEventListener('cancel', e => { e.preventDefault(); if (!this.busy && this.element.dataset.screen !== 'main') this.show(); });
    this.element.addEventListener('keydown', e => e.stopPropagation());
  }
  get open() { return this.element.open; }
  close() { this.element.close(); }
  show(screen: 'main' | 'free' | 'settings' = 'main') {
    this.element.dataset.screen = screen;
    if (!this.open) this.element.showModal();
    if (screen === 'main') {
      this.element.innerHTML = `<div class="menu-home"><div class="menu-title"><p>RECLAIM THE DEEP</p><h1>Stonewake</h1><div class="rune-rule" aria-hidden="true">◇</div></div>
        <nav aria-label="Start playing"><button class="stone-button primary" id="start-campaign"><span aria-hidden="true">♧</span>Campaign</button><button class="stone-button" id="free-play"><span aria-hidden="true">⚑</span>Free Play</button></nav>
        <button class="stone-button secondary" id="menu-settings"><span aria-hidden="true">⚙</span>Settings</button><small class="menu-footnote">A journey beneath the mountain</small></div>`;
      this.button('#start-campaign', () => this.start('campaign'));
      this.button('#free-play', () => this.show('free'));
      this.button('#menu-settings', () => this.show('settings'));
    } else if (screen === 'free') {
      this.element.innerHTML = `<div class="free-shell"><header class="free-heading"><span aria-hidden="true">◇</span><div><h1>Free Play</h1><p>Choose a level.</p></div></header>
        <div class="level-list" role="group" aria-label="Playable levels">${playableLevels.map(l => `<button class="level-choice" data-level="${l.id}" aria-pressed="${this.selected === l.id}"><img src="${l.image}" alt="" loading="lazy"><span>${l.name}</span><b class="selected-rune" aria-hidden="true">♢</b></button>`).join('')}</div>
        <article class="level-preview" aria-label="Selected level"><img id="level-art" alt=""><div class="preview-caption"><p id="level-region"></p><h2 id="level-title"></h2><p id="level-description"></p><small>Fresh settlement · Normal economy · All current room plans</small></div></article>
        <footer class="free-actions"><button class="stone-button secondary" id="menu-back">‹ &nbsp; Back</button><button class="stone-button primary" id="start-level">Start level &nbsp; ›</button></footer></div>`;
      this.element.querySelectorAll<HTMLButtonElement>('[data-level]').forEach(b => b.onclick = () => { this.selected = b.dataset.level!; this.updatePreview(); });
      this.button('#menu-back', () => this.show()); this.button('#start-level', () => this.start('free-play', this.selected));
      this.updatePreview();
    } else {
      this.element.innerHTML = `<section class="menu-settings stone-panel"><h1>Settings</h1><p>Preferences last for this session.</p><label>Animation<select id="motion"><option value="system">Follow system preference</option><option value="reduce">Reduced motion</option><option value="full">Full animation</option></select></label><label class="toggle"><input id="edge-scrolling" type="checkbox" ${presentation.edgeScrolling ? 'checked' : ''}> Scroll at screen edges</label><p class="muted">WASD and camera controls remain available.</p><button class="stone-button secondary" id="menu-back">‹ &nbsp; Back</button></section>`;
      const motion = this.element.querySelector<HTMLSelectElement>('#motion')!; motion.value = presentation.motion;
      motion.onchange = () => { presentation.motion = motion.value as typeof presentation.motion; document.documentElement.dataset.motion = motion.value; };
      this.element.querySelector<HTMLInputElement>('#edge-scrolling')!.onchange = e => presentation.edgeScrolling = (e.target as HTMLInputElement).checked;
      this.button('#menu-back', () => this.show());
    }
    this.element.querySelector<HTMLButtonElement>('button')?.focus();
  }
  private button(selector: string, action: () => void) { this.element.querySelector<HTMLButtonElement>(selector)!.onclick = action; }
  private updatePreview() {
    const level = playableLevels.find(l => l.id === this.selected)!;
    this.element.querySelectorAll<HTMLButtonElement>('[data-level]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.level === this.selected)));
    this.element.querySelector<HTMLImageElement>('#level-art')!.src = level.image;
    this.element.querySelector('#level-title')!.textContent = level.name;
    this.element.querySelector('#level-region')!.textContent = level.region;
    this.element.querySelector('#level-description')!.textContent = level.description;
  }
  private async start(mode: 'campaign' | 'free-play', id?: string) {
    if (this.busy) return;
    this.busy = true; this.element.querySelectorAll('button').forEach(b => b.disabled = true);
    try { await this.onStart(mode, id); this.close(); }
    catch (error) {
      const p = document.createElement('p'); p.className = 'menu-error'; p.setAttribute('role', 'alert'); p.textContent = `Could not start the level. ${error instanceof Error ? error.message : String(error)} Please try again.`;
      this.element.append(p);
    } finally { this.busy = false; this.element.querySelectorAll('button').forEach(b => b.disabled = false); }
  }
}

export function confirmDiscard(action: string): Promise<boolean> {
  const dialog = document.createElement('dialog'); dialog.className = 'discard-dialog stone-panel'; dialog.setAttribute('aria-labelledby', 'discard-title');
  dialog.innerHTML = `<h2 id="discard-title">${action}?</h2><p>This discards your current run. Nothing is saved.</p><div><button id="keep-playing" class="stone-button">Keep playing</button><button id="discard-run" class="stone-button primary">${action}</button></div>`;
  document.body.append(dialog); dialog.showModal(); dialog.querySelector<HTMLButtonElement>('#keep-playing')!.focus();
  return new Promise(resolve => {
    const finish = (value: boolean) => { dialog.close(); dialog.remove(); resolve(value); };
    dialog.querySelector('#keep-playing')!.addEventListener('click', () => finish(false));
    dialog.querySelector('#discard-run')!.addEventListener('click', () => finish(true));
    dialog.addEventListener('cancel', e => { e.preventDefault(); finish(false); });
  });
}
