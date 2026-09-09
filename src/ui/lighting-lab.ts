import { lightingDefaults, lightingViews, type LightingSettings } from '../content/lighting-lab';
import type { Sidebar } from './sidebar';

const sliders = [
  ['ambient', 'Ambient light', 0, 1, 0.02],
  ['rim', 'Directional light', 0, 1.5, 0.02],
  ['sourceStrength', 'Source intensity', 0, 6, 0.1],
  ['sourceRadius', 'Source radius', 2, 9, 0.5],
  ['glow', 'Source glow', 0, 1.5, 0.05],
  ['pointerStrength', 'Pointer intensity', 0, 4, 0.1],
  ['pointerRadius', 'Pointer radius', 1, 7, 0.5],
] as const;
export function showLightingLab(sidebar: Sidebar, settings: LightingSettings) {
  sidebar.panel.innerHTML = `<p class="eyebrow">M33 LIGHTING TEST ROOM</p>
    <label class="toggle"><input id="lab-lighting-enabled" type="checkbox" ${settings.enabled ? 'checked' : ''}> Experimental lighting</label>
    <label>View<select id="lighting-view">${lightingViews.map((v) => `<option value="${v.id}">${v.name}</option>`).join('')}</select></label>
    <button id="lighting-locate" class="wide">Go to view</button>
    <label class="toggle"><input id="lab-pointer-light" type="checkbox" ${settings.pointer ? 'checked' : ''}> Pointer illumination</label>
    ${sliders.map(([id, name, min, max, step]) => `<label>${name} <output id="light-value-${id}">${settings[id]}</output><input class="lighting-slider" aria-label="${name}" data-light="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${settings[id]}"></label>`).join('')}
    <p id="lighting-status" role="status" class="muted"></p><button id="lighting-defaults" class="wide">Restore lighting defaults</button><button id="lighting-reset" class="wide">Reset lighting test room</button>
    <details><summary>Test layout &amp; controls</summary><p>Toggle experimental lighting to compare the current game renderer. Pan, rotate and zoom with the usual controls. The six nearest eligible sources light surfaces; hidden sources and surfaces are excluded.</p><p>Includes paid/free ordinary rooms: a single treasury, narrow/irregular Dormitory and Library, bedrock in the Kitchen, working Workshop, Training Room, cosmetic furniture, residents and stationary enemy samples. Resume to observe ordinary work and combat. Use Debug → Room layouts to build other footprints.</p><p>The northern pocket remains under fog. Its hidden lava must not spill light through the rock. Gold and gems keep their ordinary through-fog visibility.</p><p>These settings affect only this test world. Full M33 biome lighting and campaign integration remain planned.</p></details>`;
  sidebar.panel.querySelector<HTMLInputElement>('#lab-lighting-enabled')!.onchange = (e) =>
    (settings.enabled = (e.target as HTMLInputElement).checked);
  sidebar.panel.querySelector<HTMLInputElement>('#lab-pointer-light')!.onchange = (e) =>
    (settings.pointer = (e.target as HTMLInputElement).checked);
  sidebar.panel.querySelectorAll<HTMLInputElement>('[data-light]').forEach(
    (input) =>
      (input.oninput = () => {
        const id = input.dataset.light as (typeof sliders)[number][0];
        settings[id] = input.valueAsNumber;
        sidebar.panel.querySelector(`#light-value-${id}`)!.textContent = input.value;
      }),
  );
  sidebar.panel.querySelector<HTMLButtonElement>('#lighting-locate')!.onclick = () => {
    const id = sidebar.panel.querySelector<HTMLSelectElement>('#lighting-view')!.value,
      v = lightingViews.find((v) => v.id === id)!;
    sidebar.controls.center(v.x, v.z);
    sidebar.view.camera.radius = v.radius;
  };
  sidebar.panel.querySelector<HTMLButtonElement>('#lighting-defaults')!.onclick = () => {
    Object.assign(settings, lightingDefaults);
    sidebar.show('lighting');
  };
  sidebar.panel.querySelector<HTMLButtonElement>('#lighting-reset')!.onclick = () =>
    sidebar.onLab(true, 'lighting');
}
