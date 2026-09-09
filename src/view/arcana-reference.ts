import { Color3, StandardMaterial, MeshBuilder, DynamicTexture, TransformNode } from '@babylonjs/core';
import type { GameScene } from './scene';
import { surfaceTexture } from './arcana-surfaces-baseline';
import { applyTerrainMaterial, resetArcanaMaterialAssets } from './arcana-terrain-materials-baseline';
import { crystalMesh } from './arcana-environment-baseline';

// Frozen material/primitive policy at the start of the spells, traps and Hearths pass.
class StartingPrimitives {
  material(name: string, color: string, texture = false, emissive = 0) {
    if (this.materials.has(name)) return this.materials.get(name)!;
    const m = new StandardMaterial(name, this.scene);
    m.diffuseColor = Color3.FromHexString(color);
    m.specularColor = new Color3(0.08, 0.08, 0.08);
    m.emissiveColor = Color3.FromHexString(color).scale(emissive);
    const painted = texture && applyTerrainMaterial(this.scene, m, name);
    if (texture && !painted) m.diffuseTexture = surfaceTexture(this.scene, name);
    if (name === 'lava') m.emissiveTexture = m.diffuseTexture;
    if (texture && !painted && /^(ruin-)?floor-/.test(name)) m.diffuseColor = Color3.White();
    if (painted) {
      m.specularColor.set(0.035, 0.035, 0.035);
      m.diffuseColor = m.diffuseColor.scale(1.4);
    }
    if (/metal|iron|brass|gold|steel/.test(name)) {
      m.specularColor = new Color3(0.42, 0.35, 0.23);
      m.specularPower = 48;
    }
    if (name === 'water') {
      m.specularColor = new Color3(0.45, 0.6, 0.65);
      m.specularPower = 80;
    }
    this.materials.set(name, m);
    return m;
  }
  box(
    name: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    mat: StandardMaterial,
    parent: TransformNode = this.terrainRoot,
  ) {
    const m = MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, this.scene);
    m.position.set(x, y, z);
    m.material = mat;
    m.parent = parent;
    if (mat.emissiveColor.r + mat.emissiveColor.g + mat.emissiveColor.b > 0.3) this.includeGlow(m);
    return m;
  }
  shadow(x: number, z: number, width: number, depth: number, parent: TransformNode) {
    let mat = this.materials.get('contact shadow');
    if (!mat) {
      mat = this.material('contact shadow', '#000000');
      mat.disableLighting = true;
      mat.alpha = 0.44;
      const tex = new DynamicTexture('soft contact', { width: 64, height: 64 }, this.scene, false),
        c = tex.getContext();
      const gradient = c.createRadialGradient(32, 32, 3, 32, 32, 32);
      gradient.addColorStop(0, '#000000ff');
      gradient.addColorStop(1, '#00000000');
      c.fillStyle = gradient;
      c.fillRect(0, 0, 64, 64);
      tex.hasAlpha = true;
      tex.update();
      mat.diffuseTexture = tex;
      mat.useAlphaFromDiffuseTexture = true;
    }
    const m = MeshBuilder.CreateGround('contact shadow', { width, height: depth }, this.scene);
    m.position.set(x, 0.025, z);
    m.material = mat;
    m.parent = parent;
    m.isPickable = false;
    return m;
  }
}
interface StartingPrimitives extends GameScene {}
export function arcanaStartingView(view: GameScene): GameScene {
  const proxy = Object.create(view) as GameScene;
  proxy.materials = new Map();
  proxy.material = (name, color, texture = false, emissive = 0) => {
    const mat = StartingPrimitives.prototype.material.call(proxy, name, color, texture, emissive);
    mat.name = `arcana baseline ${name}`;
    return mat;
  };
  proxy.box = StartingPrimitives.prototype.box.bind(proxy);
  proxy.shadow = StartingPrimitives.prototype.shadow.bind(proxy);
  proxy.crystal = (x, y, z, size, color, parent = proxy.terrainRoot) =>
    crystalMesh(proxy, x, y, z, size, color, parent);
  return proxy;
}
export function disposeArcanaStartingView(view: GameScene) {
  for (const m of view.materials.values()) m.dispose(false, true);
  view.materials.clear();
  resetArcanaMaterialAssets(view.scene);
}
