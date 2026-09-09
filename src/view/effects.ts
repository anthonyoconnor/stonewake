import { reducedMotion } from '../content/presentation';
import { MeshBuilder, Vector3, Color3, type Mesh, type PointLight, type Texture } from '@babylonjs/core';
import type { GameScene } from './scene';

type Particle = {
  mesh: Mesh;
  velocity: Vector3;
  life: number;
  duration: number;
  size: number;
  gravity: number;
};
export class SceneEffects {
  particles: Particle[] = [];
  beats = new Map<number, number>();
  lastTime = 0;
  lastSteam = 0;
  reduced = reducedMotion();
  constructor(public view: GameScene) {}
  reset() {
    for (const p of this.particles) p.mesh.dispose();
    this.particles = [];
    this.beats.clear();
    this.lastTime = 0;
    this.lastSteam = 0;
  }
  emit(x: number, y: number, z: number, kind: 'dust' | 'spark' | 'steam' | 'research', count: number) {
    for (let i = 0; i < count; i++) {
      let p = this.particles.find((p) => p.life <= 0);
      if (!p) {
        if (this.particles.length >= 80) return;
        const mesh = MeshBuilder.CreateSphere(
          'activity particle',
          { diameter: 1, segments: 4 },
          this.view.scene,
        );
        mesh.isPickable = false;
        this.view.includeGlow(mesh);
        p = { mesh, velocity: new Vector3(), life: 0, duration: 1, size: 1, gravity: 0 };
        this.particles.push(p);
      }
      const spark = kind === 'spark',
        steam = kind === 'steam',
        research = kind === 'research',
        rising = steam || research;
      p.duration = steam ? 1.5 : research ? 1.1 : spark ? 0.45 : 0.65;
      p.life = p.duration;
      p.size = steam ? 0.11 : research ? 0.025 : spark ? 0.035 : 0.065;
      p.gravity = rising ? 0 : 3;
      p.mesh.material = this.view.material(
        `effect-${kind}`,
        steam ? '#b8c2bb' : research ? '#73bfd6' : spark ? '#ffc276' : '#947f60',
        false,
        spark || research ? 1 : 0,
      );
      p.mesh.position.set(x, y, z);
      p.mesh.setEnabled(true);
      p.velocity.set(
        (Math.random() - 0.5) * (rising ? 0.15 : 1.3),
        rising ? 0.3 : 0.6 + Math.random() * 0.8,
        (Math.random() - 0.5) * (rising ? 0.15 : 1.3),
      );
    }
  }
  update() {
    this.reduced = reducedMotion();
    const w = this.view.world,
      time = w.elapsed,
      dt = Math.min(0.1, Math.max(0, time - this.lastTime));
    this.lastTime = time;
    const pulse = this.reduced ? 1 : 1 + Math.sin(time * 1.8) * 0.07;
    const integrity = w.hearthState ? w.hearthState.health / w.hearthState.maxHealth : 1;
    const light = this.view.scene.getLightByName('hearth light') as PointLight;
    light.intensity = 1.35 * pulse * integrity;
    const rune = this.view.materials.get('rune');
    if (rune) rune.emissiveColor = Color3.FromHexString('#86ebf5').scale(0.65 * pulse * integrity);
    for (const color of ['#7fdef0', '#579bd0', '#86e5d7']) {
      const crystal = this.view.materials.get(color);
      if (crystal) {
        crystal.emissiveColor = Color3.FromHexString(color).scale(0.58 * integrity);
        crystal.diffuseColor = Color3.FromHexString(color).scale(0.25 + 0.75 * integrity);
      }
    }
    const flame = this.view.materials.get('lantern flame');
    if (flame)
      flame.emissiveColor = Color3.FromHexString('#ffc779').scale(
        this.reduced ? 0.85 : 0.8 + Math.sin(time * 8) * 0.05 + Math.sin(time * 13) * 0.025,
      );
    for (const kind of ['water', 'lava']) {
      const material = this.view.materials.get(kind),
        texture = material?.diffuseTexture as Texture | undefined;
      if (texture) {
        texture.uOffset = this.reduced ? 0 : Math.sin(time * 0.11) * (kind === 'water' ? 0.028 : 0.008);
        texture.vOffset = this.reduced ? 0 : Math.sin(time * 0.07) * 0.018;
      }
      if (material && kind === 'lava')
        material.emissiveColor = Color3.FromHexString('#df5423').scale(
          this.reduced ? 1.25 : 1.24 + Math.sin(time * 0.8) * 0.025,
        );
    }
    if (this.reduced)
      for (const p of this.particles) {
        p.life = 0;
        p.mesh.setEnabled(false);
      }
    if (!this.reduced) {
      for (const a of w.agents) {
        const j = a.job;
        if (!j || a.path.length || !['mine', 'craft', 'claim', 'train', 'research'].includes(j.kind)) {
          this.beats.delete(a.id);
          continue;
        }
        const beat = Math.floor(j.progress * (j.kind === 'research' ? 0.7 : 2));
        if (this.beats.get(a.id) === beat) continue;
        this.beats.set(a.id, beat);
        const dx = j.work.x - j.target.x,
          dz = j.work.z - j.target.z;
        if (j.kind === 'research') this.emit(a.x - dx * 0.3, 0.78, a.z - dz * 0.3, 'research', 1);
        else if (j.kind === 'train') this.emit(a.x, 0.05, a.z, 'dust', 1);
        else
          this.emit(
            j.target.x + dx * 0.56,
            j.kind === 'mine' ? 0.76 : j.kind === 'craft' ? 0.68 : 0.08,
            j.target.z + dz * 0.56,
            j.kind === 'craft' ? 'spark' : 'dust',
            j.kind === 'claim' ? 2 : 4,
          );
      }
      if (time - this.lastSteam > 0.8) {
        this.lastSteam = time;
        for (const f of w.furnishings)
          if ((f.model ?? f.kind) === 'stove') this.emit(f.x, 0.8, f.z, 'steam', 1);
      }
    }
    for (const p of this.particles)
      if (p.life > 0) {
        p.life -= dt;
        if (p.life <= 0) {
          p.mesh.setEnabled(false);
          continue;
        }
        p.velocity.y -= p.gravity * dt;
        p.mesh.position.addInPlace(p.velocity.scale(dt));
        p.mesh.rotation.x += dt * 2;
        p.mesh.scaling.setAll(p.size * (1 + (1 - p.life / p.duration) * 0.6));
        p.mesh.visibility = Math.min(1, (p.life / p.duration) * 2);
      }
  }
}
