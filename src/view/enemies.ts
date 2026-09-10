import { Vector3 } from '@babylonjs/core';
import type { GameScene } from './scene';
import type { Enemy } from '../game/types';
import { enemyById } from '../content/enemies';
import { visible } from '../game/spell-effects';
import { strikeEnvelope, turnToward } from '../content/animation';
import { buildEnemySculpt, type EnemySculptRig } from './enemy-models';

interface EnemyModel extends EnemySculptRig {
  x: number;
  z: number;
  phase: number;
  facing: number;
  elapsed: number;
  moving: boolean;
}
/** Concept-driven enemy sculpts keep the existing simulation-driven animation interface. */
export class EnemyView {
  models = new Map<number, EnemyModel>();
  constructor(public view: GameScene) {}
  reset() {
    for (const model of this.models.values()) model.root.dispose();
    this.models.clear();
  }
  /** Public for the original/current model comparison room; does not create a combat actor. */
  build(e: Enemy): EnemyModel {
    return {
      ...buildEnemySculpt(this.view, e),
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
        m?.root.dispose();
        this.models.delete(e.id);
        continue;
      }
      if (!m && !this.view.showAllEnemies && !visible(w, e)) continue;
      if (!m) {
        m = this.build(e);
        this.models.set(e.id, m);
      }
      const definition = enemyById(e.type),
        dead = e.health <= 0,
        pinned = e.pinnedUntil > w.elapsed,
        seen = this.view.showAllEnemies || visible(w, e),
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
        dt = m.elapsed < 0 ? 0.05 : Math.max(0, Math.min(0.15, w.elapsed - m.elapsed)),
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
