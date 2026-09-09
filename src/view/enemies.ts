import {
  TransformNode,
  MeshBuilder,
  Vector3,
  DynamicTexture,
  Color3,
  type StandardMaterial,
} from '@babylonjs/core';
import type { GameScene } from './scene';
import { type Enemy } from '../game/types';
import { enemyById } from '../content/enemies';
import { visible, slowRate } from '../game/spell-effects';
import { dressedBlock } from './environment';
import { strikeEnvelope, turnToward } from '../content/animation';

interface EnemyModel {
  root: TransformNode;
  body: TransformNode;
  head: TransformNode;
  legs: TransformNode[];
  arms: TransformNode[];
  tail?: TransformNode;
  crest?: TransformNode;
  projectile: TransformNode;
  cloud?: TransformNode;
  x: number;
  z: number;
  phase: number;
  facing: number;
  elapsed: number;
  moving: boolean;
}
/** Art direction: the ten approved enemy sheets; body construction and rigs remain local meshes. */
export class EnemyView {
  models = new Map<number, EnemyModel>();
  constructor(public view: GameScene) {}
  reset() {
    for (const model of this.models.values()) model.root.dispose();
    this.models.clear();
  }
  private build(e: Enemy): EnemyModel {
    const v = this.view,
      definition = enemyById(e.type),
      kind = definition.id;
    const root = new TransformNode(`${kind} ${e.id}`, v.scene),
      body = new TransformNode('enemy body', v.scene);
    body.parent = root;
    root.scaling.set(definition.scale * 0.72, definition.scale, definition.scale * 0.82);
    v.shadow(0, 0, 0.75, 0.9, root);
    const head = new TransformNode('enemy head', v.scene);
    head.parent = body;
    const legs: TransformNode[] = [],
      arms: TransformNode[] = [];
    const mat = (id: string, color: string, glow = 0) => {
      const material = v.material(`enemy ${id}`, color, false, glow);
      if (!glow && !material.diffuseTexture) {
        const texture = new DynamicTexture(`enemy surface ${id}`, 128, v.scene, false),
          context = texture.getContext();
        context.fillStyle = '#e6e6e6';
        context.fillRect(0, 0, 128, 128);
        const seed = [...id].reduce((sum, c) => sum + c.charCodeAt(0), 0);
        for (let i = 0; i < 60; i++) {
          const x = (i * 47 + seed) % 128,
            y = (i * 71 + seed * 3) % 128,
            r = 2 + (i % 7);
          context.fillStyle = i % 3 === 0 ? '#c9c9c9' : '#f1f1f1';
          context.beginPath();
          context.arc(x, y, r, 0, Math.PI * 2);
          context.fill();
        }
        texture.update();
        material.diffuseTexture = texture;
        material.specularColor = new Color3(0.045, 0.045, 0.045);
      }
      return material;
    };
    const iron = mat('old iron', '#414b4e'),
      bronze = mat('tarnished bronze', '#8e7747'),
      bone = mat('bone', '#d4c59d'),
      dark = mat('deep shadows', '#25262e');
    const skin = mat(
      kind,
      (
        {
          'goblin-raider': '#89924d',
          'tunnel-burrower': '#77614a',
          'cave-spider': '#49404f',
          'spore-brute': '#9a8355',
          'restless-guard': '#cec49c',
          'ancient-sentinel': '#7a8775',
          'crystal-elemental': '#a687cf',
          'crystalback-stalker': '#b3c0bd',
          cinderling: '#39393d',
          deepmaw: '#3e5360',
        } as Record<string, string>
      )[kind],
    );
    const accent = mat(
      `${kind} accent`,
      kind === 'cinderling'
        ? '#ff9634'
        : kind === 'cave-spider'
          ? '#65c8b9'
          : kind.includes('crystal')
            ? '#b19ce5'
            : kind === 'restless-guard'
              ? '#88dca3'
              : '#d8b368',
      0.22,
    );
    const box = (
      name: string,
      x: number,
      y: number,
      z: number,
      sx: number,
      sy: number,
      sz: number,
      m: StandardMaterial,
      parent = body,
    ) => {
      const mesh = dressedBlock(
        v,
        name,
        x,
        y,
        z,
        sx,
        sy,
        sz,
        m,
        parent,
        Math.min(0.025, sx * 0.18, sy * 0.18, sz * 0.18),
      );
      mesh.isPickable = false;
      return mesh;
    };
    const ball = (
      name: string,
      x: number,
      y: number,
      z: number,
      sx: number,
      sy: number,
      sz: number,
      m: StandardMaterial,
      parent = body,
    ) => {
      const mesh = MeshBuilder.CreateSphere(
        name,
        { diameter: 1, segments: kind === 'crystal-elemental' ? 3 : 6 },
        v.scene,
      );
      mesh.parent = parent;
      mesh.position.set(x, y, z);
      mesh.scaling.set(sx, sy, sz);
      mesh.material = m;
      mesh.isPickable = false;
      if (kind === 'crystal-elemental' || name.includes('armored ridge') || name.includes('coal'))
        mesh.convertToFlatShadedMesh();
      return mesh;
    };
    const cone = (
      name: string,
      x: number,
      y: number,
      z: number,
      height: number,
      width: number,
      m: StandardMaterial,
      parent = body,
      top = 0,
    ) => {
      const mesh = MeshBuilder.CreateCylinder(
        name,
        { height, diameterBottom: width, diameterTop: top, tessellation: 6 },
        v.scene,
      );
      mesh.parent = parent;
      mesh.position.set(x, y, z);
      mesh.material = m;
      mesh.isPickable = false;
      return mesh;
    };
    const joint = (name: string, x: number, y: number, z: number, parent = body) => {
      const n = new TransformNode(name, v.scene);
      n.parent = parent;
      n.position.set(x, y, z);
      return n;
    };
    const limb = (
      name: string,
      x: number,
      y: number,
      z: number,
      length: number,
      width: number,
      m: StandardMaterial,
      array: TransformNode[],
      parent = body,
    ) => {
      const n = joint(name, x, y, z, parent);
      ball(`${name} joint`, 0, 0, 0, width, width, width, m, n);
      ball(`${name} limb`, 0, -length * 0.45, 0, width * 0.8, length, width * 0.8, m, n);
      array.push(n);
      return n;
    };
    const eyes = (width: number, y: number, z: number, parent = head) => {
      for (const side of [-1, 1])
        ball('watchful eye', side * width, y, z, 0.055, 0.045, 0.04, accent, parent);
    };
    let tail: TransformNode | undefined, crest: TransformNode | undefined, cloud: TransformNode | undefined;

    if (['tunnel-burrower', 'crystalback-stalker', 'deepmaw'].includes(kind)) {
      const heavy = kind !== 'crystalback-stalker',
        deep = kind === 'deepmaw';
      ball('animal shoulders', 0, 0.48, 0.08, heavy ? 0.68 : 0.46, 0.49, heavy ? 0.88 : 0.82, skin);
      ball('haunches', 0, 0.38, -0.32, heavy ? 0.55 : 0.4, 0.38, 0.52, skin);
      head.position.set(0, 0.48, 0.43);
      ball(
        'wedge head',
        0,
        0,
        0.06,
        deep ? 0.68 : heavy ? 0.5 : 0.34,
        deep ? 0.3 : 0.26,
        deep ? 0.46 : 0.43,
        skin,
        head,
      );
      ball(
        'lower jaw',
        0,
        -0.095,
        0.16,
        deep ? 0.62 : 0.32,
        0.11,
        0.37,
        kind === 'deepmaw' ? mat('deepmaw throat', '#876b57') : skin,
        head,
      );
      eyes(deep ? 0.235 : heavy ? 0.17 : 0.115, 0.055, 0.22);
      for (const side of [-1, 1]) {
        if (deep) cone('ivory tusk', side * 0.23, -0.05, 0.31, 0.19, 0.09, bone, head).rotation.x = 0.35;
        for (const front of [true, false]) {
          const n = limb(
            front ? 'foreleg' : 'hindleg',
            side * (front ? 0.31 : 0.25),
            0.4,
            front ? 0.26 : -0.3,
            0.29,
            heavy ? 0.24 : 0.16,
            skin,
            legs,
          );
          n.rotation.z = side * 0.22;
          ball('wide clawed foot', side * 0.035, -0.27, 0.09, heavy ? 0.26 : 0.19, 0.12, 0.24, skin, n);
          for (let claw = 0; claw < 3; claw++)
            cone(
              'ivory claw',
              (claw - 1) * 0.065,
              -0.29,
              0.23,
              kind === 'tunnel-burrower' && front ? 0.23 : 0.12,
              0.055,
              bone,
              n,
            ).rotation.x = Math.PI / 2;
        }
      }
      tail = joint('balancing tail', 0, 0.32, -0.5);
      for (let i = 0; i < 4; i++)
        ball(
          'tapered tail',
          0.035 * i,
          0.015 - i * 0.025,
          -i * 0.14,
          0.24 - i * 0.045,
          0.2 - i * 0.032,
          0.29 - i * 0.03,
          skin,
          tail,
        );
      if (kind === 'crystalback-stalker')
        for (let i = 0; i < 5; i++) {
          const shard = cone(
            'swept crystal spine',
            0,
            0.79 - i * 0.037,
            0.27 - i * 0.14,
            0.33 - i * 0.026,
            0.17,
            accent,
          );
          shard.rotation.x = -0.55;
        }
      else
        for (let i = 0; i < 4; i++)
          for (const side of [-1, 0, 1]) {
            const plate = box(
              'overlapping armored ridge',
              side * 0.2,
              0.65 - Math.abs(side) * 0.035,
              0.31 - i * 0.2,
              0.28,
              0.09,
              0.28,
              kind === 'tunnel-burrower' ? iron : dark,
            );
            plate.rotation.x = -0.2;
          }
    } else if (kind === 'cave-spider') {
      ball('spider abdomen', 0, 0.43, -0.23, 0.59, 0.47, 0.7, skin);
      ball('cephalothorax', 0, 0.33, 0.2, 0.41, 0.28, 0.4, skin);
      head.position.set(0, 0.35, 0.34);
      eyes(0.105, 0.025, 0.12);
      for (const side of [-1, 1]) {
        for (let i = 0; i < 4; i++) {
          const n = joint('spider walking leg', side * 0.16, 0.35, 0.3 - i * 0.13);
          legs.push(n);
          const upper = ball('angular upper leg', side * 0.16, 0.06, 0, 0.43, 0.11, 0.11, skin, n);
          upper.rotation.z = side * 0.35;
          const lower = ball('angular lower leg', side * 0.36, -0.08, 0, 0.105, 0.4, 0.1, skin, n);
          lower.rotation.z = side * 0.4;
          cone('spider leg tip', side * 0.43, -0.27, 0.015, 0.17, 0.09, dark, n).rotation.z = side * 0.35;
          n.rotation.y = side * (0.55 - i * 0.37);
        }
        cone('small fang', side * 0.065, -0.07, 0.12, 0.15, 0.07, bone, head).rotation.x = -0.6;
        for (let i = 0; i < 3; i++)
          ball(
            'turquoise abdomen marking',
            side * 0.11,
            0.655 - i * 0.015,
            -0.12 - i * 0.14,
            0.07,
            0.03,
            0.09,
            accent,
          );
      }
    } else {
      const sentinel = kind === 'ancient-sentinel',
        elemental = kind === 'crystal-elemental',
        brute = kind === 'spore-brute',
        coal = kind === 'cinderling',
        guard = kind === 'restless-guard';
      const torso = sentinel
        ? box('lintel torso', 0, 0.67, 0, 0.62, 0.62, 0.4, skin)
        : ball(
            brute ? 'root trunk' : coal ? 'coal furnace' : 'broad torso',
            0,
            0.59,
            0,
            brute ? 0.59 : elemental ? 0.51 : 0.44,
            brute ? 0.65 : 0.5,
            0.36,
            skin,
          );
      if (elemental) {
        for (const side of [-1, 1]) ball('geode shell', side * 0.16, 0.68, 0.12, 0.21, 0.42, 0.23, skin);
        ball('luminous geode hollow', 0, 0.64, 0.19, 0.18, 0.25, 0.075, accent);
        for (const side of [-1, 0, 1])
          cone(
            'rear geode shard',
            side * 0.17,
            0.74,
            -0.2,
            0.4 - Math.abs(side) * 0.07,
            0.2,
            skin,
          ).rotation.x = -0.35;
      }
      for (const side of [-1, 1]) {
        const leg = limb(
          'pillar leg',
          side * (sentinel ? 0.19 : 0.14),
          0.35,
          0,
          0.25,
          sentinel ? 0.26 : brute ? 0.23 : 0.17,
          skin,
          legs,
        );
        box('grounded foot', 0, -0.29, 0.07, sentinel ? 0.29 : 0.22, 0.11, 0.28, guard ? iron : skin, leg);
        const arm = limb(
          'striking arm',
          side * (sentinel ? 0.41 : brute ? 0.37 : 0.29),
          0.79,
          0,
          sentinel ? 0.48 : brute ? 0.5 : 0.36,
          sentinel ? 0.28 : brute ? 0.27 : 0.16,
          skin,
          arms,
        );
        if (sentinel) box('massive stone fist', 0, -0.49, 0.02, 0.3, 0.29, 0.3, skin, arm);
        else
          ball(
            'hand',
            0,
            -(brute ? 0.47 : 0.34),
            0.035,
            brute ? 0.28 : 0.16,
            brute ? 0.3 : 0.15,
            0.19,
            skin,
            arm,
          );
        if (sentinel) {
          box('stone shoulder', side * 0.35, 0.89, 0, 0.31, 0.25, 0.4, skin);
          box('bronze shoulder band', side * 0.35, 0.91, 0.215, 0.27, 0.065, 0.025, bronze);
        }
        if (elemental)
          for (let i = 0; i < 2; i++)
            cone(
              'crystal arm facet',
              side * 0.045,
              -0.21 + i * 0.22,
              0.04,
              0.25,
              0.18,
              accent,
              arm,
            ).rotation.z = side * -0.25;
      }
      head.position.set(0, coal ? 0.86 : sentinel ? 0.99 : 0.97, 0.06);
      if (sentinel) {
        box('ancestral mask', 0, 0, 0.025, 0.27, 0.25, 0.25, skin, head);
        box('mask nose', 0, -0.025, 0.17, 0.055, 0.12, 0.05, bronze, head);
        eyes(0.073, 0.015, 0.156);
        box('chest seal', 0, 0.68, 0.224, 0.24, 0.23, 0.035, bronze);
        box('chest inset', 0, 0.68, 0.247, 0.14, 0.13, 0.02, dark);
        for (const side of [-1, 1])
          for (const y of [0.48, 0.7, 0.92]) {
            box('ancestral stone joint', 0, y, side * 0.211, 0.55, 0.028, 0.018, dark);
            box('vertical stone joint', side * 0.17, y - 0.08, side * 0.214, 0.02, 0.14, 0.022, bronze);
          }
        box('back carved seal', 0, 0.69, -0.235, 0.24, 0.23, 0.045, bronze);
        box('back seal inset', 0, 0.69, -0.262, 0.145, 0.14, 0.015, dark);
      } else if (elemental) {
        for (let i = 0; i < 3; i++)
          cone(
            'crystal crown',
            (i - 1) * 0.12,
            0.08,
            -0.035,
            0.39 - Math.abs(i - 1) * 0.1,
            0.19,
            skin,
            head,
          ).rotation.z = (i - 1) * -0.2;
      } else if (brute) {
        ball('fungal face', 0, -0.025, 0.07, 0.34, 0.27, 0.26, skin, head);
        eyes(0.087, 0, 0.195);
        const cap = mat('ochre caps', '#c4874d'),
          gill = mat('pale gills', '#dfc999');
        for (const [x, y, z, r] of [
          [0, 1.15, 0, 0.86],
          [-0.27, 1.06, 0.13, 0.49],
          [0.29, 1.04, -0.13, 0.42],
          [-0.35, 0.79, 0.04, 0.29],
          [0.35, 0.7, -0.04, 0.3],
          [0.12, 0.89, -0.22, 0.3],
          [-0.15, 0.67, -0.24, 0.34],
          [0.15, 0.49, -0.19, 0.25],
        ]) {
          ball('shelf mushroom gills', x, y - 0.035, z, r, 0.075, r * 0.8, gill);
          ball('shelf mushroom crown', x, y, z, r, 0.14, r * 0.8, cap);
        }
        for (const side of [-1, 1])
          for (let i = 0; i < 3; i++) {
            ball('puffball cluster', side * (0.21 + i * 0.035), 0.9 - i * 0.13, 0.21, 0.1, 0.09, 0.1, gill);
            ball('root fiber', side * (0.09 + i * 0.045), 0.54, -0.14, 0.075, 0.56, 0.12, skin).rotation.z =
              side * 0.12;
          }
        cloud = joint('spore pulse', 0, 0.52, 0);
        for (let i = 0; i < 9; i++) {
          const a = i * 2.4;
          ball(
            'sparse spore',
            Math.cos(a) * 0.6,
            (i % 3) * 0.2,
            Math.sin(a) * 0.6,
            0.045,
            0.045,
            0.045,
            accent,
            cloud,
          );
        }
      } else if (coal) {
        ball('furnace head', 0, 0, 0.03, 0.43, 0.35, 0.3, skin, head);
        eyes(0.11, 0.035, 0.184);
        box('furnace mouth', 0, -0.075, 0.185, 0.21, 0.09, 0.04, accent, head).rotation.z = 0.08;
        for (const side of [-1, 1])
          for (const z of [-0.17, 0.176])
            box('large glowing fissure', side * 0.14, 0.59, z, 0.025, 0.2, 0.015, accent).rotation.z =
              side * 0.35;
        for (let i = 0; i < 5; i++)
          ball(
            'coal crust fragment',
            (i % 2 ? 1 : -1) * 0.11,
            0.39 + i * 0.08,
            -0.17,
            0.15,
            0.14,
            0.11,
            skin,
          );
        crest = joint('short flame crest', 0, 0.15, -0.035, head);
        for (let i = 0; i < 3; i++)
          cone(
            'flame tongue',
            (i - 1) * 0.08,
            0.085,
            0,
            0.29 - Math.abs(i - 1) * 0.065,
            0.13,
            accent,
            crest,
          ).rotation.z = (i - 1) * -0.25;
      } else {
        ball(guard ? 'square skull' : 'goblin head', 0, 0, 0.02, 0.39, 0.36, 0.33, skin, head);
        eyes(0.11, 0.015, 0.188);
        if (guard) {
          box('skeletal jaw', 0, -0.13, 0.12, 0.22, 0.075, 0.19, bone, head);
          for (let i = 0; i < 4; i++)
            box('old tooth', (i - 1.5) * 0.04, -0.12, 0.222, 0.025, 0.06, 0.022, dark, head);
          ball('old helmet', 0, 0.12, -0.01, 0.43, 0.18, 0.36, iron, head);
          for (let i = 0; i < 3; i++) box('exposed rib', 0, 0.49 + i * 0.07, 0.175, 0.29, 0.035, 0.07, bone);
          box('corroded breastplate', 0, 0.7, 0.19, 0.34, 0.23, 0.08, iron);
          box('faded cloth', 0, 0.38, 0.01, 0.38, 0.16, 0.34, mat('faded blue', '#526573'));
          for (const side of [-1, 1]) {
            box('split ancient backplate', side * 0.105, 0.68, -0.16, 0.2, 0.29, 0.085, iron);
            box('bronze plate edge', side * 0.16, 0.68, -0.215, 0.025, 0.25, 0.02, bronze);
            box('corroded shoulder', side * 0.27, 0.79, 0, 0.2, 0.16, 0.29, iron);
          }
          for (let i = 0; i < 3; i++) box('vertebra', 0, 0.5 - i * 0.06, -0.17, 0.07, 0.04, 0.06, bone);
        } else {
          ball('long nose', 0, -0.035, 0.21, 0.105, 0.19, 0.2, skin, head);
          for (const side of [-1, 1]) {
            cone('long pointed ear', side * 0.26, 0.08, -0.01, 0.35, 0.15, skin, head).rotation.z =
              -side * 1.05;
            box('heavy brow', side * 0.11, 0.064, 0.191, 0.14, 0.06, 0.06, skin, head).rotation.z =
              -side * 0.18;
          }
          for (let i = 0; i < 3; i++)
            cone('dark crest', (i - 1) * 0.065, 0.225, -0.02, 0.2, 0.095, dark, head).rotation.x = -0.35;
          box('leather tunic', 0, 0.59, -0.015, 0.43, 0.28, 0.31, mat('leather', '#6c5538'));
          box('scrap shoulder', -0.27, 0.79, 0, 0.2, 0.16, 0.3, iron);
          box('scavenged back strap', 0, 0.66, -0.19, 0.055, 0.36, 0.04, bronze).rotation.z = 0.4;
          for (const side of [-1, 1])
            box(
              'ragged leather skirt',
              side * 0.135,
              0.36,
              -0.14,
              0.17,
              0.17,
              0.055,
              mat('leather', '#6c5538'),
            ).rotation.z = side * 0.2;
        }
        const weapon = arms[1],
          shield = arms[0];
        box('weapon grip', 0, -0.35, 0.14, 0.06, 0.07, 0.27, bronze, weapon);
        box('chipped blade', 0, -0.35, 0.38, 0.06, 0.11, 0.3, iron, weapon).rotation.x = -0.25;
        box('shield rim', -0.04, -0.25, 0.19, 0.085, guard ? 0.49 : 0.38, 0.34, bronze, shield);
        box(
          'shield face',
          -0.09,
          -0.25,
          0.19,
          0.03,
          guard ? 0.4 : 0.29,
          0.25,
          guard ? iron : mat('shield wood', '#766340'),
          shield,
        );
        box('shield boss', -0.115, -0.25, 0.19, 0.04, 0.09, 0.09, bronze, shield);
        box('belt', 0, 0.39, 0, 0.46, 0.07, 0.36, dark);
      }
    }
    const projectile = joint('enemy projectile', 0, 0, 0, root);
    ball('projectile shard', 0, 0, 0, kind === 'cave-spider' ? 0.12 : 0.09, 0.09, 0.23, accent, projectile);
    projectile.setEnabled(false);
    root.position.set(e.x, 0, e.z);
    return {
      root,
      body,
      head,
      legs,
      arms,
      tail,
      crest,
      cloud,
      projectile,
      x: e.x,
      z: e.z,
      phase: e.id,
      facing: e.facing,
      elapsed: -1,
      moving: false,
    };
  }
  update() {
    const w = this.view.world,
      reduced = this.view.effects.reduced;
    for (const e of w.enemies ?? []) {
      let m = this.models.get(e.id);
      if (e.health <= 0 && w.elapsed - (e.diedAt ?? w.elapsed) >= 3) {
        m?.root.dispose(); this.models.delete(e.id); continue;
      }
      if (!m && !visible(w, e)) continue;
      if (!m) {
        m = this.build(e);
        this.models.set(e.id, m);
      }
      const definition = enemyById(e.type),
        dead = e.health <= 0,
        pinned = e.pinnedUntil > w.elapsed,
        seen = visible(w, e),
        age = w.elapsed - (e.attackedAt ?? -100);
      m.root.setEnabled(seen && (!dead || w.elapsed - (e.diedAt ?? w.elapsed) < 3));
      if (m.elapsed !== w.elapsed) {
        const moved = Math.hypot(e.x - m.x, e.z - m.z);
        m.moving = moved > 0.0001;
        m.phase += moved * (definition.id === 'cave-spider' ? 12 : 9);
        m.x = e.x;
        m.z = e.z;
      }
      const walking = m.moving,
        dt = m.elapsed < 0 ? .05 : Math.max(0, Math.min(.15, w.elapsed - m.elapsed)),
        blend = 1 - Math.exp(-dt * 18);
      m.elapsed = w.elapsed;
      m.facing = turnToward(m.facing, e.facing, dt);
      m.root.position.x = e.x;
      m.root.position.z = e.z;
      m.root.position.y = 0;
      m.root.rotation.set(0, m.facing, 0);
      const active = !dead && !pinned,
        work = /Tunneling|Excavating/.test(e.activity),
        strike = active ? strikeEnvelope(w.elapsed, e.attackedAt) : 0;
      m.body.position.y =
        active && !reduced
          ? walking
            ? Math.abs(Math.sin(m.phase)) * 0.025
            : Math.sin(w.elapsed * 2 + e.id) * 0.008
          : 0;
      m.body.rotation.x = dead
        ? 0
        : work
          ? Math.sin(w.elapsed * 14) * 0.06
          : definition.ability === 'charge' && e.activity === 'Charging'
            ? -0.1
            : strike * 0.08;
      m.head.rotation.x = active ? strike * 0.18 : dead ? -0.2 : 0;
      m.legs.forEach((leg, i) => {
        const pose =
          active && work && i % 2 === 0
            ? -0.65 + Math.sin(w.elapsed * 14 + (i / 2) * Math.PI) * 0.45
            : active && walking
              ? Math.sin(m.phase + i * Math.PI + (m!.legs.length === 8 ? Math.floor(i / 4) * Math.PI : 0)) *
                0.3
              : pinned
                ? -0.15
                : 0;
        leg.rotation.x += (pose - leg.rotation.x) * blend;
      });
      m.arms.forEach((arm, i) => {
        const pose = active
          ? work
            ? -0.6 + Math.sin(w.elapsed * 14 + i * Math.PI) * 0.5
            : strike
              ? -0.9 * strike
              : walking
                ? Math.sin(m!.phase + i * Math.PI) * 0.2
                : 0
          : pinned
            ? -0.6
            : 0;
        arm.rotation.x += (pose - arm.rotation.x) * (active && age >= 0 && age < 0.06 ? 1 : blend);
      });
      if (m.tail) m.tail.rotation.y = active && !reduced ? Math.sin(m.phase * 0.6) * 0.17 : 0;
      if (m.crest) m.crest.scaling.y = reduced ? 1 : 1 + Math.sin(w.elapsed * 11) * 0.13;
      if (m.cloud) {
        const sporeAge = w.elapsed - ((e.abilityReadyAt ?? -Infinity) - (definition.abilitySeconds ?? 0));
        m.cloud.setEnabled(active && !reduced && sporeAge >= 0 && sporeAge < 0.65);
        m.cloud.scaling.setAll(1 + Math.min(0.65, Math.max(0, sporeAge)) * 2);
        m.cloud.rotation.y = w.elapsed * 0.3;
      }
      const projectile =
        (!!definition.range || definition.ability === 'web') && !!e.shotEnd && age >= 0 && age < 0.14;
      m.projectile.setEnabled(active && projectile && !reduced);
      if (projectile) {
        // These attacks resolve immediately in simulation: show a contact shard at the hit,
        // rather than a flight arriving after the victim has already recoiled.
        const target = new Vector3(e.shotEnd!.x - e.x, 0, e.shotEnd!.z - e.z);
        const c = Math.cos(-m.facing),
          s = Math.sin(-m.facing),
          t = 1 / definition.scale;
        m.projectile.position.set(
          ((target.x * c + target.z * s) * t) / 0.72,
          0.58,
          ((target.z * c - target.x * s) * t) / 0.82,
        );
      }
      // A brief physical recoil reads hits without floating health bars or numbers.
      if (active && !reduced && w.elapsed - e.hitAt < 0.15)
        m.body.rotation.z = Math.sin(((w.elapsed - e.hitAt) / 0.15) * Math.PI) * 0.09;
      else
        m.body.rotation.z = dead ? (Math.min(1, (w.elapsed - (e.diedAt ?? w.elapsed)) * 4) * Math.PI) / 2 : 0;
    }
  }
}
