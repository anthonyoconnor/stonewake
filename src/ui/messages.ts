import type { Sidebar } from './sidebar';
import type { World } from '../game/types';
import { encounterSummary } from '../game/encounters';
import { moraleAlerts } from '../game/morale';

type Report = { id: string; kind: string; message: string };
const histories = new WeakMap<World, Map<string, Report>>();

/** One bounded card above the footer; warnings retain their simulation-owned dismissal rules. */
export class MessageCenter {
  private dock = document.createElement('div');
  private cards = document.createElement('section');
  private hearthEpisodes = new WeakMap<World, boolean>();
  private endedWorlds = new WeakSet<World>();
  constructor(private sidebar: Sidebar) {
    this.dock.className = 'message-dock';
    this.dock.setAttribute('aria-label', 'Stronghold messages');
    this.cards.id = 'sidebar-messages';
    const hearth = document.createElement('details');
    hearth.id = 'hearth-alerts'; hearth.className = 'threat-reports'; hearth.hidden = true;
    hearth.innerHTML = '<summary>Hearth under attack</summary><div><p id="hearth-alert-text" role="status"></p><button class="wide" id="locate-attacked-hearth">Locate Hearthstone</button></div>';
    hearth.querySelector<HTMLButtonElement>('button')!.onclick = () => sidebar.controls.home();
    sidebar.root.append(hearth);
    for (const [id, label, icon] of [['hearth-alerts', 'Hearth under attack', '◇'], ['encounter-alerts', 'Threat reports', '⚔'], ['morale-alerts', 'Resident needs', '♟']]) {
      const card = sidebar.root.querySelector<HTMLDetailsElement>(`#${id}`)!;
      const button = document.createElement('button');
      button.dataset.message = id; button.title = label; button.setAttribute('aria-label', label);
      button.setAttribute('aria-controls', id); button.textContent = icon;
      button.onclick = () => { card.open = !card.open; this.syncCards(card); };
      this.dock.append(button); this.cards.append(card);
      const close = document.createElement('button');
      close.className = 'close-message'; close.textContent = '×'; close.title = `Dismiss ${label.toLowerCase()} card`;
      close.setAttribute('aria-label', close.title);
      close.onclick = () => { card.open = false; this.syncCards(card); };
      card.append(close);
      card.addEventListener('toggle', () => this.syncCards(card));
    }
    sidebar.root.querySelector('footer')!.before(this.dock, this.cards);
  }
  private syncCards(changed?: HTMLDetailsElement) {
    const cards = this.cards.querySelectorAll<HTMLDetailsElement>('details');
    if (changed?.open) cards.forEach(c => { if (c !== changed) c.open = false; });
    cards.forEach(c => {
      const button = this.dock.querySelector<HTMLButtonElement>(`[data-message="${c.id}"]`)!;
      button.hidden = c.hidden;
      button.setAttribute('aria-expanded', String(c.open && !c.hidden));
      button.classList.toggle('active', c.open && !c.hidden);
    });
    this.dock.hidden = Array.from(cards).every(c => c.hidden);
  }
  update() {
    const w = this.sidebar.view.world;
    if(w.outcome&&!this.endedWorlds.has(w)){
      this.cards.querySelectorAll<HTMLDetailsElement>('details').forEach(card=>card.open=false);
      this.endedWorlds.add(w);
    }
    const anchor=this.sidebar.root.querySelector<HTMLElement>(w.outcome?'#level-outcome':'.camera-tools')!;
    this.cards.style.bottom=`${this.sidebar.root.getBoundingClientRect().bottom-anchor.getBoundingClientRect().top+6}px`;
    if (!histories.has(w)) histories.set(w, new Map());
    const history = histories.get(w)!;
    const attacked = !w.outcome && w.hearthState?.hitAt !== undefined && w.elapsed - w.hearthState.hitAt < 15;
    const hearth = this.cards.querySelector<HTMLDetailsElement>('#hearth-alerts')!;
    hearth.hidden = !attacked;
    if (attacked) {
      const message = `The Stone Hearth is under attack. ${Math.ceil(w.hearthState!.health)} / ${w.hearthState!.maxHealth} health. Defend it to keep the passage alive.`;
      const text=hearth.querySelector('#hearth-alert-text')!;
      if(text.textContent!==message)text.textContent=message;
      history.set('hearth-attack', { id: 'hearth-attack', kind: 'Hearth', message });
      if (!this.hearthEpisodes.get(w)) { hearth.open = true; this.syncCards(hearth); }
    }
    this.hearthEpisodes.set(w, attacked);
    this.syncCards();
    for (const report of encounterSummary(w)) {
      const id = `threat:${report.id}:${report.phase}:${report.waves}`;
      history.set(id, { id, kind: 'Threat', message: `${report.name} · ${report.status}` });
    }
    for (const report of moraleAlerts(w)) {
      const id = `need:${report.id}:${report.severity}`;
      history.set(id, { id, kind: 'Need', message: `${report.title} · ${report.count} residents. ${report.message}` });
    }
    while (history.size > 40) history.delete(history.keys().next().value!);
    const list = this.sidebar.panel.querySelector('#message-history');
    if (list) {
      const reports = Array.from(history.values()).reverse();
      const signature = JSON.stringify(reports);
      if ((list as HTMLElement).dataset.reports !== signature) {
        (list as HTMLElement).dataset.reports = signature;
        list.replaceChildren();
        if (!reports.length) list.textContent = 'No reports in this area yet.';
        for (const report of reports) {
          const item = document.createElement('p'); item.textContent = `${report.kind} · ${report.message}`; list.append(item);
        }
      }
    }
  }
  mountHistory(panel: HTMLElement) {
    const section = document.createElement('details'); section.className = 'production'; section.open = true;
    section.innerHTML = '<summary>Message history</summary><div id="message-history"></div>';
    panel.append(section);
    const objective = document.createElement('button'); objective.className = 'wide'; objective.textContent = 'View Hearth objective';
    objective.onclick = () => this.sidebar.show('hearth'); panel.prepend(objective);
  }
}
