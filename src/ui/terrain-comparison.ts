import { terrainComparisonViews } from '../content/terrain-comparison';
import { environmentPalettes } from '../content/environment-visuals';
import type { Sidebar } from './sidebar';

export function focusTerrainComparison(
  sidebar: Sidebar,
  id = 'overview',
  side: 'both' | 'starting' | 'refined' = 'both',
) {
  const target = terrainComparisonViews.find((v) => v.id === id)!;
  sidebar.controls.center(side === 'both' ? target.x : side === 'starting' ? 8.5 : 26.5, target.z);
  sidebar.view.camera.radius = target.radius * (side === 'both' ? 1 : 0.5);
  // Looking from negative Z keeps the archived west half on the left of the image.
  sidebar.view.camera.alpha = -Math.PI / 2;
  sidebar.view.camera.beta = 0.54;
}
export function showTerrainComparison(sidebar: Sidebar) {
  sidebar.panel.innerHTML = `<p class="eyebrow">ENVIRONMENT ARCHIVE</p><h2>Terrain &amp; rooms</h2>
    <p class="muted">Left: Starting · Right: Refined</p>
    <label>View<select id="terrain-comparison-view">${terrainComparisonViews.map((v) => `<option value="${v.id}">${v.name}</option>`).join('')}</select></label>
    <button id="terrain-comparison-focus" class="wide">Focus comparison</button>
    <div class="lab-actions"><button id="terrain-comparison-starting" title="Close view of the original half">Starting</button><button id="terrain-comparison-refined" title="Same close view of the refined half">Refined</button></div>
    <label>Region<select id="terrain-comparison-biome">${Object.keys(environmentPalettes)
      .map(
        (id) =>
          `<option value="${id}" ${id === sidebar.view.world.biome ? 'selected' : ''}>${({ upper: 'Upper caves', fungal: 'Fungal hollows', ancient: 'Ancient halls', crystal: 'Crystal caverns', volcanic: 'Volcanic depths' } as Record<string, string>)[id]}</option>`,
      )
      .join('')}</select></label>
    <div class="lab-actions"><button id="terrain-comparison-in" aria-label="Zoom closer" title="Zoom closer">＋</button><button id="terrain-comparison-out" aria-label="Zoom farther" title="Zoom farther">−</button></div>
    <details><summary>Comparison guide</summary><p class="muted">Both halves contain matching terrain, resources, claimed and raw floor, six normally built rooms, and water/lava/chasm crossings. Furniture and capacity come from ordinary construction. Bridges use normal pricing and completion. Pointer and local source lighting are disabled to keep the comparison even. Rotate and pan with the regular camera controls.</p></details>`;
  const selection = sidebar.panel.querySelector<HTMLSelectElement>('#terrain-comparison-view')!;
  selection.onchange = () => focusTerrainComparison(sidebar, selection.value);
  sidebar.panel.querySelector<HTMLButtonElement>('#terrain-comparison-focus')!.onclick = () =>
    focusTerrainComparison(sidebar, selection.value);
  sidebar.panel.querySelector<HTMLButtonElement>('#terrain-comparison-starting')!.onclick = () =>
    focusTerrainComparison(sidebar, selection.value, 'starting');
  sidebar.panel.querySelector<HTMLButtonElement>('#terrain-comparison-refined')!.onclick = () =>
    focusTerrainComparison(sidebar, selection.value, 'refined');
  sidebar.panel.querySelector<HTMLSelectElement>('#terrain-comparison-biome')!.onchange = (event) => {
    sidebar.view.world.biome = (event.target as HTMLSelectElement).value as keyof typeof environmentPalettes;
    sidebar.view.world.revision++;
    sidebar.view.setWorld(sidebar.view.world);
  };
  sidebar.panel.querySelector<HTMLButtonElement>('#terrain-comparison-in')!.onclick = () =>
    sidebar.controls.zoom(0.8);
  sidebar.panel.querySelector<HTMLButtonElement>('#terrain-comparison-out')!.onclick = () =>
    sidebar.controls.zoom(1.25);
}
