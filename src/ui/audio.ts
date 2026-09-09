import { audioSettings } from '../content/audio';
export const audioControls = () => `<fieldset class="audio-settings"><legend>Sound</legend>${(['master', 'music', 'effects'] as const).map(key => `<label>${key[0].toUpperCase() + key.slice(1)} <output data-audio-value="${key}">${Math.round(audioSettings[key] * 100)}%</output><input type="range" data-audio="${key}" aria-label="${key[0].toUpperCase() + key.slice(1)} volume" min="0" max="100" step="1" value="${Math.round(audioSettings[key] * 100)}"></label>`).join('')}<label class="toggle"><input type="checkbox" data-audio="muted" ${audioSettings.muted ? 'checked' : ''}> Mute sound</label></fieldset>`;
export function bindAudioControls(root: ParentNode, onChange: () => void = () => {}) {
  root.querySelectorAll<HTMLInputElement>('[data-audio]').forEach(input => input.oninput = () => {
    const key = input.dataset.audio as keyof typeof audioSettings;
    if (key === 'muted') audioSettings.muted = input.checked;
    else { audioSettings[key] = Math.max(0, Math.min(1, input.valueAsNumber / 100)); root.querySelector(`[data-audio-value="${key}"]`)!.textContent = `${input.value}%`; }
    onChange();
  });
}
export function createAudioDialog(onChange: () => void) {
  const dialog = document.createElement('dialog'); dialog.className = 'audio-dialog stone-panel'; dialog.setAttribute('aria-label', 'Sound settings');
  dialog.addEventListener('keydown', e => e.stopPropagation()); document.body.append(dialog);
  return { element: dialog, show() { dialog.innerHTML = `<h2>Sound settings</h2>${audioControls()}<button id="close-audio">Close</button>`; bindAudioControls(dialog, onChange); dialog.querySelector('#close-audio')!.addEventListener('click', () => dialog.close()); dialog.showModal(); } };
}
