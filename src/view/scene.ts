import { isHazard, hazardDefinitions } from '../game/terrain';
import { drawFurnishingModel, type FurnishingDisplay } from './furnishing-models';
import { tuning } from '../content/tuning';
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  Color3,
  Color4,
  HemisphericLight,
  DirectionalLight,
  PointLight,
  MeshBuilder,
  StandardMaterial,
  DynamicTexture,
  TransformNode,
  GlowLayer,
  Mesh,
} from '@babylonjs/core';
import { type World, type Tile, neighbors, key } from '../game/types';
import { roomTiles } from '../game/rooms';
import { roomById, roomLook } from '../content/rooms';
import { surfaceTexture } from './surfaces';
import { SceneEffects } from './effects';
import {
  dressedBlock,
  terrainRelief,
  floorTransitions,
  hazardDetails,
  crystalMesh,
  mergeEnvironment,
  goldSeams,
} from './environment';
const colors: Record<string, string> = {
  dirt: '#96744f',
  rock: '#818780',
  bedrock: '#39464f',
  gold: '#96764d',
  gem: '#344e5e',
  floor: '#817c67',
  unknown: '#101820',
};
export class GameScene {
  engine: Engine;
  scene: Scene;
  camera: ArcRotateCamera;
  materials = new Map<string, StandardMaterial>();
  terrainRoot: TransformNode;
  lastRevision = -1;
  tileNodes = new Map<string, { signature: string; node: TransformNode }>();
  furnitureRoot?: TransformNode;
  furnitureNodes = new Map<string, { signature: string; node: TransformNode }>();
  effects: SceneEffects;
  glow: GlowLayer;
  unknownBlock?: Mesh;
  constructor(
    public canvas: HTMLCanvasElement,
    public world: World,
  ) {
    this.engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    this.engine.setHardwareScalingLevel(Math.max(1, window.devicePixelRatio / 1.5));
    this.scene = new Scene(this.engine);
    this.scene.clearColor = Color4.FromHexString('#101821ff');
    this.camera = new ArcRotateCamera(
      'camera',
      tuning.initialAngle,
      tuning.initialTilt,
      tuning.initialZoom,
      new Vector3(world.hearth.x, 0, world.hearth.z),
      this.scene,
    );
    this.camera.minZ = 0.1;
    this.camera.maxZ = 150;
    const sky = new HemisphericLight('cavern light', new Vector3(0.1, 1, 0.3), this.scene);
    sky.intensity = 0.62;
    sky.groundColor = Color3.FromHexString('#252b39');
    const sun = new DirectionalLight('warm rim', new Vector3(-0.5, -1, 0.7), this.scene);
    sun.intensity = 0.96;
    sun.diffuse = Color3.FromHexString('#ffe2b4');
    const glow = new PointLight('hearth light', new Vector3(world.hearth.x, 2.4, world.hearth.z), this.scene);
    glow.diffuse = Color3.FromHexString('#72dbef');
    glow.intensity = 1.2;
    glow.range = 6;
    this.terrainRoot = new TransformNode('terrain', this.scene);
    this.glow = new GlowLayer('crystal and lamplight', this.scene, {
      blurKernelSize: 24,
      mainTextureRatio: 0.25,
      excludeByDefault: true,
    });
    this.glow.intensity = 0.3;
    this.effects = new SceneEffects(this);
    window.addEventListener('resize', () => this.engine.resize());
    this.refresh();
  }
  material(name: string, color: string, texture = false, emissive = 0) {
    if (this.materials.has(name)) return this.materials.get(name)!;
    const m = new StandardMaterial(name, this.scene);
    m.diffuseColor = Color3.FromHexString(color);
    m.specularColor = new Color3(0.08, 0.08, 0.08);
    m.emissiveColor = Color3.FromHexString(color).scale(emissive);
    if (texture) m.diffuseTexture = surfaceTexture(this.scene, name);
    if (name === 'lava') m.emissiveTexture = m.diffuseTexture;
    if (texture && name.startsWith('floor-')) m.diffuseColor = Color3.White();
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
  includeGlow(mesh: Mesh) {
    this.glow.addIncludedOnlyMesh(mesh);
    mesh.onDisposeObservable.addOnce(() => this.glow.removeIncludedOnlyMesh(mesh));
  }
  crystal(
    x: number,
    y: number,
    z: number,
    size: number,
    color: string,
    parent: TransformNode = this.terrainRoot,
  ) {
    return crystalMesh(this, x, y, z, size, color, parent);
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
  refresh() {
    if (this.lastRevision === this.world.revision) return;
    this.lastRevision = this.world.revision;
    const root = this.terrainRoot;
    if (!this.tileNodes.size) this.drawHearth();
    for (const t of this.world.tiles) {
      const id = `${t.x},${t.z}`,
        signature = [
          t.bridge,
          t.bridgePlanned,
          t.terrain,
          t.known,
          t.claimed,
          t.reinforced,
          t.wallPlanned,
          t.room,
          t.loose,
          t.designated,
          t.known || t.terrain === 'gold' || t.terrain === 'gem'
            ? neighbors(this.world, t)
                .map((n) => n.bridge + ':' + n.terrain + ':' + n.known + ':' + n.reinforced + ':' + n.room)
                .join()
            : null,
        ].join(':');
      const old = this.tileNodes.get(id);
      if (old?.signature === signature) continue;
      old?.node.dispose();
      const node = new TransformNode(id, this.scene);
      node.parent = root;
      this.terrainRoot = node;
      this.drawTile(t);
      mergeEnvironment(this, node);
      this.tileNodes.set(id, { signature, node });
    }
    this.terrainRoot = root;
    this.drawFurniture();
  }
  drawTile(t: Tile) {
    // Resource geology is visible for planning without discovering the tile.
    const resource = t.terrain === 'gold' || t.terrain === 'gem';
    if (!t.known && !resource) {
      // Fog cells share one geometry and one instanced draw, while retaining individual picks.
      if (!this.unknownBlock) {
        this.unknownBlock = MeshBuilder.CreateBox(
          'fog geometry',
          { width: 0.997, height: 1.6, depth: 0.997 },
          this.scene,
        );
        this.unknownBlock.material = this.material('unknown', colors.unknown);
        this.unknownBlock.isVisible = false;
        this.unknownBlock.isPickable = false;
      }
      const fog = this.unknownBlock.createInstance(`tile-${t.x}-${t.z}`);
      fog.isPickable = true;
      fog.isVisible = true;
      fog.position.set(t.x, 0.68, t.z);
      fog.parent = this.terrainRoot;
      fog.metadata = { tile: { x: t.x, z: t.z } };
      if (t.designated) {
        const m = this.box(
          'dig designation',
          t.x,
          1.49,
          t.z,
          0.94,
          0.025,
          0.94,
          this.material('designation', '#53d8c6', false, 0.4),
        );
        m.material!.alpha = 0.38;
        m.isPickable = false;
      }
      return;
    }
    if (t.known && isHazard(t)) {
      const hazard = hazardDefinitions[t.terrain as keyof typeof hazardDefinitions];
      const base = this.box(
        'tile-' + t.x + '-' + t.z,
        t.x,
        t.terrain === 'chasm' ? -1.15 : -0.36,
        t.z,
        0.999,
        0.12,
        0.999,
        this.material(t.terrain, hazard.color, t.terrain !== 'chasm', t.terrain === 'lava' ? 0.38 : 0),
      );
      base.metadata = { tile: { x: t.x, z: t.z } };
      hazardDetails(this, t);
      return;
    }
    const type = t.terrain,
      solid = type !== 'floor';
    const room = t.known && t.room ? roomById(t.room) : undefined;
    const rawGround = type === 'floor' && !t.claimed && !room && !t.core;
    const mat = this.material(
      room
        ? `floor-${room.id}`
        : rawGround
          ? 'raw ground'
          : t.known && t.reinforced
            ? 'reinforced wall'
            : type,
      room
        ? (roomLook(room.id).floor ?? room.color)
        : rawGround
          ? '#99784f'
          : t.known && t.reinforced
            ? '#8c9187'
            : colors[type],
      true,
    );
    const mesh =
      solid
        ? dressedBlock(
            this,
            `tile-${t.x}-${t.z}`,
            t.x,
            0.68,
            t.z,
            0.997,
            1.6,
            0.997,
            mat,
            this.terrainRoot,
            0.025,
          )
        : this.box(
            `tile-${t.x}-${t.z}`,
            t.x,
            solid ? 0.68 : -0.12,
            t.z,
            0.997,
            solid ? 1.6 : 0.24,
            0.997,
            mat,
          );
    mesh.metadata = { tile: { x: t.x, z: t.z } };
    if (t.designated) {
      const m = this.box(
        'dig designation',
        t.x,
        1.49,
        t.z,
        0.94,
        0.025,
        0.94,
        this.material('designation', '#53d8c6', false, 0.4),
      );
      m.material!.alpha = 0.38;
      m.isPickable = false;
    }
    if (solid) terrainRelief(this, t, mat);
    else floorTransitions(this, t);
    if (t.wallPlanned) {
      const m = this.box(
        'wall plan',
        t.x,
        0.22,
        t.z,
        0.88,
        0.44,
        0.88,
        this.material('wall blueprint', '#86b6cc', false, 0.25),
      );
      m.material!.alpha = 0.4;
      m.isPickable = false;
    }
    if (type === 'gold') goldSeams(this, t);
    if (type === 'gem') {
      for (let i = 0; i < 5; i++) {
        const m = this.crystal(
          t.x + Math.sin(i * 4) * 0.27,
          1.49,
          t.z + Math.cos(i * 4) * 0.27,
          0.28 + (i % 2) * 0.14,
          i % 2 ? '#62bad3' : '#9b75d5',
        );
        m.rotation.z = 0.3 * Math.sin(i);
      }
      for (const n of neighbors(this.world, t).filter(
        (n) => (n.terrain === 'floor' || isHazard(n)) && n.known,
      ))
        for (let i = 0; i < 6; i++) {
          const dx = n.x - t.x,
            dz = n.z - t.z,
            c = this.crystal(
              t.x + dx * 0.48 + (dz ? ((i % 2) - 0.5) * 0.4 : 0),
              0.27 + Math.floor(i / 2) * 0.43,
              t.z + dz * 0.48 + (dx ? ((i % 2) - 0.5) * 0.4 : 0),
              0.27 + (i % 2) * 0.09,
              i % 2 ? '#6fbaca' : '#a183d1',
            );
          c.rotation.z = dx * 0.5;
          c.rotation.x = dz * 0.5;
        }
    }
    if (!t.known) return;
    if (type === 'floor' && t.claimed && !room && !t.core) {
      const m = this.box(
        'claim inset',
        t.x,
        -0.003,
        t.z,
        0.055,
        0.008,
        0.055,
        this.material('claim', '#ac9a72'),
      );
      m.isPickable = false;
    }

    if (room)
      for (const n of neighbors(this.world, t))
        if (n.known && n.reinforced && n.terrain !== 'floor') {
          const dx = n.x - t.x,
            dz = n.z - t.z,
            trim = this.material(`wall-${room.id}`, roomLook(room.id).trim ?? room.color);
          for (const y of [0.25, 1.08])
            this.box(
              'room wall trim',
              t.x + dx * 0.485,
              y,
              t.z + dz * 0.485,
              dx ? 0.045 : 0.98,
              0.07,
              dz ? 0.045 : 0.98,
              trim,
            ).isPickable = false;
          this.box(
            'wall panel',
            t.x + dx * 0.46,
            0.66,
            t.z + dz * 0.46,
            dx ? 0.06 : 0.52,
            0.58,
            dz ? 0.06 : 0.52,
            this.material('chest wood', '#755334', true),
          ).isPickable = false;
          if (roomLook(room.id).motif === 'workshop')
            for (const offset of [-0.15, 0.15])
              this.box(
                'hanging tool',
                t.x + dx * 0.41 + dz * offset,
                0.68,
                t.z + dz * 0.41 + dx * offset,
                dx ? 0.06 : 0.035,
                0.3,
                dz ? 0.06 : 0.035,
                trim,
              ).isPickable = false;
          if (roomLook(room.id).motif === 'training') {
            this.box(
              'training banner',
              t.x + dx * 0.405,
              0.68,
              t.z + dz * 0.405,
              dx ? 0.025 : 0.34,
              0.5,
              dz ? 0.025 : 0.34,
              this.material('training banner', '#843f31'),
            ).isPickable = false;
            const target = MeshBuilder.CreateTorus(
              'practice wall target',
              { diameter: 0.22, thickness: 0.022, tessellation: 16 },
              this.scene,
            );
            target.position.set(t.x + dx * 0.38, 0.7, t.z + dz * 0.38);
            target.rotation.set(dz ? Math.PI / 2 : 0, 0, dx ? Math.PI / 2 : 0);
            target.material = trim;
            target.parent = this.terrainRoot;
            target.isPickable = false;
          }
          if (roomLook(room.id).motif === 'library') {
            const shelf = this.material('library shelf', '#59402d', true);
            for (const y of [0.42, 0.76, 1.04])
              this.box(
                'wall bookshelf',
                t.x + dx * 0.405,
                y,
                t.z + dz * 0.405,
                dx ? 0.15 : 0.76,
                0.045,
                dz ? 0.15 : 0.76,
                shelf,
              ).isPickable = false;
            for (const y of [0.58, 0.9])
              for (let i = 0; i < 7; i++) {
                const offset = (i - 3) * 0.091,
                  book = this.material(`book spine ${i % 3}`, ['#486982', '#866143', '#647558'][i % 3]);
                this.box(
                  'wall book',
                  t.x + dx * 0.415 + dz * offset,
                  y,
                  t.z + dz * 0.415 + dx * offset,
                  dx ? 0.09 : 0.065,
                  0.19 + (i % 2) * 0.035,
                  dz ? 0.09 : 0.065,
                  book,
                ).isPickable = false;
              }
          }
          if (['treasure', 'kitchen'].includes(roomLook(room.id).motif)) {
            const emblem = MeshBuilder.CreateCylinder(
              'wall emblem',
              { height: 0.04, diameter: 0.28, tessellation: 12 },
              this.scene,
            );
            emblem.position.set(t.x + dx * 0.4, 0.68, t.z + dz * 0.4);
            emblem.rotation.set(dz ? Math.PI / 2 : 0, 0, dx ? Math.PI / 2 : 0);
            emblem.material = trim;
            emblem.parent = this.terrainRoot;
            emblem.isPickable = false;
          }
        }
    if (type === 'floor')
      for (const n of neighbors(this.world, t))
        if (n.known && n.terrain !== 'floor' && !isHazard(n)) {
          const dx = n.x - t.x,
            dz = n.z - t.z,
            shade = this.box(
              'wall foot shadow',
              t.x + dx * 0.42,
              0.009,
              t.z + dz * 0.42,
              dx ? 0.16 : 0.997,
              0.01,
              dz ? 0.16 : 0.997,
              this.material('wall shade', '#191e22'),
            );
          shade.isPickable = false;
          if (n.reinforced && (t.x + t.z) % 4 === 0) {
            const x = t.x + dx * 0.4,
              z = t.z + dz * 0.4,
              iron = this.material('lantern frame', '#443d31');
            this.box('sconce bracket', x, 0.92, z, 0.16, 0.32, 0.16, iron).isPickable = false;
            this.box(
              'lantern flame',
              x - dx * 0.035,
              0.99,
              z - dz * 0.035,
              0.1,
              0.18,
              0.1,
              this.material('lantern flame', '#ffc779', false, 0.85),
            ).isPickable = false;
            for (const y of [0.88, 1.11])
              this.box('lantern cap', x, y, z, 0.19, 0.055, 0.19, iron).isPickable = false;
          }
        }
    if (t.loose)
      for (let i = 0; i < Math.min(8, Math.ceil(t.loose / 10)); i++) {
        const p = MeshBuilder.CreateSphere(
          'loose riches',
          { diameter: 0.1 + (i % 2) * 0.035, segments: 4 },
          this.scene,
        );
        p.position.set(
          t.x + Math.sin(i * 2) * 0.18,
          0.07 + Math.floor(i / 4) * 0.06,
          t.z + Math.cos(i * 2) * 0.17 - (solid ? 0.65 : 0),
        );
        p.material = this.material(
          t.source === 'gem' ? 'loose gem' : 'gold metal',
          t.source === 'gem' ? '#a38ae3' : '#ffbf4d',
          false,
          0.25,
        );
        p.parent = this.terrainRoot;
        p.isPickable = false;
      }
  }
  drawFurniture() {
    this.furnitureRoot ??= new TransformNode('furnishings', this.scene);
    const furnitureParent = this.furnitureRoot,
      ids = new Set(this.world.furnishings.map((f) => f.id));
    for (const [id, old] of this.furnitureNodes)
      if (!ids.has(id)) {
        old.node.dispose();
        this.furnitureNodes.delete(id);
      }
    for (const f of this.world.furnishings) {
      const model = f.model ?? f.kind;
      const display: FurnishingDisplay = {};
      if (model === 'chest') {
        if (f.id === 'hearth-treasury')
          display.storedGold = this.world.roomServices.find((s) => s.id === f.id)?.stored ?? 0;
        else {
          const cells = new Set(roomTiles(this.world, f).map(key));
          const gold = this.world.roomServices
            .filter((s) => s.service === 'storage' && cells.has(key(s)))
            .reduce((sum, s) => sum + s.stored, 0);
          const chests = this.world.furnishings.filter(
            (other) => (other.model ?? other.kind) === 'chest' && cells.has(key(other)),
          );
          display.storedGold = gold / Math.max(1, chests.length);
        }
      }
      if (model === 'table')
        display.eating = this.world.agents.some(
          (a) => a.job?.kind === 'eat' && !a.path.length && Math.hypot(a.x - f.x, a.z - f.z) < 1.6,
        );
      if (['bench', 'anvil', 'assembly'].includes(model)) {
        const output = Object.entries(this.world.outputs).find(([, count]) => count > 0);
        if (output) {
          display.output = output[0];
          display.outputCount = output[1];
        }
      }
      const signature = [
        model,
        f.rotation,
        display.storedGold,
        display.output,
        display.outputCount,
        display.eating,
      ].join(':');
      const old = this.furnitureNodes.get(f.id);
      if (old?.signature === signature) continue;
      old?.node.dispose();
      const node = new TransformNode(`furnishing ${f.id}`, this.scene);
      node.parent = furnitureParent;
      this.furnitureNodes.set(f.id, { signature, node });
      this.furnitureRoot = node;
      if (f.id === 'hearth-treasury') node.position.y = 0.3;
      drawFurnishingModel(this, f, node, display);
    }
    this.furnitureRoot = furnitureParent;
    // Static props sharing a material can draw together; animated dwarfs stay separate.
    for (const { node } of this.furnitureNodes.values()) {
      if (node.metadata?.merged) continue;
      const groups = new Map<StandardMaterial, Mesh[]>();
      for (const mesh of node.getChildMeshes())
        if (mesh instanceof Mesh) {
          const mat = mesh.material as StandardMaterial;
          groups.set(mat, [...(groups.get(mat) ?? []), mesh]);
        }
      for (const [mat, meshes] of groups)
        if (meshes.length > 1) {
          const merged = Mesh.MergeMeshes(meshes, true, true);
          if (merged) {
            // MergeMeshes bakes world coordinates; restore this furnishing's local space.
            merged.bakeTransformIntoVertices(node.computeWorldMatrix(true).clone().invert());
            merged.parent = node;
            merged.isPickable = false;
            if (mat.emissiveColor.r + mat.emissiveColor.g + mat.emissiveColor.b > 0.3)
              this.includeGlow(merged);
          }
        }
      node.metadata = { merged: true };
    }
  }
  drawHearth() {
    const { x, z } = this.world.hearth;
    const base = MeshBuilder.CreateCylinder(
      'hearth dais',
      { height: 0.3, diameter: 2.7, tessellation: 8 },
      this.scene,
    );
    base.position.set(x, 0.15, z);
    base.material = this.material('hearth stone', '#647680', true);
    base.parent = this.terrainRoot;
    this.shadow(x, z, 3.7, 3.7, this.terrainRoot);
    for (const diameter of [2.2, 2.48]) {
      const ring = MeshBuilder.CreateTorus(
        'runic circle',
        { diameter, thickness: 0.025, tessellation: 48 },
        this.scene,
      );
      ring.position.set(x, 0.32, z);
      ring.material = this.material('hearth brass', '#c2a668', false, 0.2);
      ring.parent = this.terrainRoot;
      ring.isPickable = false;
    }
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      const block = dressedBlock(
        this,
        'crystal cradle',
        x + Math.cos(a) * 0.67,
        0.39,
        z + Math.sin(a) * 0.67,
        0.36,
        0.25,
        0.3,
        this.material('hearth stone', '#647680', true),
        this.terrainRoot,
        0.04,
      );
      block.rotation.y = -a;
      block.isPickable = false;
      const rune = new TransformNode('hearth glyph', this.scene);
      rune.parent = this.terrainRoot;
      rune.position.set(x + Math.cos(a) * 1.04, 0.32, z + Math.sin(a) * 1.04);
      rune.rotation.y = -a;
      for (const offset of [-0.035, 0.035]) {
        const m = this.box(
          'rune',
          offset,
          0.006,
          0,
          0.024,
          0.016,
          0.17,
          this.material('rune', '#86ebf5', false, 0.8),
          rune,
        );
        m.rotation.y = offset < 0 ? 0.35 : -0.35;
        m.isPickable = false;
      }
      this.box(
        'rune crossstroke',
        0,
        0.009,
        0.01,
        0.13,
        0.015,
        0.02,
        this.material('rune', '#86ebf5'),
        rune,
      ).isPickable = false;
    }
    this.crystal(x, 1.25, z, 1.75, '#7fdef0');
    this.crystal(x - 0.5, 0.72, z + 0.2, 0.7, '#579bd0');
    this.crystal(x + 0.4, 0.65, z - 0.15, 0.8, '#86e5d7');
  }
  render() {
    this.refresh();
    this.effects.update();
    this.scene.render();
  }
  setWorld(world: World) {
    this.world = world;
    this.effects.reset();
    this.terrainRoot.dispose();
    this.unknownBlock?.dispose();
    this.unknownBlock = undefined;
    this.terrainRoot = new TransformNode('terrain', this.scene);
    this.tileNodes.clear();
    this.lastRevision = -1;
    this.furnitureRoot?.dispose();
    this.furnitureRoot = undefined;
    this.furnitureNodes.clear();
    const light = this.scene.getLightByName('hearth light') as PointLight;
    light.position.set(world.hearth.x, 2.4, world.hearth.z);
    this.refresh();
  }
}
