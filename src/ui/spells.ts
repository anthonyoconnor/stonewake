import { spellAllowed, availabilityReason } from '../game/availability';
import { stonehandPurchaseStatus } from '../game/recruitment';
import { actionIcon } from './icons';
import type { Sidebar } from './sidebar';
import { summonStonehandSpell, spellDefinitions, spellDescription } from '../content/spells';
import { castSpell, queueResearch, cancelResearch } from '../game/research';
import { reachable } from '../game/navigation';
import { key } from '../game/types';
import { goldTotal } from '../game/rooms';
import { dismissRally } from '../game/spell-effects';
import { actionAvailability } from './action-help';

export function showSpells(sidebar: Sidebar) {
  sidebar.panel.innerHTML = `<div id="selected-spell" class="selected-action" aria-live="polite"></div><div class="room-grid" role="group" aria-label="Spell choices">${[summonStonehandSpell,...spellDefinitions].map(s=>`<button class="room-choice spell-choice" data-spell="${s.id}" aria-label="${s.name}" title="${s.name}">${actionIcon(s.id)}<span class="spell-state" aria-hidden="true"></span></button>`).join('')}</div><article data-spell-details="summon-stonehand" hidden><details><summary>Details</summary><p>Assemble a fragile worker at the Hearth. No food, beds, wages or training.</p></details><p id="summon-stonehand-status" class="muted"></p></article>${spellDefinitions.map((s) => `<article data-spell-details="${s.id}" hidden><details><summary>Effect</summary><p>${spellDescription(s)}</p></details><p data-research-status="${s.id}" class="muted"></p><div class="lab-actions"><button data-research="${s.id}">Research</button><button data-pause-research="${s.id}">Pause</button></div></article>`).join('')}<details class="production"><summary class="icon-disclosure" title="Library research" aria-label="Library research">${actionIcon('library')}</summary><label>Research spell<select id="research-spell"><option value="">Choose a spell</option>${spellDefinitions.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select></label><p class="muted">Library floor area determines how many Runesmiths can research at once. After casting, they prepare the spell again.</p><div id="research-capacity" class="muted"></div></details><p id="active-spells" class="muted"></p>`;
  sidebar.panel.dataset.selectedSpell=spellDefinitions.some(s=>s.id===sidebar.selection.tool)?sidebar.selection.tool:summonStonehandSpell.id;
  const inspect=(id:string)=>{sidebar.panel.dataset.selectedSpell=id;sidebar.update();};
  sidebar.panel.querySelector<HTMLSelectElement>('#research-spell')!.onchange=()=>{
    if(!sidebar.panel.querySelector<HTMLSelectElement>('#research-spell')!.value)return;
    inspect(sidebar.panel.querySelector<HTMLSelectElement>('#research-spell')!.value);
    sidebar.panel.querySelector<HTMLElement>(`[data-spell-details="${sidebar.panel.dataset.selectedSpell}"]`)!.scrollIntoView({block:'nearest'});
  };
  sidebar.panel.querySelectorAll<HTMLButtonElement>('[data-spell]').forEach(b=>{
    b.onmouseenter=()=>inspect(b.dataset.spell!);
    b.onfocus=()=>inspect(b.dataset.spell!);
    b.onclick=()=>{
      sidebar.update(); // Recheck live costs and readiness before activation.
      if(b.getAttribute('aria-disabled')==='true')return;
      const id=b.dataset.spell!;
      sidebar.panel.dataset.selectedSpell=id;
      if(id===summonStonehandSpell.id){
        sidebar.selection.setTool('dig');
        sidebar.root.querySelector('#feedback')!.textContent=castSpell(sidebar.view.world,id);
      }else{
        sidebar.selection.setTool(id);
        sidebar.root.querySelector('#feedback')!.textContent='Choose a target.';
      }
      sidebar.update();
    };
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
    const quote=stonehandPurchaseStatus(w),summonSelected=sidebar.panel.dataset.selectedSpell===summonStonehandSpell.id;
    const summonChoice=sidebar.panel.querySelector<HTMLButtonElement>('[data-spell="summon-stonehand"]')!;
    summonChoice.classList.toggle('active',summonSelected);
    summonChoice.classList.toggle('spell-ready',quote.eligible);
    summonChoice.setAttribute('aria-pressed',String(summonSelected));
    summonChoice.title=`Create Stonehand · ${quote.price} gold · ${quote.eligible?'Ready':quote.message}`;
    summonChoice.setAttribute('aria-label',summonChoice.title);
    summonChoice.querySelector('.spell-state')!.textContent=quote.eligible?'◆':'◇';
    sidebar.panel.querySelector<HTMLElement>('[data-spell-details="summon-stonehand"]')!.hidden=!summonSelected;
    sidebar.panel.querySelector('#summon-stonehand-status')!.textContent=quote.eligible?'':quote.message;
    actionAvailability(summonChoice,quote.eligible,summonChoice.title);
    if(summonSelected){
      const header=sidebar.panel.querySelector<HTMLElement>('#selected-spell')!;
      const summary=actionIcon(summonStonehandSpell.id)+`<div><strong>Create Stonehand</strong><span class="room-price"><b>${quote.price}</b> ◆ / cast</span></div>`;
      if(header.dataset.summary!==summary){header.dataset.summary=summary;header.innerHTML=summary;}
    }
    for (const spell of spellDefinitions) {
      const order = w.researchOrders?.find((o) => o.spell === spell.id),
        ready = order?.state === 'ready',
        paused = order?.paused;
      const selected=sidebar.panel.dataset.selectedSpell===spell.id;
      const choice=sidebar.panel.querySelector<HTMLButtonElement>(`[data-spell="${spell.id}"]`)!;
      choice.classList.toggle('active',selected);
      choice.setAttribute('aria-pressed',String(selected));
      const usable=spellAllowed(w,spell.id) && !!ready && goldTotal(w)>=spell.cost && !w.outcome && !(spell.effect==='rally'&&w.rally) && !(spell.effect==='barrier'&&w.barrier);
      const state=w.outcome?'Area ended':!spellAllowed(w,spell.id)?availabilityReason(w,'spells',spell.id):ready?(goldTotal(w)<spell.cost?'Needs gold':(spell.effect==='rally'&&w.rally)||(spell.effect==='barrier'&&w.barrier)?'Already active':'Ready'):paused?'Paused':order?(order.unlocked?'Preparing':'Researching'):'Not researched';
      choice.title=`${spell.name} · ${spell.cost} gold · ${state}`;
      actionAvailability(choice,usable,choice.title);
      choice.querySelector('.spell-state')!.textContent=ready?'◆':paused?'Ⅱ':order?'◷':'◇';
      choice.classList.toggle('spell-ready',usable);
      sidebar.panel.querySelector<HTMLElement>(`[data-spell-details="${spell.id}"]`)!.hidden=!selected;
      if(selected){
        const header=sidebar.panel.querySelector<HTMLElement>('#selected-spell')!;
        const summary=actionIcon(spell.id)+`<div><strong>${spell.name}</strong><span class="room-price"><b>${spell.cost}</b> ◆ / cast</span></div>`;
        if(header.dataset.summary!==summary){header.dataset.summary=summary;header.innerHTML=summary;}
      }
      const duration = order?.unlocked ? spell.prepareSeconds : spell.researchSeconds;
      sidebar.panel.querySelector(`[data-research-status="${spell.id}"]`)!.textContent = ready
        ? 'Ready to cast'
        : order
          ? `${paused ? 'Paused' : order.state === 'working' ? 'In progress' : 'Queued'} · ${Math.min(100, Math.floor((order.progress / duration) * 100))}% · ${order.unlocked ? 'Preparing' : 'Researching'}`
          : `Not researched · ${duration} seconds of research`;
      const research = sidebar.panel.querySelector<HTMLButtonElement>(`[data-research="${spell.id}"]`)!;
      research.disabled = !!w.outcome || !spellAllowed(w,spell.id) || (!!order && !paused);
      research.title = availabilityReason(w,'spells',spell.id);
      const option=sidebar.panel.querySelector<HTMLOptionElement>(`#research-spell option[value="${spell.id}"]`);if(option){option.disabled=!spellAllowed(w,spell.id);option.title=availabilityReason(w,'spells',spell.id);}
      research.textContent = paused ? 'Resume' : 'Research';
      sidebar.panel.querySelector<HTMLButtonElement>(`[data-pause-research="${spell.id}"]`)!.disabled =
        !order || !!paused || ready;

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
