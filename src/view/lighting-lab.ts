import {
  PointLight,
  Vector3,
  Color3,
  type AbstractMesh,
  type HemisphericLight,
  type StandardMaterial,
  type Light,
} from '@babylonjs/core';
import type { GameScene } from './scene';
import {
  lightingSources,
  lightReaches,
  lightingBudget,
  type LightSource,
  type LightingSettings,
} from '../content/lighting';
import { environmentPalette } from '../content/environment-visuals';
import { tileAt } from '../game/types';

// Babylon resynchronizes every scene mesh on every setEnabled call, even if unchanged.
function enableLight(light: Light, enabled: boolean) {
  if (light.isEnabled() !== enabled) light.setEnabled(enabled);
}

/** Shared bounded illumination for normal play and the adjustable M33 comparison harness. */
export class LabLighting {
  sources: PointLight[] = [];
  pointer: PointLight;
  cursor?: { x: number; y: number };
  pointerActive = false;
  activeSources = 0;
  private sky;
  private rim;
  private hearth;
  private original;
  private materials = new Map<StandardMaterial, number>();
  private maskRevision = -1;
  private geometry: Array<{ mesh: AbstractMesh; x: number; z: number }> = [];
  private lastMasks = -Infinity;
  private maskKey = '';
  private sourceRevision = -1;
  private visibleSources: LightSource[] = [];
  private pickKey = '';
  private hovered = false;
  private move = (e: PointerEvent) => {
    this.cursor = e.target === this.view.canvas ? { x: e.clientX, y: e.clientY } : undefined;
  };
  private leave = () => {
    this.cursor = undefined;
    enableLight(this.pointer, false);
    this.pointerActive = false;
  };
  constructor(private view: GameScene) {
    const scene = view.scene;
    this.sky = scene.getLightByName('cavern light') as HemisphericLight;
    this.rim = scene.getLightByName('warm rim')!;
    this.hearth = scene.getLightByName('hearth light')!;
    this.original = {
      ambient: this.sky.intensity,
      rim: this.rim.intensity,
      glow: view.glow.intensity,
      skyColor: this.sky.diffuse.clone(),
    };
    for (let i = 0; i < lightingBudget.sources; i++) {
      const light = new PointLight(`M33 source ${i}`, Vector3.Zero(), scene);
      light.renderPriority = 10 - i;
      light.setEnabled(false);
      this.sources.push(light);
    }
    this.pointer = new PointLight('M33 pointer', Vector3.Zero(), scene);
    this.pointer.diffuse = Color3.FromHexString('#d9e6ec');
    this.pointer.renderPriority = 20;
    this.pointer.setEnabled(false);
    window.addEventListener('pointermove', this.move);
    window.addEventListener('blur', this.leave);
    document.addEventListener('pointerleave', this.leave);
  }
  update(settings: LightingSettings) {
    if (!settings.enabled) {
      this.restore();
      return;
    }
    const v = this.view,
      w = v.world;
    this.sky.intensity = settings.ambient;
    this.sky.diffuse = Color3.FromHexString(environmentPalette(w).sky);
    this.rim.intensity = settings.rim;
    this.rim.diffuse = Color3.FromHexString(environmentPalette(w).rim);
    enableLight(this.hearth, false);
    v.glow.intensity = settings.glow;
    for (const m of v.materials.values())
      if (!this.materials.has(m)) {
        this.materials.set(m, m.maxSimultaneousLights);
        m.maxSimultaneousLights = lightingBudget.materialLights;
      }
    const target = v.camera.target;
    if (this.sourceRevision !== w.revision) {
      this.visibleSources = lightingSources(w);
      this.sourceRevision = w.revision;
    }
    const candidates = this.visibleSources
      .filter(
        (s) => Math.hypot(s.x - target.x, s.z - target.z) < v.camera.radius * 0.8 + settings.sourceRadius,
      )
      .sort((a, b) => Math.hypot(a.x - target.x, a.z - target.z) - Math.hypot(b.x - target.x, b.z - target.z))
      .slice(0, lightingBudget.sources);
    const sourceKey = candidates.map((s) => s.id).join('|') + ':' + settings.sourceRadius;
    this.activeSources = settings.sourceStrength > 0 ? candidates.length : 0;
    for (let i = 0; i < this.sources.length; i++) {
      const light = this.sources[i],
        source = candidates[i];
      enableLight(light, !!source && settings.sourceStrength > 0 && light.includedOnlyMeshes.length > 0);
      if (!source) continue;
      light.position.set(source.x, source.y, source.z);
      light.diffuse = Color3.FromHexString(source.color);
      light.intensity = settings.sourceStrength;
      light.range = settings.sourceRadius;
    }
    // Pick again each frame, so a stationary pointer follows camera pan, orbit and zoom.
    this.pointerActive = false;
    if (
      settings.pointer &&
      this.cursor &&
      !document.querySelector('dialog[open]') &&
      document.elementFromPoint(this.cursor.x, this.cursor.y) === v.canvas
    ) {
      const bounds = v.canvas.getBoundingClientRect();
      const pickKey = [
        this.cursor.x,
        this.cursor.y,
        target.x,
        target.z,
        v.camera.alpha,
        v.camera.beta,
        v.camera.radius,
        bounds.width,
        bounds.height,
        v.geometryRevision,
      ].join(':');
      if (pickKey !== this.pickKey) {
        this.pickKey = pickKey;
        this.hovered = false;
        const hit = v.scene.pick(
          this.cursor.x - bounds.left,
          this.cursor.y - bounds.top,
          (m) => !!m.metadata?.tile,
        );
        const p = hit?.pickedPoint,
          t = hit?.pickedMesh?.metadata?.tile;
        if (p && t && tileAt(w, t.x, t.z)?.known) {
          this.pointer.position.set(p.x, p.y + 1.1, p.z);
          this.hovered = true;
        }
      }
      this.pointerActive = this.hovered;
    }
    enableLight(this.pointer, this.pointerActive && this.pointer.includedOnlyMeshes.length > 0);
    this.pointer.intensity = settings.pointerStrength;
    this.pointer.range = settings.pointerRadius;
    const revisionChanged = this.maskRevision !== v.geometryRevision;
    if (revisionChanged) {
      this.geometry = [];
      for (const [key, entry] of v.tileNodes) {
        const [x, z] = key.split(',').map(Number);
        if (!tileAt(w, x, z)?.known) continue;
        for (const mesh of entry.node.getChildMeshes()) this.geometry.push({ mesh, x, z });
      }
      for (const entry of v.furnitureNodes.values())
        for (const mesh of entry.node.getChildMeshes()) {
          mesh.computeWorldMatrix(true);
          const p = mesh.getBoundingInfo().boundingBox.centerWorld;
          this.geometry.push({ mesh, x: p.x, z: p.z });
        }
      // Hearth geometry is parented directly to the terrain root.
      for (const mesh of v.terrainRoot.getChildMeshes(true)) {
        const p = mesh.getAbsolutePosition();
        if (tileAt(w, Math.round(p.x), Math.round(p.z))?.core) this.geometry.push({ mesh, x: p.x, z: p.z });
      }
      this.maskRevision = v.geometryRevision;
    }
    const now = performance.now(),
      pointerKey = this.pointerActive
        ? `${Math.round(this.pointer.position.x * 4)},${Math.round(this.pointer.position.z * 4)},${settings.pointerRadius}`
        : 'off';
    if (
      revisionChanged ||
      this.maskKey !== sourceKey + pointerKey ||
      now - this.lastMasks > lightingBudget.actorMaskMilliseconds
    ) {
      this.maskKey = sourceKey + pointerKey;
      this.lastMasks = now;
      const actors: Array<{ mesh: AbstractMesh; x: number; z: number }> = [];
      const actorNames = new Set([
        ...w.agents.flatMap((a) => [`dwarf-${a.id}`, `hound-${a.id}`, `stonehand-${a.id}`]),
        ...(w.enemies ?? []).map((e) => `${e.type ?? 'goblin-raider'} ${e.id}`),
      ]);
      for (const root of v.scene.transformNodes)
        if (actorNames.has(root.name) && root.parent === null) {
          const p = root.getAbsolutePosition();
          for (const mesh of root.getChildMeshes()) actors.push({ mesh, x: p.x, z: p.z });
        }
      const meshes = [...this.geometry, ...actors].filter((e) => !e.mesh.isDisposed());
      for (const [index, light] of [...this.sources, this.pointer].entries()) {
        const wanted =
          index === this.sources.length
            ? this.pointerActive
            : !!candidates[index] && settings.sourceStrength > 0;
        if (!wanted) {
          enableLight(light, false);
          continue;
        }
        const from = { x: light.position.x, z: light.position.z };
        const included = meshes
          .filter((e) => Math.hypot(e.x - from.x, e.z - from.z) <= light.range && lightReaches(w, from, e))
          .map((e) => e.mesh);
        if (
          included.length !== light.includedOnlyMeshes.length ||
          included.some((mesh, i) => mesh !== light.includedOnlyMeshes[i])
        )
          light.includedOnlyMeshes = included;
        // Babylon treats an empty inclusion list as all meshes; disable empty lights.
        enableLight(light, light.includedOnlyMeshes.length > 0);
      }
    }
    this.activeSources = this.sources.filter((light) => light.isEnabled()).length;
    this.pointerActive = this.pointer.isEnabled();
  }
  private restore() {
    this.sky.intensity = this.original.ambient;
    this.sky.diffuse = this.original.skyColor;
    this.rim.intensity = this.original.rim;
    this.rim.diffuse = Color3.FromHexString('#ffe2b4');
    enableLight(this.hearth, true);
    this.view.glow.intensity = this.original.glow;
    for (const light of [...this.sources, this.pointer]) enableLight(light, false);
    this.pointerActive = false;
    this.activeSources = 0;
  }
  dispose() {
    this.restore();
    for (const light of [...this.sources, this.pointer]) light.dispose();
    for (const [material, count] of this.materials) material.maxSimultaneousLights = count;
    window.removeEventListener('pointermove', this.move);
    window.removeEventListener('blur', this.leave);
    document.removeEventListener('pointerleave', this.leave);
  }
}
