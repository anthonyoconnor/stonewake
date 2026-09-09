import { combatTeams, combatOpponents, combatResult, defaultCombatSetup, type CombatSetup } from '../content/combat-lab';
import { characterLevel } from '../content/characters';
import { enemyById } from '../content/enemies';
import { recipes } from '../content/recipes';
import { spellDefinitions } from '../content/spells';
import type { Sidebar } from './sidebar';

export function showCombatLab(sidebar: Sidebar) {
  const setup = sidebar.view.world.combatTest ?? defaultCombatSetup;
  sidebar.panel.innerHTML = `<p class="eyebrow">COMBAT TEST ROOM</p>
    <label>Defenders<select id="combat-team">${combatTeams.map(t => `<option value="${t.id}" ${setup.team === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}</select></label>
    <label>Encounter<select id="combat-opponent">${combatOpponents.map(t => `<option value="${t.id}" ${setup.opponent === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}</select></label>
    <label>Support<select id="combat-support"><option value="none">None</option><option value="traps">Two bolt traps · supplied stock</option><option value="spells">Library · prepared test spells</option></select></label>
    <button id="combat-reset" class="wide">Load / reset matchup</button>
    <p class="muted">Starts paused. Matchups use ordinary combat, abilities and XP. Test allowance and placement bypass settlement preparation; arrivals are off.</p>
    <div id="combat-results" role="status"></div><details><summary>Roster &amp; normal costs</summary><div id="combat-stats"></div></details>`;
  sidebar.panel.querySelector<HTMLSelectElement>('#combat-support')!.value = setup.support;
  sidebar.panel.querySelector<HTMLButtonElement>('#combat-reset')!.onclick = () => {
    const value = (id: string) => sidebar.panel.querySelector<HTMLSelectElement>(`#combat-${id}`)!.value;
    sidebar.combatSetup = { team: value('team'), opponent: value('opponent'), support: value('support') as CombatSetup['support'] };
    sidebar.onLab(true, 'combat');
  };
  if (setup.support === 'spells') {
    const spells = document.createElement('button'); spells.className = 'wide'; spells.textContent = 'Cast prepared spells';
    spells.onclick = () => sidebar.show('spells'); sidebar.panel.append(spells);
  }
  const team = combatTeams.find(t => t.id === setup.team)!;
  const stats = characterLevel(team.type, team.level);
  sidebar.panel.querySelector('#combat-stats')!.innerHTML = `<p>${team.name}: ${stats.health} health each · ${stats.damage} damage / ${stats.attackSeconds}s · ${stats.wage} gold per payday each.</p>
    ${combatOpponents.find(o => o.id === setup.opponent)!.roster.map(id => { const e = enemyById(id); return `<p>${e.name}: ${e.health} health · ${e.damage} damage / ${e.attackSeconds}s. ${e.description}</p>`; }).join('')}
    <p>Hounds need only den places. Warriors also need Kitchen and Training Room support; trained levels require actual practice or combat in normal play.</p>
    <p>Two bolt traps cost ${2 * recipes.find(r => r.id === 'bolt-trap')!.cost} gold in production, plus a staffed Workshop. Library preparation needs a Runesmith; casting still charges the normal cost: ${spellDefinitions.map(s => `${s.name} ${s.cost}`).join(', ')} gold.</p>`;
}
export function updateCombatLab(sidebar: Sidebar) {
  const output = sidebar.panel.querySelector('#combat-results');
  if (!output || !sidebar.view.world.combatTest) return;
  const w = sidebar.view.world, result = combatResult(w), setup = w.combatTest!;
  output.textContent = `${result.result} · ${w.elapsed.toFixed(1)}s · Defenders ${result.residents}/${setup.initialResidents} (${result.residentHealth} health) · Enemies ${result.enemies}/${setup.initialEnemies} (${result.enemyHealth} health)`;
}
