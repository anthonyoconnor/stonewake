import type { Sidebar } from './sidebar';
import { payrollStatus, wageStatus } from '../game/wages';
import { characterLevel, earnsWages } from '../content/characters';
import type { Resident, World } from '../game/types';

export function mountEconomy(sidebar: Sidebar) {
  const section = document.createElement('section');
  section.className = 'spell-card';
  section.innerHTML = '<h3>Payday</h3><p id="payroll-status" class="muted"></p>';
  sidebar.panel.querySelector('#arrival-status')!.before(section);
}

export function updateEconomy(sidebar: Sidebar) {
  const status = sidebar.panel.querySelector('#payroll-status');
  if (!status) return;
  const w = sidebar.view.world, payroll = payrollStatus(w);
  status.textContent = payroll.unpaid
    ? `${payroll.due} gold owed to ${payroll.unpaid} dwarfs. ${payroll.overdue} overdue · ${payroll.noGold} short of reachable gold · ${payroll.noAccess} without treasury access. Dwarfs collect pay in person.`
    : w.agents.some(a=>earnsWages(a.type)) ? `All wages paid. Next payday in ${Math.max(0, Math.ceil(payroll.nextAt - w.elapsed))} seconds. Dwarfs visit a Treasure Room or the Hearth treasury.` : 'No dwarfs to pay. Animals and Stonehands need no wages.';
}

export function residentPayText(w: World, a: Resident) {
  if(!earnsWages(a.type))return 'No wages.';
  return `Wage ${characterLevel(a.type, a.level).wage} gold · ${wageStatus(w,a).message}`;
}
