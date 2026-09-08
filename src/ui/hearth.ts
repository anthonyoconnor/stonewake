import type { Sidebar } from './sidebar';
import { hearthSummary, requestHearthActivation } from '../game/hearth';

export function mountHearth(sidebar: Sidebar) {
  const button = document.createElement('button');
  button.id = 'open-hearth';
  button.className = 'hearth-link';
  button.onclick = () => sidebar.show('hearth');
  sidebar.root.querySelector('.reserves')!.after(button);
  const terminal = document.createElement('section');
  terminal.id = 'level-outcome';
  terminal.className = 'level-outcome';
  terminal.hidden = true;
  terminal.innerHTML =
    '<strong id="outcome-title"></strong><p id="outcome-message"></p><button id="restart-area" class="wide">Restart area</button>';
  terminal.querySelector<HTMLButtonElement>('button')!.onclick = () => sidebar.onRestartArea();
  sidebar.root.querySelector('.camera-tools')!.before(terminal);
}

export function showHearth(sidebar: Sidebar) {
  sidebar.panel.innerHTML =
    '<p class="eyebrow">THE ANCIENT NETWORK</p><h2>Keep the Hearth alight.</h2><h3>Starting Stone Hearth</h3><p id="core-health"></p><p class="muted">Defend the heart of your stronghold. Its destruction ends this area.</p><h3>Onward Hearthstone</h3><p id="onward-status" role="status"></p><button id="activate-hearth" class="wide">Activate onward Hearthstone</button><p class="muted">Find the lost stone and secure its approach. A dwarf must stand beside it without interruption to awaken the passage.</p>';
  sidebar.panel.querySelector<HTMLButtonElement>('#activate-hearth')!.onclick = () => {
    sidebar.root.querySelector('#feedback')!.textContent = requestHearthActivation(sidebar.view.world);
    sidebar.update();
  };
}

export function updateHearth(sidebar: Sidebar) {
  const w = sidebar.view.world,
    s = hearthSummary(w);
  sidebar.root.querySelector('#open-hearth')!.textContent =
    `◇ Hearth ${s.maxHealth ? Math.ceil(s.health) + ' / ' + s.maxHealth : '· Test world'} · ${w.outcome === 'defeat' ? 'Lost' : s.ready ? 'Area complete' : s.discovered ? 'Onward stone found' : 'Find the onward stone'}`;
  const health = sidebar.panel.querySelector('#core-health');
  if (health)
    health.textContent = `${Math.ceil(s.health)} / ${s.maxHealth} health${w.outcome === 'defeat' ? ' · Destroyed' : ''}`;
  const onward = sidebar.panel.querySelector('#onward-status');
  if (onward)
    onward.textContent = s.ready
      ? 'The onward Hearthstone is ready. This area is complete.'
      : `${s.name} · ${s.status}`;
  const activate = sidebar.panel.querySelector<HTMLButtonElement>('#activate-hearth');
  if (activate) {
    activate.disabled = !s.canRequest;
    activate.textContent = s.requested ? 'Activation requested' : 'Activate onward Hearthstone';
  }
  const terminal = sidebar.root.querySelector<HTMLElement>('#level-outcome')!;
  terminal.hidden = !w.outcome;
  if (w.outcome) {
    terminal.dataset.outcome = w.outcome;
    terminal.querySelector('#outcome-title')!.textContent =
      w.outcome === 'defeat' ? 'The Hearth has fallen' : 'The onward Hearthstone is ready';
    terminal.querySelector('#outcome-message')!.textContent =
      w.outcome === 'defeat'
        ? 'Your stronghold is lost. Restart this area to try again.'
        : 'This area is complete. The ancient network has awakened.';
    if (sidebar.selection.tool !== 'inspect') sidebar.selection.setTool('inspect');
  }
  sidebar.root.querySelector('footer span')!.textContent =
    w.outcome === 'defeat'
      ? 'THE HEARTH HAS FALLEN'
      : s.ready
        ? 'THE PASSAGE IS READY'
        : 'THE HEARTH IS ALIGHT';
}
