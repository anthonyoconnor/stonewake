import {
  Color3,
  DirectionalLight,
  MeshBuilder,
  TransformNode,
  Vector3,
  type HemisphericLight,
  type Observer,
  type Scene,
} from '@babylonjs/core';
import { arcanaGalleryEntries, isArcanaGallery } from '../content/arcana-gallery';
import type { World } from '../game/types';
import type { GameScene } from './scene';
import { arcanaStartingView, disposeArcanaStartingView } from './arcana-reference';
import { createArcanaExhibit, type ArcanaExhibit } from './arcana-exhibits';
import { zoomedRadius } from './camera-zoom';

export type ArcanaState = 'ready' | 'active' | 'finished';
export class ArcanaGallery {
  pairs: Array<{
    id: string;
    root: TransformNode;
    before: TransformNode;
    after: TransformNode;
    exhibits: ArcanaExhibit[];
  }> = [];
  selected = 'summon-stonehand';
  state: ArcanaState = 'active';
  playing = false;
  time = 0;
  speed = 1;
  turn = 0;
  overview = false;
  private world?: World;
  private baseline?: GameScene;
  private refined?: GameScene;
  private fill?: DirectionalLight;
  private observer?: Observer<Scene>;
  private ground?: Color3;
  constructor(public view: GameScene) {}
  update(dt = 0) {
    if (this.world !== this.view.world) {
      this.reset();
      this.world = this.view.world;
      if (!isArcanaGallery(this.world)) return;
      this.build();
    }
    if (!this.pairs.length) return;
    if (this.playing && dt > 0) this.time += Math.min(0.1, dt) * this.speed;
    this.pose();
  }
  private build() {
    const v = this.view;
    this.baseline = arcanaStartingView(v);
    // Animation may tint a material: exhibit state must never recolor the actual Hearth.
    this.refined = Object.create(v) as GameScene;
    this.refined.materials = new Map();
    const material = v.material('arcana studio stone', '#424b50');
    const bands = [
      v.material('arcana starting band', '#bc965f'),
      v.material('arcana refined band', '#69a9a6'),
    ];
    for (const entry of arcanaGalleryEntries) {
      const pair = new TransformNode(`arcana pair ${entry.id}`, v.scene);
      pair.position.set(entry.x, 0, entry.z);
      const exhibits: ArcanaExhibit[] = [];
      for (const variant of [0, 1]) {
        const display = new TransformNode(`arcana ${variant ? 'after' : 'before'} ${entry.id}`, v.scene);
        display.parent = pair;
        display.position.x = variant ? -entry.spacing : entry.spacing;
        const stage = MeshBuilder.CreateCylinder(
          'arcana plinth',
          { diameter: entry.pedestal, height: 0.1, tessellation: 48 },
          v.scene,
        );
        stage.parent = display;
        stage.position.y = 0.05;
        stage.material = material;
        stage.isPickable = false;
        const band = MeshBuilder.CreateTorus(
          'arcana reference band',
          { diameter: entry.pedestal - 0.08, thickness: 0.025, tessellation: 64 },
          v.scene,
        );
        band.parent = display;
        band.position.y = 0.105;
        band.material = bands[variant];
        band.isPickable = false;
        const exhibit = createArcanaExhibit(variant ? this.refined : this.baseline, entry, !variant);
        exhibit.root.parent = display;
        exhibit.root.position.set(0, 0.11, 0);
        for (const m of exhibit.root.getChildMeshes()) m.isPickable = false;
        exhibits.push(exhibit);
      }
      this.pairs.push({
        id: entry.id,
        root: pair,
        before: exhibits[0].root,
        after: exhibits[1].root,
        exhibits,
      });
    }
    const sky = v.scene.getLightByName('cavern light') as HemisphericLight;
    this.ground = sky.groundColor.clone();
    this.fill = new DirectionalLight('arcana studio fill', new Vector3(0.7, -0.7, -0.3), v.scene);
    this.fill.intensity = 0.3;
    this.fill.diffuse = Color3.FromHexString('#bfcfe8');
    this.observer = v.scene.onBeforeRenderObservable.add(() => {
      sky.diffuse = Color3.FromHexString('#e7e4dd');
      sky.groundColor = Color3.FromHexString('#53535c');
      v.scene.getLightByName('warm rim')!.diffuse = Color3.FromHexString('#ffe6c9');
    });
    this.focus();
  }
  private pose() {
    for (const pair of this.pairs)
      if (pair.root.isEnabled())
        for (const e of pair.exhibits) e.pose(this.time, this.state, this.view.effects.reduced);
  }
  focus(id = this.selected) {
    const e = arcanaGalleryEntries.find((e) => e.id === id);
    if (!e) return;
    this.selected = id;
    this.overview = false;
    for (const p of this.pairs) p.root.setEnabled(p.id === id);
    this.view.camera.target.set(e.x, e.targetHeight, e.z);
    this.view.camera.alpha = Math.PI / 2;
    this.view.camera.beta = 0.97;
    this.view.camera.radius = e.cameraRadius;
    this.rotate(0, true);
    this.pose();
  }
  focusModel(variant: 'before' | 'after') {
    this.focus();
    const e = arcanaGalleryEntries.find((e) => e.id === this.selected)!;
    this.view.camera.target.x += variant === 'before' ? e.spacing : -e.spacing;
    this.view.camera.radius = e.cameraRadius * 0.5;
  }
  showAll() {
    this.overview = true;
    for (const p of this.pairs) p.root.setEnabled(true);
    this.view.camera.target.set(27, 0, 25);
    this.view.camera.alpha = Math.PI / 2;
    this.view.camera.beta = 0.35;
    this.view.camera.radius = 63;
    this.pose();
  }
  rotate(angle: number, absolute = false) {
    this.turn = absolute ? angle : this.turn + angle;
    for (const p of this.pairs)
      for (const root of [p.before, p.after]) (root.parent as TransformNode).rotation.y = this.turn;
  }
  zoom(factor: number) {
    this.view.camera.radius = zoomedRadius(this.view.camera.radius, factor, 70);
  }
  setState(state: ArcanaState) {
    this.state = state;
    this.restart();
  }
  restart() {
    this.time = 0;
    this.pose();
  }
  step() {
    this.playing = false;
    this.time += 1 / 30;
    this.pose();
  }
  reset() {
    for (const p of this.pairs) p.root.dispose();
    this.pairs = [];
    if (this.observer) this.view.scene.onBeforeRenderObservable.remove(this.observer);
    this.observer = undefined;
    this.fill?.dispose();
    this.fill = undefined;
    if (this.ground)
      (this.view.scene.getLightByName('cavern light') as HemisphericLight).groundColor = this.ground;
    this.ground = undefined;
    if (this.baseline) disposeArcanaStartingView(this.baseline);
    if (this.refined)
      for (const material of this.refined.materials.values()) {
        // Painted terrain albedo/normal maps belong to the scene's shared immutable cache.
        material.dispose(false, !material.bumpTexture);
      }
    this.refined = undefined;
    this.baseline = undefined;
    this.world = undefined;
    this.playing = false;
    this.time = 0;
    this.state = 'active';
  }
}
