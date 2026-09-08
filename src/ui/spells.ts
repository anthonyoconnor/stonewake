import { actionIcon } from './icons';
import type { Sidebar } from './sidebar';
import { spellDefinitions, spellDescription } from '../content/spells';
import { queueResearch, cancelResearch } from '../game/research';
import { reachable } from '../game/navigation';
import { key } from '../game/types';
import { goldTotal } from '../game/rooms';
import { dismissRally } from '../game/spell-effects';

export function showSpells(sidebar: Sidebar) {
  sidebar.panel.innerHTML = `<div id="selected-spell" class="selected-action" aria-live="polite"></div><div class="room-grid" role="group" aria-label="Spell choices">${spellDefinitions.map(s=>`<button class="room-choice spell-choice" data-spell="${s.id}" aria-label="${s.name}" title="${s.name}">${actionIcon(s.id)}<span class="spell-state" aria-hidden="true"></span></button>`).join('')}</div>${spellDefinitions.map((s) => `<article data-spell-details="${s.id}" hidden><p>${spellDescription(s)}</p><p data-research-status="${s.id}" class="muted"></p><div class="lab-actions"><button data-research="${s.id}">Research</button><button data-pause-research="${s.id}">Pause</button></div><button class="wide" data-cast="${s.id}">Cast · ${s.cost} gold</button></article>`).join('')}<details class="production"><summary>Library research</summary><p class="muted">Library floor area determines how many Runesmiths can research at once. After casting, they prepare the spell again.</p><div id="research-capacity" class="muted"></div></details><p id="active-spells" class="muted"></p>`;
  sidebar.panel.dataset.selectedSpell=spellDefinitions.some(s=>s.id===sidebar.selection.tool)?sidebar.selection.tool:spellDefinitions[0].id;
  sidebar.panel.querySelectorAll<HTMLButtonElement>('[data-spell]').forEach(b=>b.onclick=()=>{
    if(spellDefinitions.some(s=>s.id===sidebar.selection.tool))sidebar.selection.setTool('dig');
    sidebar.panel.dataset.selectedSpell=b.dataset.spell;
    sidebar.update();
  });
  sidebar.panel.querySelectorAll<HTMLButtonElement>('[data-research]').forEach(
    (b) =>
      (b.onclick = () => {
        queueResearch(sidebar.view.world, b.dataset.research!);
        sidebar.update();
      }),
  );
  sidebar.panel.querySelectorAll<HTMLButtonElement>('[data-pause-research]').forEach(
    (b) =>
      (b.onclick = () => {
        cancelResearch(sidebar.view.world, b.dataset.pauseResearch!);
        sidebar.update();
      }),
  );
  sidebar.panel.querySelectorAll<HTMLButtonElement>('[data-cast]').forEach(
    (b) =>
      (b.onclick = () => {
        sidebar.selection.setTool(b.dataset.cast!);
        sidebar.root.querySelector('#feedback')!.textContent =
          'Choose a visible target. Right-click or Escape cancels.';
        sidebar.update();
      }),
  );
}
export function updateSpells(sidebar: Sidebar) {
  const w = sidebar.view.world;
  const researchCapacity = sidebar.panel.querySelector('#research-capacity');
  if (researchCapacity) {
    const workers = w.agents.filter((a) => a.capabilities.includes('research'));
    const start = w.agents[0] ?? w.tiles.find((t) => t.claimed && !t.core && t.terrain === 'floor');
    const routes = (workers.length ? workers : start ? [start] : []).map((a) => reachable(w, a));
    const capacity = w.roomServices
      .filter((f) => f.service === 'research' && routes.some((r) => r.has(key(f.access))))
      .reduce((sum, f) => sum + f.capacity, 0);
    researchCapacity.textContent = `${workers.length} capable researcher${workers.length === 1 ? '' : 's'} · Capacity for ${capacity} researcher${capacity === 1 ? '' : 's'}${workers.length ? '' : '. Build a Library and provide spare accommodation and food support to attract a Runesmith.'}`;
    for (const spell of spellDefinitions) {
      const order = w.researchOrders?.find((o) => o.spell === spell.id),
        ready = order?.state === 'ready',
        paused = order?.paused;
      const selected=sidebar.panel.dataset.selectedSpell===spell.id;
      const choice=sidebar.panel.querySelector<HTMLButtonElement>(`[data-spell="${spell.id}"]`)!;
      choice.classList.toggle('active',selected);
      choice.setAttribute('aria-pressed',String(selected));
      const state=ready?'Ready':paused?'Paused':order?(order.unlocked?'Preparing':'Researching'):'Not researched';
      choice.title=`${spell.name} · ${state}`;
      choice.setAttribute('aria-label',choice.title);
      choice.querySelector('.spell-state')!.textContent=ready?'◆':paused?'Ⅱ':order?'◷':'◇';
      choice.classList.toggle('spell-ready',!!ready);
      sidebar.panel.querySelector<HTMLElement>(`[data-spell-details="${spell.id}"]`)!.hidden=!selected;
      if(selected){
        const header=sidebar.panel.querySelector<HTMLElement>('#selected-spell')!;
        const summary=actionIcon(spell.id)+`<div><strong>${spell.name}</strong><span class="room-price"><b>${spell.cost}</b> gold / cast</span></div>`;
        if(header.dataset.summary!==summary){header.dataset.summary=summary;header.innerHTML=summary;}
      }
      const duration = order?.unlocked ? spell.prepareSeconds : spell.researchSeconds;
      sidebar.panel.querySelector(`[data-research-status="${spell.id}"]`)!.textContent = ready
        ? 'Ready to cast'
        : order
          ? `${paused ? 'Paused' : order.state === 'working' ? 'In progress' : 'Queued'} · ${Math.min(100, Math.floor((order.progress / duration) * 100))}% · ${order.unlocked ? 'Preparing' : 'Researching'}`
          : `Not researched · ${duration} seconds of research`;
      const research = sidebar.panel.querySelector<HTMLButtonElement>(`[data-research="${spell.id}"]`)!;
      research.disabled = !!order && !paused;
      research.textContent = paused ? 'Resume' : 'Research';
      sidebar.panel.querySelector<HTMLButtonElement>(`[data-pause-research="${spell.id}"]`)!.disabled =
        !order || !!paused || ready;
      const cast = sidebar.panel.querySelector<HTMLButtonElement>(`[data-cast="${spell.id}"]`)!;
      cast.disabled = !ready || goldTotal(w) < spell.cost;
      cast.textContent = `Cast · ${spell.cost} gold${ready && goldTotal(w) < spell.cost ? ' · Needs gold' : ''}`;
    }
    sidebar.panel.querySelector('#active-spells')!.textContent = [
      w.rally
        ? `Call to Arms · ${Math.ceil(w.rally.until - w.elapsed)} seconds · ${w.agents.filter((a) => a.rallying && !a.rallyUnreachable).length} responding · ${w.agents.filter((a) => a.rallyUnreachable).length} unreachable`
        : '',
      w.barrier
        ? `Barrier · ${Math.ceil(w.barrier.health)} / ${w.barrier.maxHealth} health · ${Math.ceil(w.barrier.until - w.elapsed)} seconds`
        : '',
    ]
      .filter(Boolean)
      .join(' · ');
    let dismiss = sidebar.panel.querySelector<HTMLButtonElement>('#dismiss-rally');
    if (!dismiss) {
      dismiss = document.createElement('button');
      dismiss.id = 'dismiss-rally';
      dismiss.className = 'wide';
      dismiss.textContent = 'Dismiss Call to Arms';
      dismiss.onclick = () => {
        dismissRally(sidebar.view.world);
        sidebar.update();
      };
      sidebar.panel.append(dismiss);
    }
    dismiss.hidden = !w.rally;
  }
}
