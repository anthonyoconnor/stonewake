import { roomAllowed, buildingAllowed, recipeAllowed, availabilityReason } from '../game/availability';
import { ruinStatus } from '../game/ruins';
import { showDwarfs, updateDwarfs } from './dwarfs';
import { showCombatLab, updateCombatLab } from './combat-lab';
import { defaultCombatSetup, type CombatSetup } from '../content/combat-lab';
import { showLightingLab } from './lighting-lab';
import { showGraphicsGallery, updateGraphicsGallery } from './graphics-gallery';
import { isGraphicsGallery } from '../content/graphics-gallery';
import type { GraphicsGallery } from '../view/graphics-gallery';
import type { ArcanaGallery } from '../view/arcana-gallery';
import { isArcanaGallery } from '../content/arcana-gallery';
import { showArcanaGallery, updateArcanaGallery } from './arcana-gallery';
import { isTerrainComparison } from '../content/terrain-comparison';
import { showTerrainComparison } from './terrain-comparison';
import { bridgeSettings } from '../game/terrain.ts';
import {showSpells,updateSpells} from './spells';
import {characterDefinitions,maxCharacterLevel,isConstruct,isAnimal} from '../content/characters';
import {tuning} from '../content/tuning';
import {wallBuildDuration} from '../game/walls';
import {TuningDialog} from './tuning-dialog';
import { FullMap, drawMap } from './map';
import { LevelPreview } from './level-preview';
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
import {characterStats,nextCharacterLevel,syncCharacterHealth} from '../game/progression';
import {enableRecruitment,recruitmentSummary} from '../game/recruitment';
import {showDefenses,updateDefenses} from './defenses';
import {defenseAt} from '../game/doors';
import {health,maxHealth,visible} from '../game/spell-effects';
import type {SpellTarget} from '../game/research';
import {prepareTestSpells} from '../content/spell-lab';
import {addRaider,addEnemy} from '../game/defenses';
import {mountEconomy,updateEconomy,residentPayText} from './economy';
import {mountEncounterPanel,updateEncounters} from './encounters';
import {mountHearth,showHearth,updateHearth} from './hearth';
import {mountMoralePanel,updateMorale,residentMoraleText} from './morale';
import {actionAvailability,mountActionHelp} from './action-help';
import {MessageCenter} from './messages';
import {enemyById,enemyDefinitions} from '../content/enemies';
import {defenseById} from '../content/defenses';
const glyphs:Record<string,string>={rooms:'▦',defenses:'♜',spells:'✧',dwarfs:'♟',dig:'⚒',home:'⌂',debug:'⌘'};
const effectLabels:Record<string,string>={'spider-web':'Webbed','spore-cloud':'Spore cloud'};
const constructionTools=`<button class="room-choice" data-tool="bridge" title="Build bridges" aria-label="Build bridges">${actionIcon('bridge')}</button><button class="room-choice" data-tool="wall" title="Build walls" aria-label="Build walls">${actionIcon('wall')}</button><span aria-hidden="true"></span><button class="room-choice" data-tool="sell" title="Sell rooms, bridges or defenses" aria-label="Sell">${actionIcon('sell')}</button>`;
export class Sidebar {
  root:HTMLElement; panel:HTMLElement; minimap:HTMLCanvasElement; category='rooms';
  unitInspection:HTMLElement;
  tuningDialog=new TuningDialog();
  fullMap:FullMap;
  levelPreview:LevelPreview;
  messages:MessageCenter;
  refreshActionHelp:()=>void=()=>{};
  lab=false;labType='treasure';labShape='Compact';
  combatSetup:CombatSetup={...defaultCombatSetup};
  graphicsGallery?:GraphicsGallery;
  arcanaGallery?:ArcanaGallery;
  inspectedUnit?:SpellTarget;
  onLab:(open:boolean,shape?:string,type?:string)=>void=()=>{};
  onFreeBuild:(value:boolean)=>void=()=>{};onRestart:()=>void=()=>{};onRestartArea:()=>void=()=>{};
  onTravel:()=>void=()=>{};
  onMenu:()=>void=()=>{};
  onCharacterHealthChanged:(levels:Set<string>)=>void=()=>{};
  onDevelopmentPanel:()=>void=()=>{};
  isPaused:()=>boolean=()=>false;
  onPause:(paused:boolean)=>void=()=>{};
  constructor(public view:GameScene,public controls:CameraControls,public selection:Selection) {
    this.root=document.createElement('aside');this.root.id='sidebar';this.root.setAttribute('aria-label','Stronghold controls');
    this.root.innerHTML=`
      <header class="brand"><span class="crest">◇</span><div><h1>STONEWAKE</h1><p>RECLAIM THE DEEP</p></div></header>
      <section class="map-section"><div class="eyebrow"><span>${view.world.name}</span><button id="show-map" aria-label="Show full map" title="Show full map (M)" aria-keyshortcuts="M" aria-haspopup="dialog">⛶</button></div><canvas id="minimap" width="240" height="170" aria-label="Minimap: click to move camera"></canvas><div class="map-caption"><span>TERRAIN & RESOURCES</span><span>48 × 48</span></div></section>
      <div class="reserves"><div><span class="gold-symbol">◆</span><strong id="gold-total">0</strong><small>GOLD</small></div><div><span>♟</span><strong id="dwarf-total">0</strong><small>WORKFORCE</small></div></div>
      <nav class="categories" aria-label="Stronghold panels">${['rooms','defenses','spells','dwarfs'].map(id=>`<button data-category="${id}" aria-label="${id==='dwarfs'?'Workforce':id[0].toUpperCase()+id.slice(1)}" title="${id==='dwarfs'?'Workforce':id[0].toUpperCase()+id.slice(1)}" aria-controls="panel"><span>${glyphs[id]}</span><small>${id==='dwarfs'?'workforce':id}</small></button>`).join('')}</nav>
      <div id="panel" class="panel" tabindex="-1"></div>
      <section id="unit-inspection" class="feedback" aria-label="Selected character" hidden><button id="close-inspection" aria-label="Close character inspection" title="Close character inspection">×</button><div id="unit-inspection-text"></div></section>
      <div class="tool-status"><span id="active-tool"></span><button id="cancel-tool" aria-label="Cancel active tool" title="Cancel active tool (Escape / right-click)">×</button></div>
      <div id="feedback" class="feedback" role="status">Choose a task for your stronghold.</div>
      <div class="camera-tools"><button data-camera="home" aria-label="Return to Hearthstone" title="Return to Hearthstone (Home)">⌂</button><button data-camera="in" aria-label="Zoom in" title="Zoom in">＋</button><button data-camera="out" aria-label="Zoom out" title="Zoom out">−</button></div>
      <footer><button id="help" aria-label="Help" title="Field guide and message history">?</button><span>THE HEARTH IS ALIGHT</span><button id="open-menu" aria-label="Main menu" title="Return to main menu">☰</button><button data-category="debug" aria-label="Debug" title="Development settings and test harnesses">⌘</button></footer>`;
    document.querySelector('#app')!.prepend(this.root);
    this.root.addEventListener('click',e=>{
      if(!this.view.world.outcome||!(e.target instanceof Element))return;
      if(e.target.closest('[data-tool],[data-room],[data-recipe],[data-research],[data-pause-research],[data-cast],#dismiss-rally,#add-test-dwarf,#advance-encounter,#free-rooms,#lab-arrivals,#open-tuning')){e.preventDefault();e.stopImmediatePropagation();this.root.querySelector('#feedback')!.textContent='This area has ended. Use the result card to continue.';}
    },true);
    this.panel=this.root.querySelector('#panel')!;this.minimap=this.root.querySelector('#minimap')!;
    this.unitInspection=this.root.querySelector('#unit-inspection')!;
    this.fullMap=new FullMap(view,controls,this.root.querySelector<HTMLButtonElement>('#show-map')!);
    this.levelPreview=new LevelPreview(view,controls);
    mountHearth(this);
    this.messages=new MessageCenter(this);
    this.refreshActionHelp=mountActionHelp(this.root);
    this.root.querySelectorAll<HTMLButtonElement>('[data-category]').forEach(b=>b.onclick=()=>this.show(b.dataset.category!));
    this.root.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach(b=>b.onclick=()=>selection.setTool(b.dataset.tool!));
    selection.onChange=message=>{this.root.querySelector('#feedback')!.textContent=message;this.root.querySelectorAll<HTMLElement>('[data-tool],[data-room]').forEach(b=>b.classList.toggle('active',(b.dataset.tool??b.dataset.room)===selection.tool));this.updateSelection();};
    selection.onInspect=p=>{const tile=tileAt(this.view.world,p.x,p.z);if(tile?.core||tile?.onward){this.show('hearth');return;}if(defenseAt(this.view.world,p)){if(this.category!=='defenses')this.show('defenses');else updateDefenses(this);}else if((tile?.room||(tile?.known&&tile.ruin))&&!['rooms','lab'].includes(this.category))this.show('rooms');};
    selection.onUnitInspect=target=>{this.inspectedUnit=target;this.update();this.unitInspection.scrollIntoView({block:'nearest'});};
    this.root.querySelectorAll<HTMLButtonElement>('[data-camera]').forEach(b=>b.onclick=()=>{
      switch(b.dataset.camera){case'home':controls.home();break;case'in':controls.zoom(.8);break;case'out':controls.zoom(1.25);}
    });
    this.root.querySelector<HTMLButtonElement>('#help')!.onclick=()=>this.show('help');
    this.root.querySelector<HTMLButtonElement>('#open-menu')!.onclick=()=>this.onMenu();
    this.root.querySelector<HTMLButtonElement>('#cancel-tool')!.onclick=()=>selection.setTool('dig');
    this.root.querySelector<HTMLButtonElement>('#close-inspection')!.onclick=()=>{this.inspectedUnit=undefined;this.update();};
    this.root.addEventListener('contextmenu',e=>{e.preventDefault();selection.setTool('dig');});
    this.minimap.onclick=e=>{const r=this.minimap.getBoundingClientRect();controls.center((e.clientX-r.left)/r.width*view.world.width,(e.clientY-r.top)/r.height*view.world.height);};
    const configuredHealth=new Map<string,number>(characterDefinitions.flatMap(c=>c.levels.map(level=>[`${c.id}:${level.level}`,level.health] as const)));
    this.tuningDialog.onApply=()=>{
      const changed=new Set<string>();
      for(const c of characterDefinitions)for(const level of c.levels){const id=`${c.id}:${level.level}`;if(configuredHealth.get(id)!==level.health)changed.add(id);configuredHealth.set(id,level.health);}
      for(const a of this.view.world.agents)if(changed.has(`${a.type}:${characterStats(a).level}`))syncCharacterHealth(a);
      this.onCharacterHealthChanged(changed);
      furnish(this.view.world);this.view.world.routesChanged=true;this.view.world.revision++;selection.draw();this.show(this.category);
    };
    this.show('rooms');view.engine.resize();
  }
  show(category:string){
    const comparison=isGraphicsGallery(this.view.world)||isArcanaGallery(this.view.world)||isTerrainComparison(this.view.world);
    if(category==='rooms'&&isGraphicsGallery(this.view.world))category='graphics-gallery';
    if(category==='rooms'&&isArcanaGallery(this.view.world))category='arcana-gallery';
    if(category==='rooms'&&isTerrainComparison(this.view.world))category='terrain-comparison';
    if(category==='rooms'&&this.view.world.lightingTest)category='lighting';
    if(category==='rooms'&&this.view.world.combatTest)category='combat';
    if(category==='rooms'&&this.lab)category='lab';
    this.category=category;this.panel.scrollTop=0;this.inspectedUnit=undefined;this.unitInspection.hidden=true;
    this.panel.setAttribute('aria-label',category==='lab'?'Room layout studio':category[0].toUpperCase()+category.slice(1));
    this.root.querySelectorAll('[data-category]').forEach(b=>{const active=(b as HTMLElement).dataset.category===(category==='lab'?'rooms':category==='harnesses'||['graphics-gallery','arcana-gallery','terrain-comparison'].includes(category)?'debug':category);b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    if(category==='help')this.panel.innerHTML='<p class="eyebrow">FIELD GUIDE</p><h2>Find your foothold.</h2><p>Explore the stone halls around your Hearthstone.</p><dl><dt>Cursor icon</dt><dd>Pickaxe: dig · minus: clear · pointer: inspect · room icon: build</dd><dt>Right click / Esc</dt><dd>Return to excavation</dd><dt>W A S D / edges</dt><dd>Pan camera</dd><dt>Left Shift + A/D</dt><dd>Orbit viewed point (also Q/E)</dd><dt>Mouse wheel</dt><dd>Zoom</dd><dt>Middle drag</dt><dd>Orbit viewed point horizontally</dd><dt>Home</dt><dd>Return to hearth</dd><dt>M</dt><dd>Show / close full map</dd></dl>';
    else if(category==='debug'){
      this.panel.innerHTML=`<p class="eyebrow">DEBUG</p><section id="debug-comparisons" class="spell-card" hidden></section><h3>Gameplay testing</h3><button id="open-harnesses" class="wide" title="Room layouts, combat, spells and other paused test worlds">Test harnesses</button><h3>Session settings</h3><label class="toggle" title="Affects the current world and retained stronghold. Placement and access rules still apply."><input id="free-rooms" type="checkbox" ${this.view.world.freeRoomBuilding?'checked':''}/> Free room construction</label><button id="open-tuning" class="wide" title="Shared tunable rules for the whole session">Game configuration</button>${this.lab?'':'<h3>Reset game</h3><button id="restart" class="wide" title="Discard the current stronghold and start a fresh game">Restart stronghold</button>'}`;
      this.panel.querySelector<HTMLInputElement>('#free-rooms')!.onchange=e=>{const value=(e.target as HTMLInputElement).checked;this.onFreeBuild(value);this.selection.draw();this.show('debug');};
      this.panel.querySelector<HTMLButtonElement>('#open-tuning')!.onclick=()=>this.tuningDialog.show();
      this.panel.querySelector<HTMLButtonElement>('#open-harnesses')!.onclick=()=>this.show('harnesses');
      const preview=document.createElement('button');preview.id='open-level-preview';preview.className='wide';preview.textContent='Level preview';preview.title='Whole levels, hidden terrain and enemy positions';preview.setAttribute('aria-haspopup','dialog');
      preview.onclick=()=>this.levelPreview.show();
      this.panel.querySelector('#debug-comparisons')!.after(preview);
      const restart=this.panel.querySelector<HTMLButtonElement>('#restart');if(restart)restart.onclick=()=>this.onRestart();
    }else if(category==='harnesses'){
      this.panel.innerHTML='<p class="eyebrow">TEST HARNESSES</p><p class="muted">Open a fresh, paused test world. Your stronghold is retained in memory. Loading another harness or layout discards the current test world.</p><button id="debug-lab" class="wide">Room layouts</button><p class="muted">Empty claimed floor for constructing rooms and checking access and capacity.</p>';
      this.panel.querySelector<HTMLButtonElement>('#debug-lab')!.onclick=()=>this.onLab(true);
    }else if(category==='lab'){
      this.panel.innerHTML=`<p class="eyebrow">ROOM LAYOUT STUDIO</p><label>Room catalog<select id="lab-room">${roomDefinitions.map(r=>`<option value="${r.id}" ${r.id===this.labType?'selected':''} ${r.implemented?'':'disabled'}>${r.name}${r.implemented?'':' · planned'}</option>`).join('')}</select></label><label>Example footprint<select id="lab-shape">${labShapes.map(s=>`<option ${s===this.labShape?'selected':''}>${s}</option>`).join('')}</select></label><div class="lab-actions"><button id="load-layout">Load layout</button><button id="reset-layout">Clear layout</button></div><p class="muted">Drag claimed squares to create or expand a room. Right-click returns to excavation; click a floor to inspect.</p><div id="room-summary"></div><div class="room-grid" role="group" aria-label="Construction tools">${constructionTools}</div>`;
      this.panel.querySelector<HTMLSelectElement>('#lab-room')!.onchange=e=>{this.labType=(e.target as HTMLSelectElement).value;this.selection.setTool(this.labType);};
      this.panel.querySelector<HTMLSelectElement>('#lab-shape')!.onchange=e=>this.labShape=(e.target as HTMLSelectElement).value;
      this.panel.querySelector<HTMLButtonElement>('#load-layout')!.onclick=()=>this.onLab(true,this.labShape,this.labType);
      this.panel.querySelector<HTMLButtonElement>('#reset-layout')!.onclick=()=>this.onLab(true,'empty',this.labType);
      const test=document.createElement('button');test.className='wide';test.textContent='Make all dwarfs tired';test.onclick=()=>{if(this.view.world.outcome)return;if(!this.view.world.agents.length)addMiners(this.view.world);for(const a of this.view.world.agents.filter(a=>!isConstruct(a.type))){a.energy=.1;a.retry=0;}this.update();};this.panel.append(test);
      const hungry=document.createElement('button');hungry.className='wide';hungry.textContent='Make all dwarfs hungry';hungry.onclick=()=>{if(this.view.world.outcome)return;if(!this.view.world.agents.length)addMiners(this.view.world);for(const a of this.view.world.agents.filter(a=>!isConstruct(a.type))){a.hunger=.1;a.retry=0;}this.update();};this.panel.append(hungry);
      const needsHelp=document.createElement('p');needsHelp.className='muted';needsHelp.textContent='Sets every dwarf to 10% energy or food. Adds Miners if empty. Build a reachable Dormitory or Kitchen, then resume simulation.';this.panel.append(needsHelp);
      const arrivals=document.createElement('label');arrivals.className='toggle';arrivals.innerHTML=`<input id="lab-arrivals" type="checkbox" ${this.view.world.recruitment?.enabled?'checked':''}> Test automatic specialist arrivals`;arrivals.title='Use normal room, bed and food requirements in this test world.';this.panel.append(arrivals);
      arrivals.querySelector<HTMLInputElement>('input')!.onchange=e=>enableRecruitment(this.view.world,(e.target as HTMLInputElement).checked);
    }else if(category==='rooms'){
      this.panel.innerHTML=`<div id="selected-action" class="selected-action" aria-live="polite"></div><div class="room-grid" role="group" aria-label="Room choices">${roomDefinitions.filter(r=>r.implemented).map(r=>`<button class="room-choice" data-room="${r.id}" aria-label="${r.name}" title="${r.name}">${actionIcon(r.id)}</button>`).join('')}</div><div class="construction-tools room-grid" role="group" aria-label="Construction tools">${constructionTools}</div><div id="room-summary" class="muted"></div>`;
      this.panel.querySelectorAll<HTMLButtonElement>('[data-room]').forEach(b=>b.onclick=()=>this.selection.setTool(b.dataset.room!));
    }else if(category==='defenses')showDefenses(this);
    else if(category==='dwarfs')showDwarfs(this);
    else if(category==='spells')showSpells(this);
    else if(category==='hearth')showHearth(this);
    else if(category==='combat')showCombatLab(this);
    else if(category==='graphics-gallery')showGraphicsGallery(this);
    else if(category==='arcana-gallery')showArcanaGallery(this);
    else if(category==='terrain-comparison')showTerrainComparison(this);
    else if(category==='lighting'&&this.view.world.lightingTest)showLightingLab(this,this.view.world.lightingTest);
    else this.panel.innerHTML=`<p class="eyebrow">${category.toUpperCase()}</p><h2>${category[0].toUpperCase()+category.slice(1)}</h2><p class="muted">No ${category} available yet.</p>`;
    this.panel.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach(b=>b.onclick=()=>this.selection.setTool(b.dataset.tool!));
    if(category==='dwarfs'){mountEconomy(this);mountMoralePanel(this);}
    if(category==='help')this.messages.mountHistory(this.panel);
    if(category==='defenses')mountEncounterPanel(this);
    if(category==='debug'&&this.view.world.encounters?.length)mountEncounterPanel(this,true);
    if(category==='harnesses'){
      const combat=document.createElement('button');combat.className='wide';combat.textContent='Combat test room';combat.onclick=()=>this.onLab(true,'combat');this.panel.append(combat);
      const lighting=document.createElement('button');lighting.className='wide';lighting.textContent='M33 lighting test room';lighting.onclick=()=>this.onLab(true,'lighting');this.panel.append(lighting);
      const spells=document.createElement('button');spells.className='wide';spells.textContent='Spell test yard';spells.onclick=()=>this.onLab(true,'spells');this.panel.append(spells);
      const yard=document.createElement('button');yard.className='wide';yard.textContent='Defense test yard';yard.onclick=()=>this.onLab(true,'defenses');this.panel.append(yard);
      const showcase=document.createElement('button');showcase.className='wide';showcase.textContent='Load visual showcase';showcase.onclick=()=>this.onLab(true,'showcase');this.panel.append(showcase);
      const guide=document.createElement('p');guide.className='muted';guide.textContent='Spell yard: prepared spells and combat targets. Defense yard: stock, doors and trap tests. Showcase: furnished rooms with residents and work queues.';this.panel.append(guide);
    }
    if(['rooms','lab','defenses'].includes(category)){
      const production=document.createElement('details');production.className='production';production.innerHTML=`<summary>Workshop production</summary><div class="room-grid" role="group" aria-label="Production recipes">${recipes.map(r=>`<button class="room-choice recipe-choice" data-recipe="${r.id}" aria-label="Queue ${r.name.toLowerCase()} · ${r.cost} gold" title="Queue ${r.name.toLowerCase()} · ${r.cost} gold · ${r.seconds}s Engineer work">${actionIcon(r.id)}<small>${r.cost} ◆</small></button>`).join('')}</div><div id="craft-orders"></div><div id="craft-outputs"></div><details><summary>Workers &amp; access</summary><div id="craft-status" class="muted"></div></details>`;this.panel.append(production);
      production.querySelectorAll<HTMLButtonElement>('[data-recipe]').forEach(b=>b.onclick=()=>{queueCraft(this.view.world,b.dataset.recipe!);this.root.querySelector('#feedback')!.textContent=recipeAllowed(this.view.world,b.dataset.recipe!)?`${recipeById(b.dataset.recipe!)!.name} queued for an Engineer.`:availabilityReason(this.view.world,'recipes',b.dataset.recipe!);this.update();});
    }
    if(['lab','debug'].includes(category)&&!comparison){
            const catalog=document.createElement('div');catalog.innerHTML=`<h3>Current world: test residents</h3><p class="muted">Adds a dwarf here for free, bypassing arrival requirements. Needs a clear claimed spawn square. Requirements below describe natural arrivals only.</p><label>Test dwarf type<select id="debug-dwarf-type">${characterDefinitions.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></label><button id="add-test-dwarf" class="wide">Add test dwarf</button><p id="debug-attraction" class="muted"></p>`;this.panel.append(catalog);
      catalog.querySelector<HTMLButtonElement>('#add-test-dwarf')!.onclick=()=>{const added=addResidents(this.view.world,catalog.querySelector<HTMLSelectElement>('select')!.value);this.root.querySelector('#feedback')!.textContent=added?'Test dwarf added.':'Cannot add dwarf: no clear claimed spawn square.';this.update();};
      if(this.lab){
        const enemies=document.createElement('section');
        enemies.innerHTML=`<label>Test enemy type<select id="debug-enemy-type">${enemyDefinitions.map(e=>`<option value="${e.id}">${e.name}</option>`).join('')}</select></label><button id="add-roster-enemy" class="wide">Add test enemy</button>`;
        enemies.querySelector<HTMLButtonElement>('button')!.onclick=()=>{const w=this.view.world,spawn=w.spellTest?.spawn??w.defenseTest?.spawn??w.tiles.find(t=>t.known&&t.terrain==='floor'&&!t.core&&Math.hypot(t.x-w.hearth.x,t.z-w.hearth.z)>6);if(spawn){addEnemy(w,spawn,w.hearth,enemies.querySelector<HTMLSelectElement>('select')!.value);this.root.querySelector('#feedback')!.textContent='Test enemy added on discovered floor.';this.update();}};
        this.panel.append(enemies);
      }
    }
    this.updateSelection();
    if(category==='spells'&&this.view.world.spellTest){
      const controls=document.createElement('div');controls.className='spell-test-controls';
      const button=(label:string,fn:()=>void)=>{const b=document.createElement('button');b.textContent=label;b.onclick=fn;controls.append(b);};
      button('Prepare test spells',()=>{prepareTestSpells(this.view.world);this.update();});
      button('Add test enemy',()=>{const w=this.view.world;addRaider(w,w.spellTest!.spawn,w.spellTest!.target);});
      button('Wound test warrior',()=>{const a=this.view.world.agents.find(a=>a.capabilities.includes('fight'));if(a){a.health=Math.max(1,health(a)-50);this.inspectedUnit={kind:'dwarf',id:a.id};this.update();}});
      button('Reset spell yard',()=>this.onLab(true,'spells'));
      this.panel.prepend(controls);
    }
    if(category==='harnesses'||category==='debug')this.onDevelopmentPanel();
    if(this.lab||category==='debug'||category==='harnesses'){
      const context=document.createElement('section');context.className='spell-card';
      context.innerHTML=comparison?`${['graphics-gallery','arcana-gallery','terrain-comparison'].includes(category)?'':'<button id="back-to-comparison" class="wide">Back to comparison</button>'}<button id="return-stronghold" class="wide">Return to stronghold</button>`:`<strong>${this.lab?'Test world':'Stronghold'} · ${this.view.world.name}</strong><p id="simulation-state" class="muted"></p><button id="toggle-simulation" class="wide"></button>${this.lab?'<button id="return-stronghold" class="wide">Return to stronghold</button>':''}`;
      const pause=context.querySelector<HTMLButtonElement>('#toggle-simulation');if(pause)pause.onclick=()=>{this.onPause(!this.isPaused());this.update();};
      const back=context.querySelector<HTMLButtonElement>('#return-stronghold');if(back)back.onclick=()=>this.onLab(false);
      const controls=context.querySelector<HTMLButtonElement>('#back-to-comparison');if(controls)controls.onclick=()=>this.show('rooms');
      if(this.lab&&category!=='harnesses'&&category!=='debug'){const choose=document.createElement('button');choose.className='wide';choose.textContent='Test harnesses';choose.onclick=()=>this.show('harnesses');context.append(choose);}
      this.panel.prepend(context);
    }
    this.panel.prepend(this.unitInspection);
    this.update();
  }
  updateSelection(){
    const id=this.selection.tool,room=roomDefinitions.find(r=>r.id===id);
    const w=this.view.world;
    const toolName=room?.name??spellDefinitions.find(s=>s.id===id)?.name??defenseById(id)?.name??({dig:'Excavate',inspect:'Inspect',wall:'Build walls',sell:'Reclaim',bridge:'Build bridges'}[id]??id);
    this.root.querySelector('#active-tool')!.textContent=toolName;
    this.root.querySelector<HTMLButtonElement>('#cancel-tool')!.hidden=id==='dig'||!!w.outcome;
    this.panel.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach(b=>{const locked=['bridge','wall'].includes(b.dataset.tool!)&&!buildingAllowed(w,b.dataset.tool!);actionAvailability(b,!w.outcome&&!locked,w.outcome?'Area ended':locked?availabilityReason(w,'buildings',b.dataset.tool!):b.dataset.tool==='bridge'?`Build bridges · ${w.freeRoomBuilding?0:bridgeSettings.cost} gold / square · Water and lava only`:b.dataset.tool==='wall'?`Build walls · ${wallBuildDuration()} seconds each`:`Sell rooms, bridges or defenses · ${Math.round(tuning.reclaimRatio*100)}% room and deck refund`);b.classList.toggle('active',b.dataset.tool===id);b.setAttribute('aria-pressed',String(b.dataset.tool===id));});
    this.root.querySelectorAll<HTMLButtonElement>('[data-room]').forEach(b=>{const selected=b.dataset.room===id,r=roomDefinitions.find(r=>r.id===b.dataset.room)!;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));const price=w.freeRoomBuilding?0:r.cost;actionAvailability(b,r.implemented&&!w.outcome&&roomAllowed(w,r.id)&&goldTotal(w)>=price,`${r.name} · ${price} gold / square · ${w.outcome?'Area ended':!r.implemented?'Deferred':!roomAllowed(w,r.id)?availabilityReason(w,'buildings',r.id):goldTotal(w)<price?'Needs more gold':r.description}`);});
    this.panel.querySelectorAll<HTMLButtonElement>('[data-recipe]').forEach(b=>{const recipe=recipeById(b.dataset.recipe!)!;actionAvailability(b,!w.outcome&&recipeAllowed(w,recipe.id),`${recipe.name} · ${recipe.cost} gold · ${availabilityReason(w,'recipes',recipe.id)||'Queue for an Engineer'}`);});
    const header=this.panel.querySelector<HTMLElement>('#selected-action');if(!header)return;
    const price=room?(this.view.world.freeRoomBuilding?0:room.cost):undefined,signature=id+':'+this.view.world.freeRoomBuilding+':'+bridgeSettings.cost+':'+bridgeSettings.seconds+':'+price+':'+room?.capacityPerTile+':'+tuning.reclaimRatio+':'+wallBuildDuration();
    if(header.dataset.selection===signature)return;header.dataset.selection=signature;
    if(id==='bridge'){header.innerHTML=actionIcon('bridge')+`<div><strong>Build bridges</strong><span class="room-price">${this.view.world.freeRoomBuilding?0:bridgeSettings.cost} gold / square · ${bridgeSettings.seconds}s work</span></div>`;return;}
    header.innerHTML=actionIcon(id)+`<div><strong>${room?.name??(id==='erase'?'Clear excavation':id==='inspect'?'Inspect':id==='wall'?'Build walls':id==='sell'?'Sell':'Excavate')}</strong>${price===undefined?(id==='wall'?`<span class="room-price">${wallBuildDuration()} seconds / wall</span>`:id==='sell'?`<span class="room-price">${Math.round(tuning.reclaimRatio*100)}% rooms/decks · Plans 100% · Defenses 0%</span>`:''):`<span class="room-price"><b>${price}</b> gold / square</span><span class="room-price">${room!.capacityPerTile} ${room!.service==='storage'?'gold storage':'dwarf capacity'} / square</span>`}</div>`;
  }
  drawMap(){
    drawMap(this.minimap,this.view.world);
    this.fullMap.update();
  }
  update(){
    const lighting=this.panel.querySelector('#lighting-status');if(lighting)lighting.textContent=`${this.view.labLighting?.activeSources??0} active sources (maximum 6) · Pointer ${this.view.labLighting?.pointerActive?'on':'off'} · Test settings only`;
    updateCombatLab(this);
    updateGraphicsGallery(this);
    updateArcanaGallery(this);
    const pause=this.panel.querySelector<HTMLButtonElement>('#toggle-simulation');if(pause)pause.textContent=this.isPaused()?'Resume simulation':'Pause simulation';
    const state=this.panel.querySelector('#simulation-state');if(state)state.textContent=this.isPaused()?'Paused · setup actions work; resume to observe behavior.':'Running';
    updateDefenses(this);
    updateEconomy(this);
    updateEncounters(this);updateHearth(this);updateMorale(this);
    this.messages.update();
    this.updateSelection();this.drawMap();const w=this.view.world;
    this.root.querySelector('.map-section .eyebrow span')!.textContent=w.name;
    this.root.querySelector('.map-caption span:last-child')!.textContent=`${w.width} × ${w.height}`;
    this.root.querySelector('#gold-total')!.textContent=String(goldTotal(w));this.root.querySelector('#dwarf-total')!.textContent=String(w.agents.length);
    const residents=updateDwarfs(this);
    const list=this.root.querySelector('#residents-list');
    if(list){const markup=residents.map(a=>{
      const stats=characterStats(a),next=nextCharacterLevel(a),progress=a.experience??0;
      const training=maxCharacterLevel(a.type)===1?'No training or leveling':next?`Next: level ${next.level}<br>Experience ${Math.min(progress,next.trainingSeconds).toFixed(1)} / ${next.trainingSeconds} XP<br>Training 1 XP/s · Combat ${tuning.combatExperienceRate}× rate on hits<br>${(a.nextTrainingAt??0)>w.elapsed?`Training cooldown · ${Math.ceil(a.nextTrainingAt!-w.elapsed)} seconds (combat still earns XP)`:`${a.job?.kind==='train'?'Training now':'Ready to train'} · One level per visit`}`:'Maximum level reached';
      if(isAnimal(a.type))return `<details class="resident-row" data-resident="${a.id}"><summary><strong>${a.name} <span class="resident-type">${characterDefinitions.find(c=>c.id===a.type)?.name}</span></strong><span class="muted">${a.activity}</span></summary><button data-locate-dwarf="${a.id}" class="wide">Locate companion</button><small>Health ${Math.ceil(health(a))} / ${maxHealth(a)}<br>Bite ${stats.damage} · Interval ${stats.attackSeconds}s<br>Rest ${Math.round(a.energy*100)}% · Fed ${Math.round(a.hunger*100)}%<br>Dormitory den supplies food and rest.<br>No wages or training.<br>${residentMoraleText(w,a)}</small></details>`;
      if(isConstruct(a.type))return `<details class="resident-row" data-resident="${a.id}"><summary><strong>${a.name} <span class="resident-type">Stonehand</span></strong><span class="muted">${a.activity}</span></summary><button data-locate-dwarf="${a.id}" class="wide">Locate worker</button><small>${a.activity}${a.carrying?` · ${a.carrying} gold`:''}<br>Health ${Math.ceil(health(a))} / ${maxHealth(a)}<br>Fragile mechanical worker · Cannot fight<br>No food, beds, wages or training.</small></details>`;
      return `<details class="resident-row" data-resident="${a.id}"><summary><strong>${a.name} <span class="resident-type">${characterDefinitions.find(c=>c.id===a.type)?.name??a.type}</span></strong><span class="muted">${a.activity}</span></summary><button data-locate-dwarf="${a.id}" class="wide">Locate worker</button><small>${a.activity}${a.carrying?` · ${a.carrying} gold`:''}<br>Level ${stats.level} / ${maxCharacterLevel(a.type)}<br>Health ${Math.ceil(health(a))} / ${maxHealth(a)}<br>Base damage ${stats.damage} · Interval ${stats.attackSeconds}s<br>Base work ${Math.round((stats.workMultiplier-1)*100)}% bonus<br>Energy ${Math.round(a.energy*100)}% · Rests ${a.rested}<br>Fed ${Math.round(a.hunger*100)}% · Meals ${a.meals}<br>${training}<br><span class="resident-pay">${residentPayText(w,a)}</span><br><span class="resident-morale">${residentMoraleText(w,a)}</span></small></details>`;
    }).join('');
    const template=document.createElement('template');template.innerHTML=markup;
    const ids=new Set(residents.map(a=>String(a.id)));
    list.querySelectorAll<HTMLElement>('[data-resident]').forEach(row=>{if(!ids.has(row.dataset.resident!))row.remove();});
    for(const fresh of Array.from(template.content.children)){
      const id=(fresh as HTMLElement).dataset.resident;
      const row=list.querySelector<HTMLElement>(`[data-resident="${id}"]`);
      if(!row){list.append(fresh);continue;}
      for(const selector of ['summary','small']){
        const current=row.querySelector(selector)!,next=fresh.querySelector(selector)!;
        if(current.innerHTML!==next.innerHTML)current.innerHTML=next.innerHTML;
      }
    }}
    list?.querySelectorAll<HTMLButtonElement>('[data-locate-dwarf]').forEach(b=>b.onclick=()=>{const a=w.agents.find(a=>a.id===Number(b.dataset.locateDwarf));if(a){this.controls.center(a.x,a.z);this.inspectedUnit={kind:'dwarf',id:a.id};this.update();this.unitInspection.scrollIntoView({block:'nearest'});}});
    const arrivals=this.panel.querySelector('#arrival-status');if(arrivals)arrivals.innerHTML=`<p>${recruitmentSummary(w)}</p><p>Hounds provide early defense. Supported Warriors take a larger share of later arrivals; support staff follow queued work.</p>${characterDefinitions.filter(c=>c.recruitment).map(c=>`<p><b>${c.name} · ${w.agents.filter(a=>a.type===c.id).length}</b> · ${c.recruitment!.seconds}s cooldown<br>${attractionStatus(w,c.id)}</p>`).join('')}`;
    const summary=this.root.querySelector('#room-summary');if(summary){
      const p=this.selection.selected??(this.lab?w.tiles.find(t=>t.room===this.selection.tool):undefined);
      summary.textContent='';
      if(p&&tileAt(w,p.x,p.z)?.core){const chest=w.roomServices.find(f=>f.id==='hearth-treasury');summary.textContent=chest?`Hearth treasury · ${chest.stored} / ${chest.capacity} gold`:'';}
      else if(p){
        const remnant=tileAt(w,p.x,p.z);if(remnant)summary.textContent=ruinStatus(w,remnant)??'';
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
          if(room.service==='training')summary.textContent+=`Specialists gain one level per visit, then wait ${tuning.trainingInterval} seconds before training again. `;
          if(room.service==='research')summary.textContent+='Choose research in the Spells panel. ';
          summary.textContent+='Furniture is decorative.';
        }
      }
    }
    const attraction=this.panel.querySelector('#debug-attraction');if(attraction)attraction.textContent=attractionStatus(w,this.panel.querySelector<HTMLSelectElement>('#debug-dwarf-type')!.value);
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
    if(unit&&!inspection.hidden){
      const stats=dwarf&&characterStats(dwarf);
      inspection.querySelector('#unit-inspection-text')!.textContent=`${dwarf?dwarf.name:enemyById(enemy?.type).name} · Health ${Math.ceil(dwarf?health(dwarf):enemy!.health)} / ${dwarf?maxHealth(dwarf):enemy!.maxHealth??enemyById(enemy?.type).health}${dwarf&&isConstruct(dwarf.type)?'\nStonehand · Fragile worker · No living expenses':stats?`\nLevel ${stats.level} / ${maxCharacterLevel(dwarf!.type)} · Base damage ${stats.damage} every ${stats.attackSeconds}s · Base work ${Math.round((stats.workMultiplier-1)*100)}% bonus`:''}\n${unit.activity}${enemy?'\n'+enemyById(enemy.type).description:''}\n${(unit.effects??[]).filter(e=>e.until>w.elapsed).map(e=>`${spellDefinitions.find(s=>s.id===e.id)?.name??effectLabels[e.id]??e.id} · ${Math.ceil(e.until-w.elapsed)}s${e.kind==='shield'?' · '+Math.ceil(e.remaining??0)+' shield':''}`).join('\n')}`;
    }
    this.refreshActionHelp();
  }
}
