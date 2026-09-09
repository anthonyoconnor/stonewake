import { graphicsGalleryEntries } from '../content/graphics-gallery';
import type { Sidebar } from './sidebar';
import type { GalleryClip } from '../view/gallery-playback';

export function showGraphicsGallery(sidebar: Sidebar) {
  const gallery = sidebar.graphicsGallery!;
  sidebar.panel.innerHTML = `<p class="eyebrow">CHARACTER ARCHIVE</p><h2>Before &amp; after</h2>
    <p class="muted">Amber ring: starting model · Teal ring: revised model</p>
    <label>Character<select id="gallery-character">${graphicsGalleryEntries
      .map((e) => `<option value="${e.id}" ${e.id === gallery.selected ? 'selected' : ''}>${e.name}</option>`)
      .join('')}</select></label>
    <label>Animation<select id="gallery-animation"></select></label>
    <div class="lab-actions"><button id="gallery-play" title="Play animation" aria-label="Play animation">▶</button><button id="gallery-step" title="Step one frame" aria-label="Step one frame">▸│</button><button id="gallery-restart" title="Restart animation" aria-label="Restart animation">↤</button><label>Speed<select id="gallery-speed">${[0.25, 0.5, 1, 2].map((speed) => `<option value="${speed}" ${speed === gallery.speed ? 'selected' : ''}>${speed}×</option>`).join('')}</select></label></div>
    <div class="lab-actions"><button id="gallery-previous" title="Previous character" aria-label="Previous character">←</button><button id="gallery-next" title="Next character" aria-label="Next character">→</button><button id="gallery-focus" title="Focus selected pair" aria-label="Focus selected pair">⌖</button><button id="gallery-overview" title="All sixteen pairs" aria-label="All sixteen pairs">▦</button></div>
    <div class="lab-actions"><button id="gallery-front">Front</button><button id="gallery-back">Back</button><button id="gallery-quarter" title="Turn both models" aria-label="Turn both models">↻</button><button id="gallery-in" title="Zoom closer" aria-label="Zoom closer">＋</button><button id="gallery-out" title="Zoom farther" aria-label="Zoom farther">−</button></div>
    <div class="lab-actions"><button id="gallery-before" title="Focus starting model">Starting</button><button id="gallery-after" title="Focus refined model">Refined</button></div>
    <p id="gallery-status" class="muted">${graphicsGalleryEntries.find((e) => e.id === gallery.selected)!.name} · same scale and lighting</p>
    <details><summary>Comparison guide</summary><p class="muted">Choose an animation to play both versions in sync. Pause, slow down or step through it. Walking stays on the plinth; activities and attacks preview the same poses used in play. Reduced motion follows Settings. Starting and Refined focus one model for close inspection; the wheel and + controls have no minimum viewing distance. Original geometry and materials remain archived. Exhibits do not fight or consume resources.</p></details>`;
  const select = sidebar.panel.querySelector<HTMLSelectElement>('#gallery-character')!;
  const animation = sidebar.panel.querySelector<HTMLSelectElement>('#gallery-animation')!;
  const refreshAnimations = () => {
    animation.innerHTML = gallery.clips
      .map(
        (option) =>
          `<option value="${option.id}" ${option.id === gallery.clip ? 'selected' : ''}>${option.label}</option>`,
      )
      .join('');
    updateGraphicsGallery(sidebar);
  };
  const status = sidebar.panel.querySelector('#gallery-status')!;
  const focus = (id = select.value) => {
    gallery.focus(id);
    select.value = id;
    status.textContent = `${graphicsGalleryEntries.find((e) => e.id === id)!.name} · same scale and lighting`;
    refreshAnimations();
  };
  select.onchange = () => focus();
  animation.onchange = () => {
    gallery.setClip(animation.value as GalleryClip);
    updateGraphicsGallery(sidebar);
  };
  sidebar.panel.querySelector<HTMLSelectElement>('#gallery-speed')!.onchange = (event) => {
    gallery.speed = Number((event.target as HTMLSelectElement).value);
  };
  const click = (id: string, action: () => void) => {
    sidebar.panel.querySelector<HTMLButtonElement>(id)!.onclick = action;
  };
  const next = (offset: number) =>
    focus(
      graphicsGalleryEntries[
        (graphicsGalleryEntries.findIndex((e) => e.id === select.value) +
          offset +
          graphicsGalleryEntries.length) %
          graphicsGalleryEntries.length
      ].id,
    );
  click('#gallery-previous', () => next(-1));
  click('#gallery-next', () => next(1));
  click('#gallery-focus', () => focus());
  click('#gallery-overview', () => {
    gallery.showAll();
    status.textContent = '16 pairs · 32 archived and revised models';
  });
  click('#gallery-front', () => gallery.rotate(0, true));
  click('#gallery-back', () => gallery.rotate(Math.PI, true));
  click('#gallery-quarter', () => gallery.rotate(Math.PI / 4));
  click('#gallery-in', () => gallery.zoom(0.8));
  click('#gallery-out', () => gallery.zoom(1.25));
  click('#gallery-before', () => gallery.focusModel('before'));
  click('#gallery-after', () => gallery.focusModel('after'));
  click('#gallery-play', () => {
    gallery.setPlaying(!gallery.playing);
    updateGraphicsGallery(sidebar);
  });
  click('#gallery-step', () => {
    gallery.step();
    updateGraphicsGallery(sidebar);
  });
  click('#gallery-restart', () => gallery.restart());
  refreshAnimations();
}

export function updateGraphicsGallery(sidebar: Sidebar) {
  const button = sidebar.panel.querySelector<HTMLButtonElement>('#gallery-play');
  if (!button) return;
  const playing = sidebar.graphicsGallery!.playing;
  button.textContent = playing ? 'Ⅱ' : '▶';
  button.title = playing ? 'Pause animation' : 'Play animation';
  button.setAttribute('aria-label', button.title);
  button.setAttribute('aria-pressed', String(playing));
}
