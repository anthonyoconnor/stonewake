import type { Sidebar } from './sidebar';
import { moraleStatus, moraleSummary } from '../game/morale';
import { hasDismissedNotifications, reopenNotifications } from '../game/notifications';
import type { Resident, World } from '../game/types';

export const residentMoraleText = (w: World, a: Resident) => moraleStatus(w, a).message;
export function mountMoralePanel(sidebar: Sidebar) {
  const section = document.createElement('section');
  section.className = 'spell-card';
  section.innerHTML = '<h3>Resident wellbeing</h3><p id="morale-summary" class="muted"></p><button id="reopen-morale" class="wide">Show dismissed need warnings</button>';
  section.querySelector<HTMLButtonElement>('button')!.onclick = () => {
    sidebar.view.world.moraleDismissed = {};
    reopenNotifications(sidebar.view.world, 'Need');
    sidebar.update();
  };
  (sidebar.panel.querySelector('#population-management') ?? sidebar.panel).prepend(section);
}
export function updateMorale(sidebar: Sidebar) {
  const w = sidebar.view.world;
  const summary = sidebar.panel.querySelector('#morale-summary');
  if (summary) {
    const s = moraleSummary(w);
    summary.textContent = `${s.content} content · ${s.unhappy} unhappy · ${s.recovering} recovering · ${s.leaving} leaving${s.blocked ? ` (${s.blocked} blocked)` : ''}. ${s.departed} recent departures.`;
  }
  const reopen = sidebar.panel.querySelector<HTMLButtonElement>('#reopen-morale');
  if (reopen) reopen.disabled = !hasDismissedNotifications(w, 'Need');
}
