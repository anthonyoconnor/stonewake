import type {Sidebar} from './sidebar';
import {defenseDefinitions,defenseById,defenseDirections} from '../content/defenses';
import {recipeById} from '../content/recipes';
import {defenseAt,isDoor,doorIsOpen,doorOccupied} from '../game/doors';
import {setDoorMode,removeDefense,addRaider} from '../game/defenses';
import {addResidents} from '../game/simulation';
import {type DoorMode,tileAt} from '../game/types';
import {actionIcon} from './icons';
const feedback=(s:Sidebar,message:string)=>{s.root.querySelector('#feedback')!.textContent=message;};
export function showDefenses(s:Sidebar){
  s.panel.innerHTML=`<div id="defense-inspector"></div><details id="build-defenses" open><summary>Build defenses</summary><div id="selected-defense" class="selected-action" aria-live="polite"></div><div class="room-grid" role="group" aria-label="Defense choices">${defenseDefinitions.map(d=>`<button data-defense="${d.id}" class="room-choice" aria-label="${d.name}" title="${d.name}">${actionIcon(d.id)}</button>`).join('')}</div><p id="defense-description" class="muted"></p><p class="muted">Manufacture in the Workshop, then place from stock on clear claimed floor. Doors fit one-square passages between walls.</p><div id="bolt-facing-controls"><label>Bolt facing<select id="defense-facing">${defenseDirections.map((d,i)=>`<option value="${i}" ${i===s.selection.rotation?'selected':''}>${d.name}</option>`).join('')}</select></label><p class="muted">R rotates a bolt before placement.</p></div><button id="inspect-defense" class="wide">Inspect placed defense</button></details><details><summary>Placed defenses</summary><div id="placed-defenses"></div></details>`;
  s.panel.querySelectorAll<HTMLButtonElement>('[data-defense]').forEach(b=>b.onclick=()=>{s.selection.selected=undefined;s.selection.setTool(b.dataset.defense!);updateDefenses(s);});
  s.panel.querySelector<HTMLSelectElement>('#defense-facing')!.onchange=e=>{s.selection.rotation=Number((e.target as HTMLSelectElement).value);s.selection.draw();};
  s.panel.querySelector<HTMLButtonElement>('#inspect-defense')!.onclick=()=>s.selection.setTool('inspect');
  if(s.view.world.defenseTest){
    const test=document.createElement('section');test.className='spell-card';test.innerHTML='<h3>Test yard</h3><p class="muted">Test stock is supplied. Raiders follow the corridor and break shut doors. This test does not include dwarf combat or Hearth damage.</p><div class="lab-actions"><button id="send-raider">Send test raider</button><button id="send-hauler">Send dwarf for gold</button></div><div id="test-enemies"></div><button id="reset-defense-yard" class="wide">Reset defense yard</button>';s.panel.append(test);
    test.querySelector<HTMLButtonElement>('#send-raider')!.onclick=()=>{const w=s.view.world;addRaider(w,w.defenseTest!.spawn,w.defenseTest!.target);updateDefenses(s);};
    test.querySelector<HTMLButtonElement>('#send-hauler')!.onclick=()=>{const w=s.view.world;if(!w.agents.some(a=>a.type==='miner'))addResidents(w,'miner');tileAt(w,27,12)!.loose+=20;w.revision++;feedback(s,'Gold placed beyond the door. An available Miner will collect it if a route is open.');};
    test.querySelector<HTMLButtonElement>('#reset-defense-yard')!.onclick=()=>s.onLab(true,'defenses');
  }
  updateDefenses(s);
}
export function updateDefenses(s:Sidebar){
  const inspector=s.panel.querySelector<HTMLElement>('#defense-inspector');if(!inspector)return;
  const w=s.view.world;
  for(const def of defenseDefinitions){
    const button=s.panel.querySelector(`[data-defense="${def.id}"]`)!;button.classList.toggle('active',s.selection.tool===def.id);button.setAttribute('aria-pressed',String(s.selection.tool===def.id));button.setAttribute('title',`${def.name} · ${w.outputs[def.id]??0} in stock`);
  }
  const selectedDef=defenseById(s.selection.tool);
  const header=s.panel.querySelector<HTMLElement>('#selected-defense')!;
  const recipe=selectedDef&&recipeById(selectedDef.id)!;
  const summary=selectedDef? actionIcon(selectedDef.id)+`<div><strong>${selectedDef.name}</strong><span class="room-price"><b>${w.outputs[selectedDef.id]??0}</b> in stock</span><span class="room-price">${recipe!.cost} gold · ${recipe!.seconds}s work</span></div>`:actionIcon('bolt-trap')+'<div><strong>Build defenses</strong><span class="room-price">Choose a door or trap</span></div>';
  if(header.dataset.summary!==summary){header.dataset.summary=summary;header.innerHTML=summary;}
  s.panel.querySelector<HTMLElement>('#bolt-facing-controls')!.hidden=selectedDef?.kind!=='bolt';
  s.panel.querySelector('#defense-description')!.textContent=selectedDef?selectedDef.description+(selectedDef.health?` ${selectedDef.health} health.`:` ${selectedDef.damage} damage.`)+(selectedDef.cooldown?` Cooldown: ${selectedDef.cooldown}s.`:'')+(selectedDef.pinSeconds?` Pins for ${selectedDef.pinSeconds}s.`:''):'';
  s.panel.querySelector<HTMLSelectElement>('#defense-facing')!.value=String(s.selection.rotation);
  const d=s.selection.selected&&defenseAt(w,s.selection.selected),def=d&&defenseById(d.type);
  if(inspector.dataset.id!==String(d?.id)){
    inspector.dataset.id=String(d?.id);if(d){s.panel.querySelector<HTMLDetailsElement>('#build-defenses')!.open=false;s.panel.scrollTop=0;}
    inspector.innerHTML=d?`<article class="spell-card"><h3>${def!.name}</h3><p id="fixture-status" class="muted"></p>${isDoor(d)?'<div class="door-modes" role="group" aria-label="Door state">'+(['open','closed','locked'] as const).map(mode=>`<button data-door-mode="${mode}">${mode[0].toUpperCase()+mode.slice(1)}</button>`).join('')+'</div><p class="muted">Open: everyone passes.<br>Closed: dwarfs open it and it closes behind them.<br>Locked: dwarfs cannot open it.</p>':''}<button id="dismantle-defense" class="wide">Dismantle · no refund</button></article>`:'';
    inspector.querySelectorAll<HTMLButtonElement>('[data-door-mode]').forEach(b=>b.onclick=()=>{feedback(s,setDoorMode(w,d!.id,b.dataset.doorMode as DoorMode));updateDefenses(s);});
    const remove=inspector.querySelector<HTMLButtonElement>('#dismantle-defense');if(remove)remove.onclick=()=>{feedback(s,removeDefense(w,d!.id));updateDefenses(s);};
  }
  if(d){
    inspector.querySelector('#fixture-status')!.textContent=isDoor(d)?`${d.health} / ${d.maxHealth} health · ${d.mode}${d.mode==='locked'&&doorOccupied(w,d)?' · Waiting for occupants to clear':d.mode==='closed'&&doorIsOpen(w,d)?' · Open for passage':''}`:`${def!.damage} damage · ${d.readyAt>w.elapsed?`Resetting: ${Math.ceil(d.readyAt-w.elapsed)}s`:'Ready'}${def!.kind==='bolt'?` · ${defenseDirections[d.rotation].name} · ${def!.range} squares`:''}`;
    inspector.querySelectorAll<HTMLButtonElement>('[data-door-mode]').forEach(b=>{const active=b.dataset.doorMode===d.mode;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  }
  const placed=s.panel.querySelector<HTMLElement>('#placed-defenses')!,signature=(w.defenses??[]).map(d=>d.id).join(',');
  if(placed.dataset.ids!==signature){placed.dataset.ids=signature;placed.innerHTML=(w.defenses??[]).map(d=>`<button class="wide" data-inspect-fixture="${d.id}">${defenseById(d.type)!.name} · ${d.x}, ${d.z}</button>`).join('')||'<p class="muted">None placed.</p>';placed.querySelectorAll<HTMLButtonElement>('[data-inspect-fixture]').forEach(b=>b.onclick=()=>{const d=w.defenses!.find(d=>d.id===Number(b.dataset.inspectFixture))!;s.selection.selected=d;s.selection.setTool('inspect');s.controls.center(d.x,d.z);updateDefenses(s);});}
  const enemies=s.panel.querySelector('#test-enemies');if(enemies)enemies.innerHTML=(w.enemies??[]).slice(-5).map(e=>`<p class="muted">Raider ${e.id} · ${e.health} health · ${e.activity}</p>`).join('');
}
