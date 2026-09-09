import { arcanaGalleryEntries } from '../content/arcana-gallery';
import type { ArcanaState } from '../view/arcana-gallery';
import type { Sidebar } from './sidebar';

export function showArcanaGallery(s: Sidebar) {
  const g = s.arcanaGallery!;
  s.panel.innerHTML = `<p class="eyebrow">SPELLS · TRAPS · HEARTHSTONES</p><h2>Before &amp; after</h2>
  <p class="muted">Amber: starting · Teal: refined</p>
  <label>Exhibit<select id="arcana-item">${arcanaGalleryEntries.map((e) => `<option value="${e.id}" ${e.id === g.selected ? 'selected' : ''}>${e.name}</option>`).join('')}</select></label>
  <label>State<select id="arcana-state"><option value="ready">Ready / dormant</option><option value="active">Active / triggered</option><option value="finished">Spent / completed</option></select></label>
  <div class="lab-actions"><button id="arcana-play" aria-label="Play preview" title="Play preview">▶</button><button id="arcana-step" aria-label="Step one frame" title="Step one frame">▸│</button><button id="arcana-restart" aria-label="Restart preview" title="Restart preview">↤</button><label>Speed<select id="arcana-speed">${[0.25, 0.5, 1, 2].map((n) => `<option value="${n}" ${g.speed === n ? 'selected' : ''}>${n}×</option>`).join('')}</select></label></div>
  <div class="lab-actions"><button id="arcana-prev" aria-label="Previous exhibit" title="Previous exhibit">←</button><button id="arcana-next" aria-label="Next exhibit" title="Next exhibit">→</button><button id="arcana-focus" aria-label="Focus pair" title="Focus pair">⌖</button><button id="arcana-all" aria-label="All thirteen pairs" title="All thirteen pairs">▦</button></div>
  <div class="lab-actions"><button id="arcana-front">Front</button><button id="arcana-back">Back</button><button id="arcana-turn" aria-label="Turn both models" title="Turn both models">↻</button><button id="arcana-in" aria-label="Zoom closer" title="Zoom closer">＋</button><button id="arcana-out" aria-label="Zoom farther" title="Zoom farther">−</button></div>
  <div class="lab-actions"><button id="arcana-before">Starting</button><button id="arcana-after">Refined</button></div>
  <p id="arcana-status" class="muted"></p>
  <details id="arcana-concept"><summary>Concept art</summary><a id="arcana-concept-link" target="_blank" rel="noopener"><img id="arcana-concept-image" alt="Selected exhibit concept art" style="width:100%;margin-top:8px" loading="lazy"></a></details>
  <details><summary>Comparison guide</summary><p class="muted">Both versions share scale, lighting and preview time. Active previews loop; pause and step for close inspection. The same current models appear in play. Subjects only show how spells fit around a character; they never enter the simulation. Create Stonehand originally had no cast effect. Ready and Spent show the absence of temporary magic. Hearth states show dormant/activating/ready or intact/damaged/destroyed. Reduced motion follows Settings.</p></details>`;
  const item = s.panel.querySelector<HTMLSelectElement>('#arcana-item')!;
  const state = s.panel.querySelector<HTMLSelectElement>('#arcana-state')!;
  state.value = g.state;
  const stateLabels = () => {
    const entry = arcanaGalleryEntries.find((e) => e.id === g.selected)!;
    const labels =
      entry.id === 'stone-hearth'
        ? ['Intact', 'Damaged', 'Destroyed']
        : entry.id === 'onward-hearth'
          ? ['Dormant', 'Awakening', 'Ready']
          : entry.kind === 'trap'
            ? ['Armed', 'Triggered', 'Resetting']
            : ['Before cast', 'Active', 'Expired'];
    [...state.options].forEach((option, i) => {
      option.textContent = labels[i];
    });
  };
  stateLabels();
  const concept = s.panel.querySelector<HTMLDetailsElement>('#arcana-concept')!;
  const showConcept = () => {
    if (!concept.open) return;
    const entry = arcanaGalleryEntries.find((e) => e.id === g.selected)!;
    const path =
      entry.id === 'stone-hearth'
        ? 'rooms/stone-hearth-v2.png'
        : entry.id === 'onward-hearth'
          ? 'hearthstones/onward-hearthstone-v1.png'
          : `${entry.kind === 'trap' ? 'defenses' : 'spells'}/${entry.id}-v1.png`;
    const url = `/concept-art/${path}`;
    s.panel.querySelector<HTMLImageElement>('#arcana-concept-image')!.src = url;
    s.panel.querySelector<HTMLAnchorElement>('#arcana-concept-link')!.href = url;
  };
  concept.ontoggle = showConcept;
  const button = (id: string, fn: () => void) => {
    s.panel.querySelector<HTMLButtonElement>(id)!.onclick = fn;
  };
  const focus = (id = item.value) => {
    g.focus(id);
    item.value = id;
    stateLabels();
    updateArcanaGallery(s);
    showConcept();
  };
  item.onchange = () => focus();
  state.onchange = () => {
    g.setState(state.value as ArcanaState);
    updateArcanaGallery(s);
  };
  s.panel.querySelector<HTMLSelectElement>('#arcana-speed')!.onchange = (e) => {
    g.speed = Number((e.target as HTMLSelectElement).value);
  };
  const next = (n: number) =>
    focus(
      arcanaGalleryEntries[
        (arcanaGalleryEntries.findIndex((e) => e.id === g.selected) + n + arcanaGalleryEntries.length) %
          arcanaGalleryEntries.length
      ].id,
    );
  button('#arcana-prev', () => next(-1));
  button('#arcana-next', () => next(1));
  button('#arcana-focus', () => focus());
  button('#arcana-all', () => {
    g.showAll();
    updateArcanaGallery(s);
  });
  button('#arcana-front', () => g.rotate(0, true));
  button('#arcana-back', () => g.rotate(Math.PI, true));
  button('#arcana-turn', () => g.rotate(Math.PI / 4));
  button('#arcana-in', () => g.zoom(0.8));
  button('#arcana-out', () => g.zoom(1.25));
  button('#arcana-before', () => g.focusModel('before'));
  button('#arcana-after', () => g.focusModel('after'));
  button('#arcana-play', () => {
    g.playing = !g.playing;
    updateArcanaGallery(s);
  });
  button('#arcana-step', () => {
    g.step();
    updateArcanaGallery(s);
  });
  button('#arcana-restart', () => g.restart());
  updateArcanaGallery(s);
}
export function updateArcanaGallery(s: Sidebar) {
  const button = s.panel.querySelector<HTMLButtonElement>('#arcana-play');
  if (!button) return;
  const g = s.arcanaGallery!;
  button.textContent = g.playing ? 'Ⅱ' : '▶';
  button.title = g.playing ? 'Pause preview' : 'Play preview';
  button.setAttribute('aria-label', button.title);
  button.setAttribute('aria-pressed', String(g.playing));
  s.panel.querySelector('#arcana-status')!.textContent = g.overview
    ? '13 pairs · 26 starting and refined exhibits'
    : `${arcanaGalleryEntries.find((e) => e.id === g.selected)!.name} · ${g.time.toFixed(2)} s`;
}
