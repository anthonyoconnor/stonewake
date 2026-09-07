import {characterDefinitions} from '../content/characters';
import {tuning} from '../content/tuning';
import {wallBuildDuration} from '../game/walls';
import {TuningDialog} from './tuning-dialog';
import { Matrix } from '@babylonjs/core';
import type { GameScene } from '../view/scene';
import type { CameraControls } from '../view/controls';
import type {Selection} from './selection';
import {roomDefinitions} from '../content/rooms';
import {goldTotal,roomStats} from '../game/rooms';
import {labShapes} from '../content/room-lab';
import {addMiners,addResidents} from '../game/simulation';
import {queueCraft,attractionStatus} from '../game/crafting';
import {recipes,recipeById} from '../content/recipes';
import {actionIcon} from './icons';
import {reachable} from '../game/navigation';
import {key,tileAt} from '../game/types';
const glyphs:Record<string,string>={rooms:'▦',defenses:'♜',spells:'✧',dwarfs:'♟',dig:'⚒',home:'⌂',debug:'⌘'};
export class Sidebar {
  root:HTMLElement; panel:HTMLElement; minimap:HTMLCanvasElement; category='rooms';
  tuningDialog=new TuningDialog();
  lab=false;labType='treasure';labShape='Compact';
  onLab:(open:boolean,shape?:string,type?:string)=>void=()=>{};
  onFreeBuild:(value:boolean)=>void=()=>{};onRestart:()=>void=()=>{};
  constructor(public view:GameScene,public controls:CameraControls,public selection:Selection) {
    this.root=document.createElement('aside');this.root.id='sidebar';this.root.setAttribute('aria-label','Stronghold controls');
    this.root.innerHTML=`
      <header class="brand"><span class="crest">◇</span><div><h1>STONEWAKE</h1><p>RECLAIM THE DEEP</p></div></header>
      <section class="map-section"><div class="eyebrow"><span>${view.world.name}</span><span class="live-dot"></span></div><canvas id="minimap" width="240" height="170" aria-label="Minimap: click to move camera"></canvas><div class="map-caption"><span>THE UPPER WORKINGS</span><span>48 × 48</span></div></section>
      <div class="reserves"><div><span class="gold-symbol">◆</span><strong id="gold-total">0</strong><small>GOLD</small></div><div><span>♟</span><strong id="dwarf-total">0</strong><small>DWARFS</small></div></div>
      <nav class="categories" aria-label="Stronghold panels">${['rooms','defenses','spells','dwarfs','debug'].map(id=>`<button data-category="${id}" aria-label="${id[0].toUpperCase()+id.slice(1)}" title="${id}"><span>${glyphs[id]}</span><small>${id}</small></button>`).join('')}</nav>
      <div class="work-tools"><button data-tool="dig">${actionIcon('dig')} Excavate</button><button data-tool="erase" aria-label="Remove excavation marks" title="Clear excavation">${actionIcon('erase')}</button><button data-tool="wall" aria-label="Build walls" title="Build walls">${actionIcon('wall')}</button><button data-tool="reclaim" aria-label="Reclaim room tiles" title="Reclaim room tiles">${actionIcon('reclaim')}</button></div>
      <div id="panel" class="panel"></div>
      <div id="feedback" class="feedback" role="status">Choose a task for your stronghold.</div>
      <div class="camera-tools"><button data-camera="home" aria-label="Return to Hearthstone">⌂</button><button data-camera="in" aria-label="Zoom in">＋</button><button data-camera="out" aria-label="Zoom out">−</button></div>
      <footer><button id="help" aria-label="Help">?</button><span>THE HEARTH IS ALIGHT</span><span class="live-dot"></span></footer>`;
    document.querySelector('#app')!.prepend(this.root);
    this.panel=this.root.querySelector('#panel')!;this.minimap=this.root.querySelector('#minimap')!;
    this.root.querySelectorAll<HTMLButtonElement>('[data-category]').forEach(b=>b.onclick=()=>this.show(b.dataset.category!));
    this.root.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach(b=>b.onclick=()=>selection.setTool(b.dataset.tool!));
    selection.onChange=message=>{this.root.querySelector('#feedback')!.textContent=message;this.root.querySelectorAll<HTMLElement>('[data-tool],[data-room]').forEach(b=>b.classList.toggle('active',(b.dataset.tool??b.dataset.room)===selection.tool));this.updateSelection();};
    this.root.querySelectorAll<HTMLButtonElement>('[data-camera]').forEach(b=>b.onclick=()=>{
      switch(b.dataset.camera){case'home':controls.home();break;case'in':controls.zoom(.8);break;case'out':controls.zoom(1.25);}
    });
    this.root.querySelector<HTMLButtonElement>('#help')!.onclick=()=>this.show('help');
    this.minimap.onclick=e=>{const r=this.minimap.getBoundingClientRect();controls.center((e.clientX-r.left)/r.width*view.world.width,(e.clientY-r.top)/r.height*view.world.height);};
    this.tuningDialog.onApply=()=>{selection.draw();this.show(this.category);};
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
    }else if(category==='rooms'){
      this.panel.innerHTML=`<div id="selected-action" class="selected-action" aria-live="polite"></div><div class="room-grid" role="group" aria-label="Room choices">${roomDefinitions.map(r=>`<button class="room-choice" data-room="${r.id}" aria-label="${r.name}${r.implemented?'':' (planned)'}" title="${r.name}${r.implemented?'':' · planned'}" ${r.implemented?'':'disabled'}>${actionIcon(r.id)}</button>`).join('')}</div><div id="room-summary" class="muted"></div><button id="open-lab" class="wide">Room layouts</button>`;
      this.panel.querySelectorAll<HTMLButtonElement>('[data-room]').forEach(b=>b.onclick=()=>this.selection.setTool(b.dataset.room!));
      this.panel.querySelector<HTMLButtonElement>('#open-lab')!.onclick=()=>this.onLab(true);
    }else if(category==='dwarfs')this.panel.innerHTML='<p class="eyebrow">YOUR RESIDENTS</p><div id="residents-list"></div>';
    else this.panel.innerHTML=`<p class="eyebrow">${category.toUpperCase()}</p><h2>${category[0].toUpperCase()+category.slice(1)}</h2><p class="muted">No ${category} available yet.</p>`;
    if(['lab','debug'].includes(category)){
      const showcase=document.createElement('button');showcase.className='wide';showcase.textContent='Load visual showcase';showcase.onclick=()=>this.onLab(true,'showcase');this.panel.append(showcase);
    }
    if(['rooms','lab','debug'].includes(category)){
      const production=document.createElement('details');production.className='production';production.innerHTML=`<summary>Workshop production</summary><div id="craft-status" class="muted"></div>${recipes.map(r=>`<button class="wide" data-recipe="${r.id}">Queue ${r.name.toLowerCase()} · ${r.cost} gold</button>`).join('')}<div id="craft-orders"></div><div id="craft-outputs"></div>`;this.panel.append(production);
      production.querySelectorAll<HTMLButtonElement>('[data-recipe]').forEach(b=>b.onclick=()=>{queueCraft(this.view.world,b.dataset.recipe!);this.update();});
    }
    if(['lab','debug'].includes(category)){
            const catalog=document.createElement('div');catalog.innerHTML=`<label>Test dwarf type<select id="debug-dwarf-type">${characterDefinitions.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></label><button id="add-test-dwarf" class="wide">Add test dwarf</button><p id="debug-attraction" class="muted"></p>`;this.panel.append(catalog);
      catalog.querySelector<HTMLButtonElement>('#add-test-dwarf')!.onclick=()=>{addResidents(this.view.world,catalog.querySelector<HTMLSelectElement>('select')!.value);this.update();};
    }
    this.updateSelection();
  }
  updateSelection(){
    const id=this.selection.tool,room=roomDefinitions.find(r=>r.id===id);
    this.root.querySelectorAll<HTMLButtonElement>('[data-room]').forEach(b=>{const selected=b.dataset.room===id;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});
    const header=this.panel.querySelector<HTMLElement>('#selected-action');if(!header)return;
    const price=room?(this.view.world.freeRoomBuilding?0:room.cost):undefined,signature=id+':'+price+':'+tuning.reclaimRatio+':'+wallBuildDuration();
    if(header.dataset.selection===signature)return;header.dataset.selection=signature;
    header.innerHTML=actionIcon(id)+`<div><strong>${room?.name??(id==='erase'?'Clear excavation':id==='inspect'?'Inspect':id==='wall'?'Build walls':id==='reclaim'?'Reclaim room tiles':'Excavate')}</strong>${price===undefined?(id==='wall'?`<span class="room-price">${wallBuildDuration()} seconds / wall</span>`:id==='reclaim'?`<span class="room-price">${Math.round(tuning.reclaimRatio*100)}% of paid cost back</span>`:''):`<span class="room-price"><b>${price}</b> gold / square</span>`}</div>`;
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
    this.updateSelection();this.drawMap();const w=this.view.world;
    this.root.querySelector('.map-section .eyebrow span')!.textContent=w.name;
    this.root.querySelector('.map-caption span:last-child')!.textContent=`${w.width} × ${w.height}`;
    this.root.querySelector('#gold-total')!.textContent=String(goldTotal(w));this.root.querySelector('#dwarf-total')!.textContent=String(w.agents.length);
    const list=this.root.querySelector('#residents-list');if(list)list.innerHTML=w.agents.map(a=>`<div class="resident-row"><strong>${a.name}</strong><small>${a.activity}${a.carrying?` · ${a.carrying} gold`:''}<br>Energy ${Math.round(a.energy*100)}% · Rests ${a.rested}<br>Fed ${Math.round(a.hunger*100)}% · Meals ${a.meals}</small></div>`).join('');
    const summary=this.root.querySelector('#room-summary');if(summary){
      const p=this.selection.selected??(this.lab?w.tiles.find(t=>t.room===this.selection.tool):undefined);
      if(p){const stats=roomStats(w,p);summary.textContent=`${stats.tiles} squares · ${stats.usable.length} usable facilities${stats.usable.some(f=>f.service==='rest')?` · ${stats.usable.filter(f=>f.assigned).length} assigned beds · ${stats.usable.filter(f=>!f.assigned).length} free beds`:` · ${stats.usable.reduce((s,f)=>s+f.capacity,0)} capacity`}${stats.tiles&&!stats.usable.length?' · Needs space or access.':''}`;}
      else summary.textContent='';
      if(p){const s=roomStats(w,p);if(s.facilities.some(f=>['growing','cooking','dining','brewing'].includes(f.service))){
        const count=(service:string)=>s.usable.filter(f=>f.service===service),food=count('cooking').reduce((sum,f)=>sum+f.stored,0);
        summary.textContent=`${s.tiles} squares · ${food} meals · ${count('dining').length} eating positions · ${count('brewing').reduce((sum,f)=>sum+f.stored,0)} ale. `;
        if(!count('growing').length||!count('cooking').length)summary.textContent+='Needs growing and cooking facilities.';else if(!count('dining').length)summary.textContent+='Needs room for a table.';else if(!food)summary.textContent+='Food is growing and cooking.';
      }}
      if(p&&tileAt(w,p.x,p.z)?.core){const chest=w.furnishings.find(f=>f.id==='hearth-treasury');summary.textContent=chest?`Hearth treasury · ${chest.stored} / ${chest.capacity} gold`:'';}
    }
    const attraction=this.panel.querySelector('#debug-attraction');if(attraction)attraction.textContent=attractionStatus(w,this.panel.querySelector<HTMLSelectElement>('#debug-dwarf-type')!.value);
    if(summary&&w.salvaged&&Object.values(w.salvaged).some(v=>v>0))summary.textContent+=` Retained supplies: ${Object.entries(w.salvaged).filter(([,n])=>n>0).map(([service,n])=>`${n} ${service}`).join(', ')}.`;
    const c=this.minimap.getContext('2d')!;c.fillStyle='#efe5bd';for(const a of w.agents)c.fillRect(a.x*240/w.width-1,a.z*170/w.height-1,2,2);
    const craftStatus=this.panel.querySelector('#craft-status');if(craftStatus){
      const start=w.agents[0]??w.tiles.find(t=>t.claimed&&!t.core&&t.terrain==='floor'),access=start?reachable(w,start):new Set<string>();
      craftStatus.textContent=`${w.furnishings.filter(f=>f.service==='craft'&&access.has(key(f.access))).length} usable craft positions · ${w.agents.filter(a=>recipes.some(r=>a.capabilities.includes(r.capability))).length} capable workers. Add test residents through the Debug dwarf catalog.`;
      this.panel.querySelector('#craft-orders')!.innerHTML=w.craftOrders.filter(o=>o.state!=='done').map(o=>`<p>${recipeById(o.recipe)!.name} · ${o.state==='working'?Math.round(o.progress/recipeById(o.recipe)!.seconds*100)+'%':'Queued'}</p>`).join('');
      this.panel.querySelector('#craft-outputs')!.textContent=recipes.map(r=>`${w.outputs[r.id]??0} ${r.name.toLowerCase()}s`).join(' · ');
    }
  }
}
