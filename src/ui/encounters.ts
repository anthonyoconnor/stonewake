import type { Sidebar } from './sidebar';
import { encounterSummary, advanceEncounter } from '../game/encounters';

export function mountEncounterPanel(sidebar: Sidebar, debug = false) {
  const section = document.createElement('section');
  section.className = 'spell-card';
  section.innerHTML = `<h3>${debug ? 'Encounter diagnostics' : 'Known threats'}</h3><div id="${debug ? 'encounter-debug' : 'encounter-status'}" class="muted"></div>`;
  if (debug) {
    const help = document.createElement('p');
    help.className = 'muted';
    help.textContent = 'Debug lists authored sources, including hidden ones. Advancing a timer still requires discovery, warning time and a physical route.';
    section.append(help);
    const advance = document.createElement('button');
    advance.id = 'advance-encounter'; advance.className = 'wide'; advance.textContent = 'Advance encounter timers';
    advance.onclick = () => {
      sidebar.root.querySelector('#feedback')!.textContent = advanceEncounter(sidebar.view.world);
      sidebar.update();
    };
    section.append(advance);
  }
  sidebar.panel.append(section);
}

export function updateEncounters(sidebar: Sidebar) {
  const w = sidebar.view.world, reports = encounterSummary(w);
  const render = (element: Element, rows: ReturnType<typeof encounterSummary>) => {
    const signature = JSON.stringify(rows);
    if ((element as HTMLElement).dataset.reports === signature) return;
    (element as HTMLElement).dataset.reports = signature;
    element.replaceChildren();
    if (!rows.length) { element.textContent = 'No known hostile sources.'; return; }
    for (const row of rows) {
      const p = document.createElement('p');
      p.textContent = `${row.name} · ${row.status}${row.visibleEnemies ? ` ${row.visibleEnemies} visible enemies.` : ''}`;
      element.append(p);
    }
  };
  const panel = sidebar.panel.querySelector('#encounter-status'); if (panel) render(panel, reports);
  const debug = sidebar.panel.querySelector('#encounter-debug'); if (debug) render(debug, encounterSummary(w, true));
}
