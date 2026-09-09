import { reducedMotion } from '../content/presentation';
import { animationTuning, strikeEnvelope } from '../content/animation';
import { TransformNode, Mesh } from '@babylonjs/core';
import type { GameScene } from './scene';
import { characterById } from '../content/characters';
import type { Resident } from '../game/types';
import { createDwarfModel } from './dwarf-sculpt';
import { createStonehandModel } from './stonehands';
import { createHoundModel, animateHound, type HoundRig } from './hounds';
type Pose = { rotation: number[]; arms: number[]; legs: number[]; y: number };
type Model = {
  root: TransformNode;
  legs: TransformNode[];
  arm: TransformNode;
  leftArm: TransformNode;
  tool: TransformNode;
  load: TransformNode;
  shadow: Mesh;
  trainingWeights: TransformNode[];
  hound?: HoundRig;
  shield?: TransformNode;
  book?: TransformNode;
  actor?: Resident;
  lastX?: number;
  lastZ?: number;
  lastTime?: number;
  stride: number;
  walking: boolean;
  pose?: Pose;
  removedAt?: number;
};
export class ResidentView {
  nodes = new Map<number, Model>();
  constructor(public view: GameScene) {}
  reset() {
    for (const m of this.nodes.values()) {
      m.root.dispose();
      m.shadow.dispose();
    }
    this.nodes.clear();
  }
  create(id: number, type: string): Model {
    if (characterById(type)?.appearance === 'hound') return createHoundModel(this.view, id);
    if (characterById(type)?.construct) return createStonehandModel(this.view, id);
    return createDwarfModel(this.view, id, type);
  }
  update() {
    const v = this.view,
      time = v.world.elapsed;
    for (const [id, m] of this.nodes)
      if (!v.world.agents.some((a) => a.id === id)) {
        if ((m.actor?.health ?? 1) <= 0) {
          m.removedAt ??= time;
          const age = time - m.removedAt;
          m.root.rotation.z = (Math.min(1, age / 0.55) * Math.PI) / 2;
          m.root.position.y = -Math.min(0.12, age * 0.2);
          m.tool.setEnabled(false);
          m.load.setEnabled(false);
          m.book?.setEnabled(false);
          for (const weight of m.trainingWeights) weight.setEnabled(false);
          if (age < 2) continue;
        }
        m.root.dispose();
        m.shadow.dispose();
        this.nodes.delete(id);
      }
    for (const a of v.world.agents) {
      let m = this.nodes.get(a.id);
      if (!m) {
        m = this.create(a.id, a.type);
        this.nodes.set(a.id, m);
      }
      const dt = Math.max(0, Math.min(0.15, time - (m.lastTime ?? time))),
        distance = Math.hypot(a.x - (m.lastX ?? a.x), a.z - (m.lastZ ?? a.z));
      if (dt > 0) {
        m.walking = distance > 0.0005;
        m.stride += distance * 9;
      }
      m.lastTime = time;
      m.lastX = a.x;
      m.lastZ = a.z;
      m.actor = a;
      if (m.hound) {
        animateHound({ ...m, hound: m.hound }, a, time, reducedMotion(), dt);
        continue;
      }
      const walking = m.walking,
        j = a.job,
        working = !!j && !a.path.length && !walking,
        phase = m.stride,
        reduced = reducedMotion();
      m.root.position.set(a.x, walking ? Math.abs(Math.sin(phase)) * 0.025 : 0, a.z);
      m.root.rotation.set(0, a.facing, 0);
      m.root.scaling.y =
        1 + (reduced || characterById(a.type)?.construct ? 0 : Math.sin(time * 2 + a.id) * 0.008);
      m.shadow.position.set(a.x, 0.025, a.z);
      m.legs.forEach((leg, i) => (leg.rotation.x = walking ? Math.sin(phase + i * Math.PI) * 0.4 : 0));
      m.arm.rotation.x = walking ? Math.sin(phase) * 0.22 : 0;
      m.leftArm.rotation.x = walking ? -Math.sin(phase) * 0.35 : 0;
      m.arm.rotation.z = 0;
      m.leftArm.rotation.z = 0;
      const handsFree = working && ['sleep', 'eat', 'claim', 'train', 'research'].includes(j!.kind);
      m.tool.setEnabled(!handsFree);
      m.shield?.setEnabled(!handsFree);
      for (const weight of m.trainingWeights) weight.setEnabled(false);
      m.book?.setEnabled(
        a.activity !== 'Fighting' &&
          !a.carrying &&
          (!working || j?.kind === 'idle' || j?.kind === 'research'),
      );
      if (m.book && m.book.isEnabled()) {
        m.arm.rotation.x = -0.78;
        m.leftArm.rotation.x = -0.78;
        m.book.rotation.z = walking ? Math.sin(phase) * 0.025 : 0;
      }
      if (working && j) {
        // Keep room activities readable beside cosmetic props, within the real service tile.
        if (['sleep', 'eat', 'craft', 'train', 'research'].includes(j.kind)) {
          const decoration = v.world.furnishings.find((f) =>
            f.cells.some((p) => p.x === Math.round(a.x) && p.z === Math.round(a.z)),
          );
          if (decoration) {
            m.root.position.x += Math.sign(decoration.access.x - a.x) * 0.25;
            m.root.position.z += Math.sign(decoration.access.z - a.z) * 0.25;
          }
        }
        if (j.target.x !== j.work.x || j.target.z !== j.work.z)
          m.root.rotation.y = Math.atan2(j.target.x - j.work.x, j.target.z - j.work.z);
        if (
          j.kind === 'mine' ||
          j.kind === 'craft' ||
          j.kind === 'reinforce' ||
          j.kind === 'buildWall' ||
          j.kind === 'buildBridge'
        ) {
          const cycle = (j.progress % animationTuning.workBeat) / animationTuning.workBeat;
          const swing = cycle < 0.25 ? 1 - cycle * 8 : -1 + ((cycle - 0.25) / 0.75) * 2;
          m.arm.rotation.x = -0.75 + swing * 0.95;
          m.leftArm.rotation.x = -0.25;
          m.root.rotation.x = 0.06 + Math.max(0, swing) * 0.1;
        } else if (j.kind === 'claim') {
          m.root.position.y = characterById(a.type)?.construct ? -0.035 : -0.09;
          m.root.rotation.x = 0.35;
          m.arm.rotation.x = -0.9;
          m.leftArm.rotation.x = -0.6;
        } else if (j.kind === 'train') {
          const cycle = Math.sin(j.progress * 4);
          m.arm.rotation.x = -0.8 + cycle * 0.7;
          m.leftArm.rotation.x = -0.8 - cycle * 0.7;
          m.arm.rotation.z = 0.08;
          m.leftArm.rotation.z = -0.08;
          m.root.rotation.x = 0.1;
        } else if (j.kind === 'research') {
          m.arm.rotation.x = -0.88 - Math.sin(j.progress * 2) * 0.12;
          m.leftArm.rotation.x = -0.75;
          m.root.rotation.x = 0.08;
          m.root.rotation.z = Math.sin(j.progress * 1.2) * 0.02;
        } else if (j.kind === 'eat') {
          m.arm.rotation.x = -0.9 - Math.sin(j.progress * 4) * 0.35;
          m.leftArm.rotation.x = -0.7;
        } else if (j.kind === 'sleep') {
          m.root.position.y = 0.29;
          m.root.position.z += 0.32;
          m.root.rotation.set(-Math.PI / 2, 0, 0);
          m.arm.rotation.x = 0.1;
          m.leftArm.rotation.x = 0.1;
        }
      }
      if (j?.kind === 'activate' && working) {
        m.tool.setEnabled(false);
        m.shield?.setEnabled(false);
        m.arm.rotation.x = -1.15;
        m.leftArm.rotation.x = -1.15;
        m.root.rotation.x = 0.08;
      }
      if (a.activity === 'Fighting') {
        const strike = strikeEnvelope(time, a.attackedAt);
        m.arm.rotation.x = -0.45 - strike * 1.5;
        m.leftArm.rotation.x = -0.9;
        m.root.rotation.y += strike * 0.12;
      }
      const recoil = a.hitAt === undefined ? 0 : Math.max(0, 1 - (time - a.hitAt) / 0.25);
      if (recoil && !reduced) {
        m.root.rotation.x -= recoil * 0.16;
        m.root.rotation.z += recoil * 0.07;
      }
      m.load.setEnabled(a.carrying > 0);
      m.load.rotation.z = walking && !reduced ? Math.sin(phase) * 0.1 : 0;
      if (a.carrying && walking) {
        m.leftArm.rotation.x = -0.35;
        m.root.rotation.x = 0.06;
      }
      if (reduced) m.root.position.y = working && j?.kind === 'sleep' ? 0.22 : 0;
      // Ease changes between jobs and shortest-path turns, without moving feet away from simulation positions.
      const target: Pose = {
        rotation: [m.root.rotation.x, m.root.rotation.y, m.root.rotation.z],
        arms: [m.arm.rotation.x, m.arm.rotation.z, m.leftArm.rotation.x, m.leftArm.rotation.z],
        legs: m.legs.map((l) => l.rotation.x),
        y: m.root.position.y,
      };
      if (m.pose) {
        const blend = 1 - Math.exp(-dt * animationTuning.settleRate),
          mix = (before: number, after: number) => before + (after - before) * blend;
        target.rotation = target.rotation.map(
          (n, i) =>
            m.pose!.rotation[i] +
            Math.atan2(Math.sin(n - m.pose!.rotation[i]), Math.cos(n - m.pose!.rotation[i])) * blend,
        );
        if (time - (a.attackedAt ?? -Infinity) > 0.06)
          target.arms = target.arms.map((n, i) => mix(m.pose!.arms[i], n));
        target.legs = target.legs.map((n, i) => mix(m.pose!.legs[i], n));
        target.y = mix(m.pose.y, target.y);
      }
      m.pose = target;
      m.root.rotation.set(target.rotation[0], target.rotation[1], target.rotation[2]);
      m.root.position.y = target.y;
      m.arm.rotation.x = target.arms[0];
      m.arm.rotation.z = target.arms[1];
      m.leftArm.rotation.x = target.arms[2];
      m.leftArm.rotation.z = target.arms[3];
      m.legs.forEach((l, i) => (l.rotation.x = target.legs[i]));
      m.shadow.position.x = m.root.position.x;
      m.shadow.position.z = m.root.position.z;
    }
  }
}
