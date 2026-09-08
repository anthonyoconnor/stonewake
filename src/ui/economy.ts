import type { Sidebar } from './sidebar';
import { addResidents } from '../game/simulation';
import { minerPurchaseStatus, purchaseMiner } from '../game/recruitment';
import { payrollStatus, wageStatus } from '../game/wages';
import { characterById } from '../content/characters';
import type { Resident, World } from '../game/types';

export function mountEconomy(sidebar: Sidebar) {
  const section = document.createElement('section');
  section.className = 'spell-card';
  section.innerHTML = '<h3>Recruit a Miner</h3><button id="buy-miner" class="wide"></button><p id="miner-purchase-status" class="muted"></p><h3>Payday</h3><p id="payroll-status" class="muted"></p>';
  section.querySelector<HTMLButtonElement>('#buy-miner')!.onclick = () => {
    const w = sidebar.view.world;
    const result = purchaseMiner(w, (type, origin) => addResidents(w, type, 1, origin) > 0);
    sidebar.root.querySelector('#feedback')!.textContent = result.message;
    sidebar.update();
  };
  sidebar.panel.querySelector('#arrival-status')!.before(section);
}

export function updateEconomy(sidebar: Sidebar) {
  const button = sidebar.panel.querySelector<HTMLButtonElement>('#buy-miner');
  if (!button) return;
  const w = sidebar.view.world, quote = minerPurchaseStatus(w), payroll = payrollStatus(w);
  button.textContent = `Recruit Miner · ${quote.price} gold`;
  button.disabled = !quote.eligible;
  sidebar.panel.querySelector('#miner-purchase-status')!.textContent = `${quote.miners} living Miners. ${quote.message}`;
  sidebar.panel.querySelector('#payroll-status')!.textContent = payroll.unpaid
    ? `${payroll.due} gold owed to ${payroll.unpaid} dwarfs. ${payroll.overdue} overdue · ${payroll.noGold} short of reachable gold · ${payroll.noAccess} without treasury access. Dwarfs collect pay in person.`
    : w.agents.length ? `All wages paid. Next payday in ${Math.max(0, Math.ceil(payroll.nextAt - w.elapsed))} seconds. Dwarfs visit a Treasure Room or the Hearth treasury.` : 'No residents to pay.';
}

export function residentPayText(w: World, a: Resident) {
  return `Wage ${characterById(a.type)?.wage ?? 0} gold · ${wageStatus(w,a).message}`;
}
