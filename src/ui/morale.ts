import type { Sidebar } from './sidebar';
import {
  moraleAlerts,
  moraleStatus,
  moraleSummary,
  dismissMoraleAlert,
  type MoraleCause,
} from '../game/morale';
import type { Resident, World } from '../game/types';

const seen = new WeakMap<World, Set<string>>();
export const residentMoraleText = (w: World, a: Resident) => moraleStatus(w, a).message;

export function mountMoraleAlerts(sidebar: Sidebar) {
  const alert = document.createElement('details');
  alert.id = 'morale-alerts';
  alert.className = 'threat-reports';
  alert.hidden = true;
  alert.innerHTML = '<summary>Resident needs</summary><div id="morale-alert-text" role="status"></div>';
  sidebar.root.querySelector('footer')!.before(alert);
}
export function mountMoralePanel(sidebar: Sidebar) {
  const section = document.createElement('section');
  section.className = 'spell-card';
  section.innerHTML =
    '<h3>Resident wellbeing</h3><p id="morale-summary" class="muted"></p><button id="reopen-morale" class="wide">Show dismissed need warnings</button>';
  section.querySelector<HTMLButtonElement>('button')!.onclick = () => {
    sidebar.view.world.moraleDismissed = {};
    sidebar.root.querySelector<HTMLDetailsElement>('#morale-alerts')!.open = true;
    sidebar.update();
  };
  (sidebar.panel.querySelector('#population-management') ?? sidebar.panel).prepend(section);
}
export function updateMorale(sidebar: Sidebar) {
  const w = sidebar.view.world,
    alerts = moraleAlerts(w);
  const box = sidebar.root.querySelector<HTMLDetailsElement>('#morale-alerts')!;
  box.hidden = !alerts.length;
  if (!seen.has(w)) seen.set(w, new Set());
  for (const alert of alerts) {
    const id = `${alert.id}:${alert.severity}`;
    if (!seen.get(w)!.has(id)) {
      box.open = true;
      seen.get(w)!.add(id);
    }
  }
  const body = box.querySelector<HTMLElement>('#morale-alert-text')!;
  const signature = JSON.stringify(alerts);
  if (body.dataset.alerts !== signature) {
    body.dataset.alerts = signature;
    body.replaceChildren();
    for (const alert of alerts) {
      const row = document.createElement('div');
      row.dataset.moraleCause = alert.id;
      const message = document.createElement('p');
      message.textContent = `${alert.title}${alert.severity === 'leaving' ? ' · Leaving' : ' · Unhappy'} · ${alert.count} resident${alert.count === 1 ? '' : 's'}. ${alert.message}`;
      const dismiss = document.createElement('button');
      dismiss.dataset.dismissMorale = alert.id;
      dismiss.textContent = 'Dismiss';
      dismiss.setAttribute('aria-label', `Dismiss ${alert.title}`);
      dismiss.onclick = () => {
        dismissMoraleAlert(w, alert.id as MoraleCause);
        sidebar.update();
      };
      row.append(message, dismiss);
      body.append(row);
    }
  }
  const summary = sidebar.panel.querySelector('#morale-summary');
  if (summary) {
    const s = moraleSummary(w);
    summary.textContent = `${s.content} content · ${s.unhappy} unhappy · ${s.recovering} recovering · ${s.leaving} leaving${s.blocked ? ` (${s.blocked} blocked)` : ''}. ${s.departed} recent departures.`;
  }
  const reopen = sidebar.panel.querySelector<HTMLButtonElement>('#reopen-morale');
  if (reopen) reopen.disabled = !Object.keys(w.moraleDismissed ?? {}).length;
}
