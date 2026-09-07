import {settings,settingValues,applySettings} from '../content/settings';
export class TuningDialog {
 element=document.createElement('dialog');draft=settingValues();tab=settings[0].group;
 onApply:()=>void=()=>{};
 constructor(){
  this.element.className='tuning-dialog';this.element.setAttribute('aria-label','Game configuration');document.body.append(this.element);
  this.element.addEventListener('keydown',e=>e.stopPropagation());
 }
 get open(){return this.element.open;}
 show(){this.draft=settingValues();this.render();this.element.showModal();}
 render(){
  this.element.innerHTML=`<header><div><p class="eyebrow">DEVELOPMENT TOOLS</p><h2>Game configuration</h2></div><button id="close-tuning" aria-label="Close configuration">×</button></header><p class="muted">Simulation pauses while this window is open. Apply values for this session; reload the page to restore source defaults.</p><nav role="tablist" aria-label="Configuration groups">${[...new Set(settings.map(s=>s.group))].map((g,i)=>`<button role="tab" id="settings-tab-${i}" aria-controls="settings-fields" aria-selected="${g===this.tab}" data-tab="${g}">${g}</button>`).join('')}</nav><form><div id="settings-fields" role="tabpanel" aria-label="${this.tab}">${settings.filter(s=>s.group===this.tab).map(s=>`<label class="setting"><span>${s.label}<small>${s.note}</small></span><input aria-label="${s.label}" data-setting="${s.id}" type="number" min="${s.min}" max="${s.max}" step="any" value="${this.draft[s.id]}" required></label>`).join('')}</div><p id="settings-error" role="alert"></p><footer><button type="button" id="reset-tuning">Reset all to defaults</button><button type="button" id="export-tuning">Export values</button><button type="submit">Apply changes</button></footer></form>`;
  this.element.querySelector<HTMLButtonElement>('#close-tuning')!.onclick=()=>this.element.close();
  this.element.querySelectorAll<HTMLInputElement>('[data-setting]').forEach(input=>input.oninput=()=>this.draft[input.dataset.setting!]=input.valueAsNumber);
  this.element.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(b=>b.onclick=()=>{this.tab=b.dataset.tab!;this.render();});
  this.element.querySelector<HTMLButtonElement>('#reset-tuning')!.onclick=()=>{this.draft=Object.fromEntries(settings.map(s=>[s.id,s.defaultValue]));this.render();};
  this.element.querySelector<HTMLButtonElement>('#export-tuning')!.onclick=()=>{
   const link=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(this.draft,null,2)],{type:'application/json'}));link.href=url;link.download='stronghold-tuning.json';link.click();URL.revokeObjectURL(url);
  };
  this.element.querySelector('form')!.onsubmit=e=>{e.preventDefault();const error=applySettings(this.draft);this.element.querySelector('#settings-error')!.textContent=error;if(!error){this.onApply();this.element.close();}};
 }
}
