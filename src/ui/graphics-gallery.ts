import { graphicsGalleryEntries } from '../content/graphics-gallery';
import type { Sidebar } from './sidebar';

export function showGraphicsGallery(sidebar: Sidebar) {
  const gallery = sidebar.graphicsGallery!;
  sidebar.panel.innerHTML = `<p class="eyebrow">CHARACTER ARCHIVE</p><h2>Before &amp; after</h2>
    <p class="muted">Amber ring: starting model · Teal ring: revised model</p>
    <label>Character<select id="gallery-character">${graphicsGalleryEntries
      .map((e) => `<option value="${e.id}" ${e.id === gallery.selected ? 'selected' : ''}>${e.name}</option>`)
      .join('')}</select></label>
    <div class="lab-actions"><button id="gallery-previous" title="Previous character" aria-label="Previous character">←</button><button id="gallery-next" title="Next character" aria-label="Next character">→</button><button id="gallery-focus" title="Focus selected pair" aria-label="Focus selected pair">⌖</button><button id="gallery-overview" title="All sixteen pairs" aria-label="All sixteen pairs">▦</button></div>
    <div class="lab-actions"><button id="gallery-front">Front</button><button id="gallery-back">Back</button><button id="gallery-quarter" title="Turn both models" aria-label="Turn both models">↻</button><button id="gallery-in" title="Zoom closer" aria-label="Zoom closer">＋</button><button id="gallery-out" title="Zoom farther" aria-label="Zoom farther">−</button></div>
    <p id="gallery-status" class="muted">${graphicsGalleryEntries.find((e) => e.id === gallery.selected)!.name} · same scale and lighting</p>
    <details><summary>Comparison guide</summary><p class="muted">Original geometry and materials are archived. Each pair uses the same camera, physical scale and neutral studio lights. Turn rotates both models together. All pairs remain in this chamber; focus isolates one pair for detail review. Exhibits do not fight or consume resources.</p></details>`;
  const select = sidebar.panel.querySelector<HTMLSelectElement>('#gallery-character')!;
  const status = sidebar.panel.querySelector('#gallery-status')!;
  const focus = (id = select.value) => {
    gallery.focus(id);
    select.value = id;
    status.textContent = `${graphicsGalleryEntries.find((e) => e.id === id)!.name} · same scale and lighting`;
  };
  select.onchange = () => focus();
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
}
