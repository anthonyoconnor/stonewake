import {
  Color3,
  DirectionalLight,
  MeshBuilder,
  TransformNode,
  Vector3,
  type HemisphericLight,
  type StandardMaterial,
  type Observer,
  type Scene,
} from '@babylonjs/core';
import { graphicsGalleryEntries, isGraphicsGallery } from '../content/graphics-gallery';
import type { Enemy, World } from '../game/types';
import { ResidentView } from './residents';
import { ResidentView as OriginalResidents } from './residents-baseline';
import { EnemyView } from './enemies';
import { EnemyView as OriginalEnemies } from './enemies-baseline';
import { GameScene as OriginalScene } from './scene-baseline';
import type { GameScene } from './scene';

/** A separate cache prevents a changed live material from repainting the original models. */
function baselineView(view: GameScene) {
  const proxy = Object.create(view) as GameScene;
  proxy.materials = new Map<string, StandardMaterial>();
  proxy.material = (name, color, texture = false, emissive = 0) => {
    const material = OriginalScene.prototype.material.call(proxy, name, color, texture, emissive);
    material.name = `baseline ${name}`;
    return material;
  };
  proxy.box = OriginalScene.prototype.box.bind(proxy);
  proxy.shadow = OriginalScene.prototype.shadow.bind(proxy);
  return proxy;
}

export class GraphicsGallery {
  pairs: Array<{ id: string; root: TransformNode; before: TransformNode; after: TransformNode }> = [];
  selected = 'stonehand';
  turn = 0;
  overview = false;
  private world?: World;
  private baseline?: GameScene;
  private fill?: DirectionalLight;
  private lightingObserver?: Observer<Scene>;
  private ground?: Color3;
  constructor(public view: GameScene) {}
  update() {
    if (this.world === this.view.world) return;
    this.reset();
    this.world = this.view.world;
    if (!isGraphicsGallery(this.world)) return;
    const view = this.view;
    this.baseline = baselineView(view);
    const originalResidents = new OriginalResidents(this.baseline),
      currentResidents = new ResidentView(view);
    const originalEnemies = new OriginalEnemies(this.baseline),
      currentEnemies = new EnemyView(view);
    const pedestalMaterial = view.material('gallery stone', '#424b50');
    const bands = [
      view.material('gallery starting brass', '#bc965f'),
      view.material('gallery revised teal', '#69a9a6'),
    ];
    for (const [i, entry] of graphicsGalleryEntries.entries()) {
      const pair = new TransformNode(`gallery pair ${entry.id}`, view.scene);
      pair.position.set(entry.x, 0, entry.z);
      const roots: TransformNode[] = [];
      for (const variant of [0, 1]) {
        const display = new TransformNode(`gallery ${variant ? 'after' : 'before'} ${entry.id}`, view.scene);
        // Front-facing models look toward +Z, so screen-left is the positive-X pedestal.
        display.parent = pair;
        display.position.x = variant ? -entry.spacing : entry.spacing;
        const stage = MeshBuilder.CreateCylinder(
          'gallery plinth',
          { diameter: entry.pedestal, height: 0.09, tessellation: 32 },
          view.scene,
        );
        stage.parent = display;
        stage.position.y = 0.045;
        stage.material = pedestalMaterial;
        stage.isPickable = false;
        const band = MeshBuilder.CreateTorus(
          'gallery variant band',
          { diameter: entry.pedestal - 0.08, thickness: 0.025, tessellation: 40 },
          view.scene,
        );
        band.parent = display;
        band.position.y = 0.097;
        band.material = bands[variant];
        band.isPickable = false;
        const id = 20000 + i * 2 + variant;
        let root: TransformNode;
        if (entry.kind === 'resident') {
          const model = (variant ? currentResidents : originalResidents).create(id, entry.id);
          // Match an idle exhibit state without modifying either model factory.
          model.load.setEnabled(false);
          for (const weight of model.trainingWeights) weight.setEnabled(false);
          if (model.book) model.arm.rotation.x = model.leftArm.rotation.x = -0.78;
          root = model.root;
          model.shadow.parent = display;
          model.shadow.position.set(0, 0.113, 0);
        } else {
          const actor: Enemy = {
            id,
            type: entry.id,
            x: 0,
            z: 0,
            health: 1,
            target: { x: 0, z: 0 },
            facing: 0,
            pinnedUntil: 0,
            nextAttackAt: 0,
            hitAt: -100,
            activity: 'Exhibit',
          };
          const model = (variant ? currentEnemies : originalEnemies).build(actor);
          root = model.root;
          model.cloud?.setEnabled(false);
          model.projectile.setEnabled(false);
        }
        root.parent = display;
        root.position.set(0, 0.1, 0);
        root.name = `gallery model ${variant ? 'after' : 'before'} ${entry.id}`;
        for (const mesh of root.getChildMeshes()) mesh.isPickable = false;
        roots.push(root);
      }
      this.pairs.push({ id: entry.id, root: pair, before: roots[0], after: roots[1] });
    }
    const sky = view.scene.getLightByName('cavern light') as HemisphericLight;
    this.ground = sky.groundColor.clone();
    this.fill = new DirectionalLight('gallery cool fill', new Vector3(0.7, -0.7, -0.3), view.scene);
    this.fill.intensity = 0.3;
    this.fill.diffuse = Color3.FromHexString('#bfcfe8');
    this.lightingObserver = view.scene.onBeforeRenderObservable.add(() => {
      sky.diffuse = Color3.FromHexString('#e7e4dd');
      sky.groundColor = Color3.FromHexString('#53535c');
      view.scene.getLightByName('warm rim')!.diffuse = Color3.FromHexString('#ffe6c9');
    });
    this.focus(this.selected);
  }
  focus(id = this.selected) {
    const entry = graphicsGalleryEntries.find((e) => e.id === id);
    if (!entry) return;
    this.selected = id;
    this.overview = false;
    for (const pair of this.pairs) pair.root.setEnabled(pair.id === id);
    this.view.camera.target.set(entry.x, entry.targetHeight, entry.z);
    this.view.camera.alpha = Math.PI / 2;
    this.view.camera.beta = 1.16;
    this.view.camera.radius = entry.radius;
    this.rotate(0, true);
  }
  showAll() {
    this.overview = true;
    for (const pair of this.pairs) pair.root.setEnabled(true);
    this.view.camera.target.set(11.25, 0, 12.5);
    this.view.camera.alpha = Math.PI / 2;
    this.view.camera.beta = 0.48;
    this.view.camera.radius = 31;
  }
  rotate(angle: number, absolute = false) {
    this.turn = absolute ? angle : this.turn + angle;
    for (const pair of this.pairs) for (const root of [pair.before, pair.after]) root.rotation.y = this.turn;
  }
  zoom(factor: number) {
    this.view.camera.radius = Math.max(2.8, Math.min(40, this.view.camera.radius * factor));
  }
  reset() {
    for (const pair of this.pairs) pair.root.dispose();
    this.pairs = [];
    if (this.lightingObserver) this.view.scene.onBeforeRenderObservable.remove(this.lightingObserver);
    this.lightingObserver = undefined;
    this.fill?.dispose();
    this.fill = undefined;
    const sky = this.view.scene.getLightByName('cavern light') as HemisphericLight;
    if (this.ground) sky.groundColor = this.ground;
    this.ground = undefined;
    if (this.baseline) for (const material of this.baseline.materials.values()) material.dispose(false, true);
    this.baseline = undefined;
  }
}
