import { Matrix } from '@babylonjs/core';
import type { GameScene } from '../view/scene';
import type { CameraControls } from '../view/controls';
const glyphs:Record<string,string>={rooms:'▦',defenses:'♜',spells:'✧',dwarfs:'♟',dig:'⚒',home:'⌂',debug:'⌘'};
export class Sidebar {
  root:HTMLElement; panel:HTMLElement; minimap:HTMLCanvasElement; category='rooms';
  constructor(public view:GameScene,public controls:CameraControls) {
    this.root=document.createElement('aside');this.root.id='sidebar';this.root.setAttribute('aria-label','Stronghold controls');
    this.root.innerHTML=`
      <header class="brand"><span class="crest">◇</span><div><h1>STONEWAKE</h1><p>RECLAIM THE DEEP</p></div></header>
      <section class="map-section"><div class="eyebrow"><span>${view.world.name}</span><span class="live-dot"></span></div><canvas id="minimap" width="240" height="170" aria-label="Minimap: click to move camera"></canvas><div class="map-caption"><span>THE UPPER WORKINGS</span><span>48 × 48</span></div></section>
      <div class="reserves"><div><span class="gold-symbol">◆</span><strong id="gold-total">0</strong><small>GOLD</small></div><div><span>♟</span><strong id="dwarf-total">0</strong><small>DWARFS</small></div></div>
      <nav class="categories" aria-label="Stronghold panels">${['rooms','defenses','spells','dwarfs'].map(id=>`<button data-category="${id}" aria-label="${id[0].toUpperCase()+id.slice(1)}" title="${id}"><span>${glyphs[id]}</span><small>${id}</small></button>`).join('')}</nav>
      <div id="panel" class="panel"></div>
      <div class="camera-tools"><button data-camera="left" aria-label="Rotate left">↶</button><button data-camera="home" aria-label="Return to Hearthstone">⌂</button><button data-camera="right" aria-label="Rotate right">↷</button><button data-camera="in" aria-label="Zoom in">＋</button><button data-camera="out" aria-label="Zoom out">−</button></div>
      <footer><button id="help" aria-label="Help">?</button><span>THE HEARTH IS ALIGHT</span><span class="live-dot"></span></footer>`;
    document.querySelector('#app')!.prepend(this.root);
    this.panel=this.root.querySelector('#panel')!;this.minimap=this.root.querySelector('#minimap')!;
    this.root.querySelectorAll<HTMLButtonElement>('[data-category]').forEach(b=>b.onclick=()=>this.show(b.dataset.category!));
    this.root.querySelectorAll<HTMLButtonElement>('[data-camera]').forEach(b=>b.onclick=()=>{
      switch(b.dataset.camera){case'left':controls.rotate(-Math.PI/8);break;case'right':controls.rotate(Math.PI/8);break;case'home':controls.home();break;case'in':controls.zoom(.8);break;case'out':controls.zoom(1.25);}
    });
    this.root.querySelector<HTMLButtonElement>('#help')!.onclick=()=>this.show('help');
    this.minimap.onclick=e=>{const r=this.minimap.getBoundingClientRect();controls.center((e.clientX-r.left)/r.width*view.world.width,(e.clientY-r.top)/r.height*view.world.height);};
    this.show('rooms');view.engine.resize();
  }
  show(category:string){
    this.category=category;
    this.root.querySelectorAll('[data-category]').forEach(b=>b.classList.toggle('active',(b as HTMLElement).dataset.category===category));
    if(category==='help')this.panel.innerHTML='<p class="eyebrow">FIELD GUIDE</p><h2>Find your foothold.</h2><p>Explore the stone halls around your Hearthstone.</p><dl><dt>W A S D</dt><dd>Move camera</dd><dt>Q / E</dt><dd>Rotate view</dd><dt>Mouse wheel</dt><dd>Zoom</dd><dt>Middle drag</dt><dd>Pan</dd><dt>Home</dt><dd>Return to hearth</dd></dl>';
    else this.panel.innerHTML=`<p class="eyebrow">${category.toUpperCase()}</p><h2>${category==='rooms'?'A home beneath the mountain.':category[0].toUpperCase()+category.slice(1)}</h2><p class="muted">${category==='rooms'?'The first halls await your mark.':`No ${category} available yet.`}</p><div class="empty-slots"><span></span><span></span><span></span></div>`;
  }
  drawMap(){
    const c=this.minimap.getContext('2d')!,w=this.view.world,sx=this.minimap.width/w.width,sz=this.minimap.height/w.height;
    c.fillStyle='#0c1319';c.fillRect(0,0,240,170);
    const color:Record<string,string>={dirt:'#6f5a43',rock:'#91938a',bedrock:'#3c4d55',gold:'#dba949',gem:'#857ab9',floor:'#8b8067'};
    for(const t of w.tiles)if(t.known){c.fillStyle=t.core?'#8de3e5':color[t.terrain];c.fillRect(t.x*sx,t.z*sz,sx+.4,sz+.4);}
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
  update(){this.drawMap();}
}
