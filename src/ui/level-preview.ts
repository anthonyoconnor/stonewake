import { playableLevels } from '../content/playable-levels';
import { enemyById } from '../content/enemies';
import { createWorld } from '../game/world';
import type { World, Point } from '../game/types';
import type { GameScene } from '../view/scene';
import type { CameraControls } from '../view/controls';
import { drawMap } from './map';
import './level-preview.css';

/** Read-only map inspection. Revealing pixels never discovers gameplay tiles. */
export class LevelPreview {
  element = document.createElement('dialog');
  onLoadLevel: (id: string) => void = () => {};
  private canvas = document.createElement('canvas');
  private select: HTMLSelectElement;
  private world?: World;
  private selected?: Point;

  constructor(private view: GameScene, private controls: CameraControls) {
    this.element.id = 'level-preview-dialog';
    this.element.setAttribute('aria-label', 'Level preview');
    this.element.innerHTML = `<header><h2>Level preview</h2><button aria-label="Close level preview" title="Close (Escape)">×</button></header>
      <div class="level-preview-layout"><section class="level-preview-controls">
        <label>Level<select id="preview-level"><option value="current">Current world</option></select></label>
        <p id="preview-summary"></p>
        <button id="preview-load-level" class="wide">Load full level</button>
        <p class="muted">Opens a paused 3D test world with fog off. Your stronghold is retained.</p>
        <p class="muted">Fog off · Simulation paused</p>
        <div class="preview-legend"><span class="preview-enemy">●</span> Enemy<br><span class="preview-source">○</span> Encounter source<br><span class="preview-hearth">◆</span> Hearthstones<br><span class="preview-resident">■</span> Resident</div>
        <p class="muted">Select an enemy or click the map to inspect a position.</p>
        <p id="preview-position" role="status"></p>
        <details><summary id="preview-enemy-count">Enemies</summary><div id="preview-enemies"></div></details>
      </section><div class="level-preview-map"></div></div>`;
    this.select = this.element.querySelector<HTMLSelectElement>('#preview-level')!;
    for (const [label, campaign] of [['Campaign', true], ['Free Play prototypes', false]] as const) {
      const group = document.createElement('optgroup');
      group.label = label;
      for (const entry of playableLevels.filter(l => l.id.startsWith('campaign-') === campaign)) {
        group.append(new Option(entry.name, entry.id));
      }
      this.select.append(group);
    }
    this.canvas.id = 'level-preview-map';
    this.canvas.setAttribute('aria-label', 'Whole level with fog disabled and enemy positions');
    this.element.querySelector('.level-preview-map')!.append(this.canvas);
    document.body.append(this.element);
    this.select.onchange = () => this.load();
    this.element.querySelector('#preview-load-level')!.addEventListener('click', () => this.onLoadLevel(this.select.value));
    this.element.querySelector('header button')!.addEventListener('click', () => this.element.close());
    this.element.addEventListener('keydown', e => e.stopPropagation());
    this.element.addEventListener('close', () => {
      this.world = undefined;
      this.controls.keys.clear();
      this.controls.pointer = undefined;
    });
    this.canvas.onclick = e => {
      if (!this.world) return;
      const r = this.canvas.getBoundingClientRect();
      this.inspect({ x: Math.floor((e.clientX - r.left) / r.width * this.world.width), z: Math.floor((e.clientY - r.top) / r.height * this.world.height) });
    };
    window.addEventListener('resize', () => this.draw());
  }

  show() {
    this.controls.keys.clear();
    this.controls.pointer = undefined;
    this.controls.drag = undefined;
    this.select.value = 'current';
    this.element.showModal();
    this.load();
  }

  private load() {
    // Fresh authored previews never replace, tick or reveal the retained world.
    this.world = this.select.value === 'current' ? this.view.world : createWorld(playableLevels.find(l => l.id === this.select.value)!.level);
    this.selected = undefined;
    const w = this.world;
    this.element.querySelector('#preview-summary')!.textContent = `${w.name} · ${w.width} × ${w.height}${this.select.value === 'current' ? ' · Current state' : ' · Starting layout'}`;
    this.element.querySelector('#preview-position')!.textContent = '';
    const enemies = (w.enemies ?? []).filter(e => e.health > 0);
    this.element.querySelector('#preview-enemy-count')!.textContent = `Enemies (${enemies.length})`;
    const list = this.element.querySelector('#preview-enemies')!;
    list.replaceChildren();
    for (const enemy of enemies) {
      const button = document.createElement('button');
      button.textContent = `${enemyById(enemy.type).name} · ${enemy.x.toFixed(1)}, ${enemy.z.toFixed(1)}`;
      button.onclick = () => this.inspect(enemy);
      list.append(button);
    }
    this.draw();
  }

  private inspect(p: Point) {
    const w = this.world!;
    this.selected = { x: p.x, z: p.z };
    const x = Math.round(p.x), z = Math.round(p.z);
    const tile = w.tiles.find(t => t.x === x && t.z === z);
    const enemies = (w.enemies ?? []).filter(e => e.health > 0 && Math.round(e.x) === x && Math.round(e.z) === z);
    const sources = (w.encounters ?? []).filter(s => s.definition.positions.some(p => p.x === x && p.z === z));
    this.element.querySelector('#preview-position')!.textContent = [
      `${x}, ${z} · ${tile?.terrain ?? 'Outside map'}`,
      ...enemies.map(e => `${enemyById(e.type).name} · ${e.activity}`),
      ...sources.map(s => `${s.definition.name} · ${s.phase}`),
      tile?.core ? 'Stone Hearth' : tile?.onward ? 'Onward Hearthstone' : '',
    ].filter(Boolean).join(' — ');
    this.draw();
  }

  private draw() {
    if (!this.element.open || !this.world) return;
    const w = this.world;
    const holder = this.canvas.parentElement!;
    const scale = Math.min(holder.clientWidth / w.width, holder.clientHeight / w.height);
    this.canvas.width = Math.max(1, Math.floor(w.width * scale));
    this.canvas.height = Math.max(1, Math.floor(w.height * scale));
    drawMap(this.canvas, w, true);
    const c = this.canvas.getContext('2d')!;
    const sx = this.canvas.width / w.width, sz = this.canvas.height / w.height;
    const radius = Math.max(3, Math.min(sx, sz) * .32);
    const circle = (p: Point, color: string, filled: boolean, r = radius) => {
      c.beginPath(); c.arc((p.x + .5) * sx, (p.z + .5) * sz, r, 0, Math.PI * 2);
      c.fillStyle = color; c.strokeStyle = filled ? '#211419' : color; c.lineWidth = 1.5;
      if (filled) c.fill();
      c.stroke();
    };
    for (const source of w.encounters ?? []) if (source.phase !== 'cleared') {
      for (const p of source.definition.positions) circle(p, '#ffbf70', false, radius + 2);
    }
    for (const p of [w.hearth, ...(w.onwardHearth ? [w.onwardHearth] : [])]) {
      const x = (p.x + .5) * sx, z = (p.z + .5) * sz, r = radius + 2;
      c.beginPath(); c.moveTo(x, z - r); c.lineTo(x + r, z); c.lineTo(x, z + r); c.lineTo(x - r, z); c.closePath();
      c.fillStyle = '#8de3e5'; c.fill(); c.strokeStyle = '#14262e'; c.stroke();
    }
    for (const e of w.enemies ?? []) if (e.health > 0) circle(e, '#ff5964', true);
    if (this.selected) circle(this.selected, '#ffffff', false, radius + 5);
  }
}
