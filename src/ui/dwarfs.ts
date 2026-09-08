import { characterDefinitions } from '../content/characters';
import type { Resident } from '../game/types';
import type { Sidebar } from './sidebar';
import { actionIcon } from './icons';

export const activities = [
  { id: 'idle', name: 'Idle', icon: 'activity-idle', help: 'Idle or waiting for reachable work' },
  { id: 'work', name: 'Working', icon: 'dig', help: 'Work, hauling, training or securing a Hearthstone' },
  { id: 'needs', name: 'Needs', icon: 'kitchen', help: 'Eating, resting, collecting pay or leaving' },
  { id: 'combat', name: 'Combat', icon: 'training', help: 'Fighting, pursuing enemies or answering a rally' },
] as const;
export function dwarfActivity(a: Resident): string {
  if (a.morale?.leaving) return 'needs';
  if (a.combatTarget !== undefined || a.rallying) return 'combat';
  if (a.job && ['eat', 'sleep', 'pay'].includes(a.job.kind)) return 'needs';
  return a.job && a.job.kind !== 'idle' ? 'work' : 'idle';
}
const roleIcons: Record<string, string> = { 'cave-hound':'cave-hound', stonehand: 'stonehand', miner: 'dig', engineer: 'workshop', warrior: 'guard', runesmith: 'library' };
const filters = new WeakMap<Sidebar, { type: string; activity?: string }>();

export function showDwarfs(s: Sidebar) {
  filters.delete(s);
  s.panel.innerHTML = `<p class="eyebrow">WORKFORCE ACTIVITY <span id="activity-total"></span></p>
    <table class="dwarf-activity" aria-label="Workforce by role and activity"><thead><tr><th scope="col"><span class="sr-only">Role</span></th>${activities.map(a => `<th scope="col" title="${a.help}">${actionIcon(a.icon)}<span class="sr-only">${a.name}</span></th>`).join('')}</tr></thead>
    <tbody>${characterDefinitions.map(c => `<tr><th scope="row"><button data-dwarf-role="${c.id}" title="${c.name}: show all" aria-label="${c.name}: show all">${actionIcon(roleIcons[c.id] ?? 'guard')}</button></th>${activities.map(a => `<td><button data-dwarf-count="${c.id}:${a.id}" aria-pressed="false">0</button></td>`).join('')}</tr>`).join('')}</tbody></table>
    <p class="activity-hint">Choose a count to inspect workers.</p><p id="dwarf-filter" class="eyebrow"></p><div id="residents-list"></div>
    <details class="population-details"><summary>Pay & wellbeing</summary><div id="population-management"><div id="arrival-status" class="muted"></div></div></details>`;
  s.panel.querySelectorAll<HTMLButtonElement>('[data-dwarf-count], [data-dwarf-role]').forEach(b => b.onclick = () => {
    const [type, activity] = (b.dataset.dwarfCount ?? b.dataset.dwarfRole!).split(':');
    filters.set(s, { type, activity });
    s.update();
  });
}

export function updateDwarfs(s: Sidebar): Resident[] {
  const w = s.view.world, filter = filters.get(s);
  const total = s.panel.querySelector('#activity-total');
  if (!total) return [];
  total.textContent = String(w.agents.length);
  s.panel.querySelectorAll<HTMLButtonElement>('[data-dwarf-count]').forEach(b => {
    const [type, activity] = b.dataset.dwarfCount!.split(':');
    const count = w.agents.filter(a => a.type === type && dwarfActivity(a) === activity).length;
    const label = `${characterDefinitions.find(c => c.id === type)!.name} · ${activities.find(a => a.id === activity)!.name}: ${count}`;
    b.textContent = String(count); b.title = label; b.setAttribute('aria-label', label);
    b.classList.toggle('empty', count === 0);
    b.setAttribute('aria-pressed', String(filter?.type === type && filter.activity === activity));
  });
  const selected = filter ? w.agents.filter(a => a.type === filter.type && (!filter.activity || dwarfActivity(a) === filter.activity)) : [];
  s.panel.querySelector('#dwarf-filter')!.textContent = filter ? `${characterDefinitions.find(c => c.id === filter.type)?.name} · ${activities.find(a => a.id === filter.activity)?.name ?? 'All'} · ${selected.length}` : '';
  return selected;
}
