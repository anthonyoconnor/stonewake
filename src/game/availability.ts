import type { World } from './types.ts';

/** Arrival knowledge is explicit in normal sessions. Harness worlds omit it. */
export interface ContentAvailability {
  buildings: string[];
  roles: string[];
  recipes: string[];
  spells: string[];
}
export type AvailabilityKind = keyof ContentAvailability;
export const copyAvailability = (value: ContentAvailability): ContentAvailability => ({
  buildings: [...value.buildings], roles: [...value.roles], recipes: [...value.recipes], spells: [...value.spells],
});
export function contentAllowed(w: World, kind: AvailabilityKind, id: string) {
  return !w.availability || w.availability[kind].includes(id);
}
export const roomAllowed = (w: World, id: string) => contentAllowed(w, 'buildings', id);
export const buildingAllowed = roomAllowed;
export const roleAllowed = (w: World, id: string) => contentAllowed(w, 'roles', id);
export const recipeAllowed = (w: World, id: string) => contentAllowed(w, 'recipes', id);
export const spellAllowed = (w: World, id: string) => contentAllowed(w, 'spells', id);
export function availabilityReason(w: World, kind: AvailabilityKind, id: string) {
  if (contentAllowed(w, kind, id)) return '';
  if (id === 'bridge') return 'Stonebridge plans are recovered on arrival at Royal Deep.';
  return w.campaign ? 'This knowledge is recovered in a later campaign area.' : 'This area does not include these starting plans.';
}
