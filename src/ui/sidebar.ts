import {showSpells,updateSpells} from './spells';
import {characterDefinitions} from '../content/characters';
import {tuning} from '../content/tuning';
import {wallBuildDuration} from '../game/walls';
import {TuningDialog} from './tuning-dialog';
import { Matrix } from '@babylonjs/core';
import type { GameScene } from '../view/scene';
import type { CameraControls } from '../view/controls';
import type {Selection} from './selection';
import {roomDefinitions} from '../content/rooms';
import {goldTotal,roomStats,furnish} from '../game/rooms';
import {labShapes} from '../content/room-lab';
import {addMiners,addResidents} from '../game/simulation';
import {queueCraft,attractionStatus} from '../game/crafting';
import {recipes,recipeById} from '../content/recipes';
import {actionIcon} from './icons';
import {reachable} from '../game/navigation';
import {key,tileAt} from '../game/types';
import {spellDefinitions} from '../content/spells';
import {workRate} from '../game/progression';
import {enableRecruitment} from '../game/recruitment';
import {showDefenses,updateDefenses} from './defenses';
import {defenseAt} from '../game/doors';
import {health,maxHealth,visible} from '../game/spell-effects';
import type {SpellTarget} from '../game/research';
import {prepareTestSpells} from '../content/spell-lab';
import {addRaider} from '../game/defenses';
const glyphs:Record<string,string>={rooms:'▦',defenses:'♜',spells:'✧',dwarfs:'♟',dig:'⚒',home:'⌂',debug:'⌘'};
export class Sidebar {
  root:HTMLElement; panel:HTMLElement; minimap:HTMLCanvasElement; category='rooms';
  tuningDialog=new TuningDialog();
  lab=false;labType='treasure';labShape='Compact';
  inspectedUnit?:SpellTarget;
  onLab:(open:boolean,shape?:string,type?:string)=>void=()=>{};
  onFreeBuild:(value:boolean)=>void=()=>{};onRestart:()=>void=()=>{};
  onDevelopmentPanel:()=>void=()=>{};
  constructor(public view:GameScene,public controls:CameraControls,public selection:Selection) {
    this.root=document.createElement('aside');this.root.id='sidebar';this.root.setAttribute('aria-label','Stronghold controls');
    this.root.innerHTML=`
      <header class="brand"><span class="crest">◇</span><div><h1>STONEWAKE</h1><p>RECLAIM THE DEEP</p></div></header>
      <section class="map-section"><div class="eyebrow"><span>${view.world.name}</span><span class="live-dot"></span></div><canvas id="minimap" width="240" height="170" aria-label="Minimap: click to move camera"></canvas><div class="map-caption"><span>THE UPPER WORKINGS</span><span>48 × 48</span></div></section>
      <div class="reserves"><div><span class="gold-symbol">◆</span><strong id="gold-total">0</strong><small>GOLD</small></div><div><span>♟</span><strong id="dwarf-total">0</strong><small>DWARFS</small></div></div>
      <nav class="categories" aria-label="Stronghold panels">${['rooms','defenses','spells','dwarfs','debug'].map(id=>`<button data-category="${id}" aria-label="${id[0].toUpperCase()+id.slice(1)}" title="${id}"><span>${glyphs[id]}</span><small>${id}</small></button>`).join('')}</nav>
      <div class="work-tools"><button data-tool="dig">${actionIcon('dig')} Excavate</button><button data-tool="erase" aria-label="Remove excavation marks" title="Clear excavation">${actionIcon('erase')}</button><button data-tool="wall" aria-label="Build walls" title="Build walls">${actionIcon('wall')}</button><button data-tool="reclaim" aria-label="Reclaim room tiles" title="Reclaim room tiles">${actionIcon('reclaim')}</button></div>
      <div id="panel" class="panel"></div>
      <div id="unit-inspection" class="feedback" hidden></div>
      <div id="feedback" class="feedback" role="status">Choose a task for your stronghold.</div>
      <div class="camera-tools"><button data-camera="home" aria-label="Return to Hearthstone">⌂</button><button data-camera="in" aria-label="Zoom in">＋</button><button data-camera="out" aria-label="Zoom out">−</button></div>
      <footer><button id="help" aria-label="Help">?</button><span>THE HEARTH IS ALIGHT</span><span class="live-dot"></span></footer>`;
    document.querySelector('#app')!.prepend(this.root);
    this.panel=this.root.querySelector('#panel')!;this.minimap=this.root.querySelector('#minimap')!;
    this.root.querySelectorAll<HTMLButtonElement>('[data-category]').forEach(b=>b.onclick=()=>this.show(b.dataset.category!));
    this.root.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach(b=>b.onclick=()=>selection.setTool(b.dataset.tool!));
    selection.onChange=message=>{this.root.querySelector('#feedback')!.textContent=message;this.root.querySelectorAll<HTMLElement>('[data-tool],[data-room]').forEach(b=>b.classList.toggle('active',(b.dataset.tool??b.dataset.room)===selection.tool));this.updateSelection();};
    selection.onInspect=p=>{if(defenseAt(this.view.world,p)){if(this.category!=='defenses')this.show('defenses');else updateDefenses(this);}};
    selection.onUnitInspect=target=>{this.inspectedUnit=target;this.update();};
    this.root.querySelectorAll<HTMLButtonElement>('[data-camera]').forEach(b=>b.onclick=()=>{
      switch(b.dataset.camera){case'home':controls.home();break;case'in':controls.zoom(.8);break;case'out':controls.zoom(1.25);}
    });
    this.root.querySelector<HTMLButtonElement>('#help')!.onclick=()=>this.show('help');
    this.minimap.onclick=e=>{const r=this.minimap.getBoundingClientRect();controls.center((e.clientX-r.left)/r.width*view.world.width,(e.clientY-r.top)/r.height*view.world.height);};
    this.tuningDialog.onApply=()=>{furnish(this.view.world);this.view.world.routesChanged=true;this.view.world.revision++;selection.draw();this.show(this.category);};
    this.show('rooms');view.engine.resize();
  }
  show(category:string){
    if(category==='rooms'&&this.lab)category='lab';
    this.category=category;
    this.root.querySelectorAll('[data-category]').forEach(b=>b.classList.toggle('active',(b as HTMLElement).dataset.category===(category==='lab'?'rooms':category)));
    if(category==='help')this.panel.innerHTML='<p class="eyebrow">FIELD GUIDE</p><h2>Find your foothold.</h2><p>Explore the stone halls around your Hearthstone.</p><dl><dt>Cursor icon</dt><dd>Pickaxe: dig · minus: clear · pointer: inspect · room icon: build</dd><dt>Right click / Esc</dt><dd>Return to excavation</dd><dt>W A S D / edges</dt><dd>Pan camera</dd><dt>Left Ctrl + A/D</dt><dd>Orbit viewed point (also Q/E)</dd><dt>Mouse wheel</dt><dd>Zoom</dd><dt>Middle drag</dt><dd>Orbit viewed point horizontally</dd><dt>Home</dt><dd>Return to hearth</dd></dl>';
    else if(category==='debug'){
      this.panel.innerHTML=`<p class="eyebrow">DEVELOPMENT TOOLS</p><label class="toggle"><input id="free-rooms" type="checkbox" ${this.view.world.freeRoomBuilding?'checked':''}/> Free room construction</label><p class="muted">${this.view.world.freeRoomBuilding?'Room construction and expansion cost no gold.':'Normal room costs are active.'} Placement and access rules still apply.</p><button id="open-tuning" class="wide">Game configuration</button><button id="debug-lab" class="wide">Room layouts</button><button id="restart" class="wide">Restart stronghold</button>`;
      this.panel.querySelector<HTMLInputElement>('#free-rooms')!.onchange=e=>{const value=(e.target as HTMLInputElement).checked;this.onFreeBuild(value);this.selection.draw();this.show('debug');};
      this.panel.querySelector<HTMLButtonElement>('#open-tuning')!.onclick=()=>this.tuningDialog.show();
      this.panel.querySelector<HTMLButtonElement>('#debug-lab')!.onclick=()=>this.onLab(true);
      this.panel.querySelector<HTMLButtonElement>('#restart')!.onclick=()=>this.onRestart();
    }else if(category==='lab'){
      this.panel.innerHTML=`<p class="eyebrow">ROOM LAYOUT STUDIO</p><label>Room catalog<select id="lab-room">${roomDefinitions.map(r=>`<option value="${r.id}" ${r.id===this.labType?'selected':''} ${r.implemented?'':'disabled'}>${r.name}${r.implemented?'':' · planned'}</option>`).join('')}</select></label><label>Example footprint<select id="lab-shape">${labShapes.map(s=>`<option ${s===this.labShape?'selected':''}>${s}</option>`).join('')}</select></label><div class="lab-actions"><button id="load-layout">Load layout</button><button id="reset-layout">Clear layout</button></div><p class="muted">Drag claimed squares to create or expand a room. Right-click returns to excavation; click a floor to inspect.</p><div id="room-summary"></div><button id="leave-lab" class="wide">Return to stronghold</button><p class="muted">Structures: Stone Hearth · fixed<br>Bridge · planned</p>`;
      this.panel.querySelector<HTMLSelectElement>('#lab-room')!.onchange=e=>{this.labType=(e.target as HTMLSelectElement).value;this.selection.setTool(this.labType);};
      this.panel.querySelector<HTMLSelectElement>('#lab-shape')!.onchange=e=>this.labShape=(e.target as HTMLSelectElement).value;
      this.panel.querySelector<HTMLButtonElement>('#load-layout')!.onclick=()=>this.onLab(true,this.labShape,this.labType);
      this.panel.querySelector<HTMLButtonElement>('#reset-layout')!.onclick=()=>this.onLab(true,'empty',this.labType);
      this.panel.querySelector<HTMLButtonElement>('#leave-lab')!.onclick=()=>this.onLab(false);
      const test=document.createElement('button');test.className='wide';test.textContent='Add tired test residents';test.onclick=()=>{if(!this.view.world.agents.length)addMiners(this.view.world);for(const a of this.view.world.agents){a.energy=.1;a.retry=0;}test.disabled=true;};this.panel.append(test);
      const hungry=document.createElement('button');hungry.className='wide';hungry.textContent='Add hungry test residents';hungry.onclick=()=>{if(!this.view.world.agents.length)addMiners(this.view.world);for(const a of this.view.world.agents){a.hunger=.1;a.retry=0;}hungry.disabled=true;};this.panel.append(hungry);
      const arrivals=document.createElement('label');arrivals.className='toggle';arrivals.innerHTML=`<input id="lab-arrivals" type="checkbox" ${this.view.world.recruitment?.enabled?'checked':''}> Test automatic specialist arrivals`;arrivals.title='Use normal room, bed and food requirements in this test world.';this.panel.append(arrivals);
      arrivals.querySelector<HTMLInputElement>('input')!.onchange=e=>enableRecruitment(this.view.world,(e.target as HTMLInputElement).checked);
    }else if(category==='rooms'){
      this.panel.innerHTML=`<div id="selected-action" class="selected-action" aria-live="polite"></div><div class="room-grid" role="group" aria-label="Room choices">${roomDefinitions.map(r=>`<button class="room-choice" data-room="${r.id}" aria-label="${r.name}${r.implemented?'':' (planned)'}" title="${r.name}${r.implemented?'':' · planned'}" ${r.implemented?'':'disabled'}>${actionIcon(r.id)}</button>`).join('')}</div><div id="room-summary" class="muted"></div><button id="open-lab" class="wide">Room layouts</button>`;
      this.panel.querySelectorAll<HTMLButtonElement>('[data-room]').forEach(b=>b.onclick=()=>this.selection.setTool(b.dataset.room!));
      this.panel.querySelector<HTMLButtonElement>('#open-lab')!.onclick=()=>this.onLab(true);
    }else if(category==='defenses')showDefenses(this);
    else if(category==='dwarfs')this.panel.innerHTML='<p class="eyebrow">YOUR RESIDENTS</p><div id="arrival-status" class="muted"></div><div id="residents-list"></div>';
    else if(category==='spells')showSpells(this);
    else this.panel.innerHTML=`<p class="eyebrow">${category.toUpperCase()}</p><h2>${category[0].toUpperCase()+category.slice(1)}</h2><p class="muted">No ${category} available yet.</p>`;
    if(['lab','debug'].includes(category)){
      const spells=document.createElement('button');spells.className='wide';spells.textContent='Spell test yard';spells.onclick=()=>this.onLab(true,'spells');this.panel.append(spells);
      const yard=document.createElement('button');yard.className='wide';yard.textContent='Defense test yard';yard.onclick=()=>this.onLab(true,'defenses');this.panel.append(yard);
      const showcase=document.createElement('button');showcase.className='wide';showcase.textContent='Load visual showcase';showcase.onclick=()=>this.onLab(true,'showcase');this.panel.append(showcase);
    }
    if(['rooms','lab','debug','defenses'].includes(category)){
      const production=document.createElement('details');production.className='production';production.innerHTML=`<summary>Workshop production</summary><div id="craft-status" class="muted"></div>${recipes.map(r=>`<button class="wide" data-recipe="${r.id}">Queue ${r.name.toLowerCase()} · ${r.cost} gold</button>`).join('')}<div id="craft-orders"></div><div id="craft-outputs"></div>`;this.panel.append(production);
      production.querySelectorAll<HTMLButtonElement>('[data-recipe]').forEach(b=>b.onclick=()=>{queueCraft(this.view.world,b.dataset.recipe!);this.update();});
    }
    if(['lab','debug'].includes(category)){
            const catalog=document.createElement('div');catalog.innerHTML=`<label>Test dwarf type<select id="debug-dwarf-type">${characterDefinitions.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></label><button id="add-test-dwarf" class="wide">Add test dwarf</button><p id="debug-attraction" class="muted"></p>`;this.panel.append(catalog);
      catalog.querySelector<HTMLButtonElement>('#add-test-dwarf')!.onclick=()=>{addResidents(this.view.world,catalog.querySelector<HTMLSelectElement>('select')!.value);this.update();};
    }
    this.updateSelection();
    if(category==='spells'&&this.view.world.spellTest){
      const controls=document.createElement('div');controls.className='spell-test-controls';
      const pause=document.createElement('label');pause.innerHTML=`<input type="checkbox" ${this.view.world.spellTest.paused?'checked':''}> Pause test simulation`;pause.querySelector('input')!.onchange=e=>{this.view.world.spellTest!.paused=(e.target as HTMLInputElement).checked;};controls.append(pause);
      const button=(label:string,fn:()=>void)=>{const b=document.createElement('button');b.textContent=label;b.onclick=fn;controls.append(b);};
      button('Prepare test spells',()=>{prepareTestSpells(this.view.world);this.update();});
      button('Add test enemy',()=>{const w=this.view.world;addRaider(w,w.spellTest!.spawn,w.spellTest!.target);});
      button('Wound test warrior',()=>{const a=this.view.world.agents.find(a=>a.capabilities.includes('fight'));if(a){a.health=Math.max(1,health(a)-50);this.inspectedUnit={kind:'dwarf',id:a.id};this.update();}});
      button('Reset spell yard',()=>this.onLab(true,'spells'));
      button('Return to stronghold',()=>this.onLab(false));
      this.panel.prepend(controls);
    }
    if(category==='debug')this.onDevelopmentPanel();
  }
  updateSelection(){
    const id=this.selection.tool,room=roomDefinitions.find(r=>r.id===id);
    this.root.querySelectorAll<HTMLButtonElement>('[data-room]').forEach(b=>{const selected=b.dataset.room===id;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});
    const header=this.panel.querySelector<HTMLElement>('#selected-action');if(!header)return;
    const price=room?(this.view.world.freeRoomBuilding?0:room.cost):undefined,signature=id+':'+price+':'+room?.capacityPerTile+':'+tuning.reclaimRatio+':'+wallBuildDuration();
    if(header.dataset.selection===signature)return;header.dataset.selection=signature;
    header.innerHTML=actionIcon(id)+`<div><strong>${room?.name??(id==='erase'?'Clear excavation':id==='inspect'?'Inspect':id==='wall'?'Build walls':id==='reclaim'?'Reclaim room tiles':'Excavate')}</strong>${price===undefined?(id==='wall'?`<span class="room-price">${wallBuildDuration()} seconds / wall</span>`:id==='reclaim'?`<span class="room-price">${Math.round(tuning.reclaimRatio*100)}% of paid cost back</span>`:''):`<span class="room-price"><b>${price}</b> gold / square</span><span class="room-price">${room!.capacityPerTile} ${room!.service==='storage'?'gold storage':'dwarf capacity'} / square</span>`}</div>`;
  }
  drawMap(){
    const c=this.minimap.getContext('2d')!,w=this.view.world,sx=this.minimap.width/w.width,sz=this.minimap.height/w.height;
    c.fillStyle='#0c1319';c.fillRect(0,0,240,170);
    const color:Record<string,string>={dirt:'#6f5a43',rock:'#91938a',bedrock:'#3c4d55',gold:'#dba949',gem:'#857ab9',floor:'#8b8067'};
    for(const t of w.tiles)if(t.known){c.fillStyle=t.core?'#8de3e5':t.room?roomDefinitions.find(r=>r.id===t.room)!.color:color[t.terrain];c.fillRect(t.x*sx,t.z*sz,sx+.4,sz+.4);}
    c.strokeStyle='#ddd4b2';c.lineWidth=1;c.beginPath();
    const scene=this.view.scene,e=this.view.engine;
    const width=this.view.canvas.clientWidth,height=this.view.canvas.clientHeight;
    [[0,0],[width,0],[width,height],[0,height]].forEach(([x,y],i)=>{
      const ray=scene.createPickingRay(x,y,Matrix.Identity(),this.view.camera);const d=-ray.origin.y/ray.direction.y;
      const px=(ray.origin.x+ray.direction.x*d)*sx,pz=(ray.origin.z+ray.direction.z*d)*sz;
      if(i===0)c.moveTo(px,pz);else c.lineTo(px,pz);
    });c.closePath();c.stroke();
    c.fillStyle='#effaf4';c.fillRect(this.view.camera.target.x*sx-1.5,this.view.camera.target.z*sz-1.5,3,3);
  }
  update(){
    updateDefenses(this);
    this.updateSelection();this.drawMap();const w=this.view.world;
    this.root.querySelector('.map-section .eyebrow span')!.textContent=w.name;
    this.root.querySelector('.map-caption span:last-child')!.textContent=`${w.width} × ${w.height}`;
    this.root.querySelector('#gold-total')!.textContent=String(goldTotal(w));this.root.querySelector('#dwarf-total')!.textContent=String(w.agents.length);
    const list=this.root.querySelector('#residents-list');if(list)list.innerHTML=w.agents.map(a=>`<div class="resident-row"><strong>${a.name} <span class="resident-type">${characterDefinitions.find(c=>c.id===a.type)?.name??a.type}</span></strong><small>${a.activity}${a.carrying?` · ${a.carrying} gold`:''}<br>Energy ${Math.round(a.energy*100)}% · Rests ${a.rested}<br>Fed ${Math.round(a.hunger*100)}% · Meals ${a.meals}<br>Training ${a.trainingLevel??0} / ${tuning.trainingLevels} · Work +${Math.round((workRate(w,a)-1)*100)}%<br>${(a.trainingLevel??0)>=tuning.trainingLevels?'Training complete':(a.nextTrainingAt??0)>w.elapsed?`Training cooldown · ${Math.ceil(a.nextTrainingAt!-w.elapsed)} seconds`:`Next level ${Math.min(100,Math.floor((a.trainingProgress??0)/tuning.trainingSeconds*100))}% · One level per visit`}</small></div>`).join('');
    const arrivals=this.panel.querySelector('#arrival-status');if(arrivals)arrivals.innerHTML=`<p>${w.recruitment?.enabled?`Specialists arrive through the Hearth when rooms and settlement have spare capacity. Next check in ${Math.max(0,Math.ceil(w.recruitment.nextAt-w.elapsed))} seconds.`:'Automatic arrivals are off in this room layout. Enable the arrival test in Rooms to exercise normal requirements.'}</p>${characterDefinitions.filter(c=>c.attractionServices.length).map(c=>`<p><b>${c.name} · ${w.agents.filter(a=>a.type===c.id).length}</b><br>${attractionStatus(w,c.id)}</p>`).join('')}`;
    const summary=this.root.querySelector('#room-summary');if(summary){
      const p=this.selection.selected??(this.lab?w.tiles.find(t=>t.room===this.selection.tool):undefined);
      summary.textContent='';
      if(p&&tileAt(w,p.x,p.z)?.core){const chest=w.roomServices.find(f=>f.id==='hearth-treasury');summary.textContent=chest?`Hearth treasury · ${chest.stored} / ${chest.capacity} gold`:'';}
      else if(p){
        const s=roomStats(w,p),room=roomDefinitions.find(r=>r.id===tileAt(w,p.x,p.z)?.room);
        if(room){
          const usable=s.usable.reduce((sum,f)=>sum+f.capacity,0),ids=new Set(s.usable.map(f=>f.id));
          const occupied=w.agents.filter(a=>a.job?.furnishing&&ids.has(a.job.furnishing)).length;
          const assigned=s.usable.filter(f=>f.assigned!==undefined).length;
          const label=room.service==='storage'?'gold storage':room.service==='rest'?'accommodation':room.service==='dining'?'food support':`${room.service} capacity`;
          summary.textContent=`${s.tiles} square${s.tiles===1?'':'s'} · ${s.capacity} ${label}. `;
          if(room.service==='storage')summary.textContent+=`${s.services.reduce((sum,f)=>sum+f.stored,0)} gold stored. `;
          else if(room.service==='rest')summary.textContent+=`${assigned} assigned · ${Math.max(0,usable-assigned)} available. `;
          else if(room.service==='dining')summary.textContent+=`Supports ${usable} dwarf${usable===1?'':'s'} · ${assigned} assigned · ${occupied} eating. `;
          else summary.textContent+=`${occupied} occupied · ${Math.max(0,usable-occupied)} available. `;
          if(usable<s.capacity)summary.textContent+=`${s.capacity-usable} capacity unreachable. `;
          if(room.service==='training')summary.textContent+=`All dwarf types gain one level per visit, then wait ${tuning.trainingInterval} seconds before training again. `;
          if(room.service==='research')summary.textContent+='Choose research in the Spells panel. ';
          summary.textContent+='Furniture is decorative.';
        }
      }
    }
    const attraction=this.panel.querySelector('#debug-attraction');if(attraction)attraction.textContent=attractionStatus(w,this.panel.querySelector<HTMLSelectElement>('#debug-dwarf-type')!.value);
    const c=this.minimap.getContext('2d')!;c.fillStyle='#efe5bd';for(const a of w.agents)c.fillRect(a.x*240/w.width-1,a.z*170/w.height-1,2,2);
    const craftStatus=this.panel.querySelector('#craft-status');if(craftStatus){
      const start=w.agents[0]??w.tiles.find(t=>t.claimed&&!t.core&&t.terrain==='floor'),access=start?reachable(w,start):new Set<string>();
      craftStatus.textContent=`${w.roomServices.filter(f=>f.service==='craft'&&access.has(key(f.access))).reduce((sum,f)=>sum+f.capacity,0)} dwarf crafting capacity · ${w.agents.filter(a=>recipes.some(r=>a.capabilities.includes(r.capability))).length} capable workers. Engineers need a reachable Workshop, spare accommodation and food support to arrive.`;
      this.panel.querySelector('#craft-orders')!.innerHTML=w.craftOrders.filter(o=>o.state!=='done').map(o=>`<p>${recipeById(o.recipe)!.name} · ${o.state==='working'?Math.round(o.progress/recipeById(o.recipe)!.seconds*100)+'%':'Queued'}</p>`).join('');
      this.panel.querySelector('#craft-outputs')!.textContent=recipes.map(r=>`${w.outputs[r.id]??0} ${r.name.toLowerCase()}s`).join(' · ');
    }
    updateSpells(this);
    const inspection=this.root.querySelector<HTMLElement>('#unit-inspection')!,target=this.inspectedUnit;
    const dwarf=target?.kind==='dwarf'?w.agents.find(a=>a.id===target.id):undefined;
    const enemy=target?.kind==='enemy'?w.enemies?.find(e=>e.id===target.id&&e.health>0):undefined;
    const unit=dwarf??enemy;
    inspection.hidden=!unit||!visible(w,unit);
    if(unit&&!inspection.hidden)inspection.textContent=`${dwarf?dwarf.name:'Enemy'} · Health ${Math.ceil(dwarf?health(dwarf):enemy!.health)}${dwarf?' / '+maxHealth(dwarf):''}\n${unit.activity}\n${(unit.effects??[]).filter(e=>e.until>w.elapsed).map(e=>`${spellDefinitions.find(s=>s.id===e.id)?.name??e.id} · ${Math.ceil(e.until-w.elapsed)}s${e.kind==='shield'?' · '+Math.ceil(e.remaining??0)+' shield':''}`).join('\n')}`;
  }
}
