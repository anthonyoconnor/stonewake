import type { Point } from '../game/types.ts';

/** Floor remnants may be covered by dirt/rock; excavation does not repair or pay for them. */
export interface RuinDefinition {
  id: string;
  name: string;
  rooms: Array<{ type: string; cells: Point[] }>;
}

export const ruinTuning = { claimSeconds: 4, securityRadius: 4 };

/** Translate reusable room arrangements without imposing rectangular footprints. */
export function placeRuin(template: RuinDefinition, origin: Point, id = template.id): RuinDefinition {
  return { ...template, id, rooms: template.rooms.map(room => ({ ...room,
    cells: room.cells.map(p => ({ x: p.x + origin.x, z: p.z + origin.z })) })) };
}

export const ruinTemplates: Record<string, RuinDefinition> = {
  waystation: { id: 'waystation', name: 'Lost waystation', rooms: [
    { type: 'dormitory', cells: [{ x: 0, z: 0 }, { x: 1, z: 0 }, { x: 2, z: 0 }, { x: 0, z: 1 }] },
    { type: 'treasure', cells: [{ x: 0, z: 3 }, { x: 1, z: 3 }] },
  ] },
  foundry: { id: 'foundry', name: 'Abandoned foundry', rooms: [
    { type: 'workshop', cells: [{ x: 0, z: 0 }, { x: 1, z: 0 }, { x: 2, z: 0 }, { x: 0, z: 1 }, { x: 0, z: 2 }] },
    { type: 'kitchen', cells: [{ x: 3, z: 2 }, { x: 4, z: 2 }, { x: 4, z: 3 }] },
  ] },
  archive: { id: 'archive', name: 'Buried archive', rooms: [
    { type: 'library', cells: [{ x: 0, z: 0 }, { x: 1, z: 0 }, { x: 2, z: 0 }, { x: 2, z: 1 }, { x: 2, z: 2 }] },
    { type: 'training', cells: [{ x: 0, z: 3 }, { x: 1, z: 3 }, { x: 0, z: 4 }] },
  ] },
};
