import type { Sidebar } from './sidebar';
import { hearthSummary, requestHearthActivation } from '../game/hearth';
import { campaignSummary } from '../game/campaign';

export function mountHearth(sidebar: Sidebar) {
  const button = document.createElement('button');
  button.id = 'open-hearth';
  button.className = 'hearth-link';
  button.onclick = () => sidebar.show('hearth');
  sidebar.root.querySelector('.reserves')!.after(button);
  const terminal = document.createElement('section');
  terminal.id = 'level-outcome';
  terminal.className = 'level-outcome';
  terminal.hidden = true;
  terminal.innerHTML =
    '<strong id="outcome-title"></strong><p id="outcome-message"></p><button id="travel-onward" class="wide" hidden>Travel onward</button><button id="restart-area" class="wide">Restart area</button><button id="restart-campaign" class="wide" hidden>Begin a new journey</button><button id="outcome-menu" class="wide">Return to menu</button>';
  terminal.querySelector<HTMLButtonElement>('#outcome-menu')!.onclick=()=>sidebar.onMenu();
  terminal.querySelector<HTMLButtonElement>('#restart-area')!.onclick = () => sidebar.onRestartArea();
  terminal.querySelector<HTMLButtonElement>('#travel-onward')!.onclick = () => sidebar.onTravel();
  terminal.querySelector<HTMLButtonElement>('#restart-campaign')!.onclick = () => sidebar.onRestart();
  sidebar.root.querySelector('.utility-tools')!.before(terminal);
}

export function showHearth(sidebar: Sidebar) {
  sidebar.panel.innerHTML =
    '<h2 id="journey-title"></h2><p id="onward-status" role="status"></p><button id="activate-hearth" class="wide">Activate onward Hearthstone</button><details class="campaign-details"><summary>Journey &amp; activation</summary><p id="campaign-briefing"></p><p id="campaign-discovery"></p><p>A dwarf must reach the stone and secure it without interruption. Defend the starting Hearth to keep this area alive.</p><p id="campaign-carry"></p></details>';
  sidebar.panel.querySelector<HTMLButtonElement>('#activate-hearth')!.onclick = () => {
    sidebar.root.querySelector('#feedback')!.textContent = requestHearthActivation(sidebar.view.world);
    sidebar.update();
  };
}

export function updateHearth(sidebar: Sidebar) {
  const w = sidebar.view.world,
    s = hearthSummary(w), journey = campaignSummary(w);
  const link=sidebar.root.querySelector<HTMLButtonElement>('#open-hearth')!;
  const objective=w.outcome==='defeat'?'Hearth lost':s.ready?'Area complete':s.discovered?'Onward stone found':'Find the onward stone';
  link.textContent='◇ '+(s.maxHealth?Math.ceil(s.health)+' / '+s.maxHealth:'—')+(s.ready?'  ✓':s.discovered?'  →':'');
  link.title='Hearth · '+(s.maxHealth?Math.ceil(s.health)+' / '+s.maxHealth+' health':'Test world')+' · '+objective;
  link.setAttribute('aria-label',link.title);
  link.dataset.state=w.outcome==='defeat'?'lost':s.ready?'ready':s.discovered?'found':'searching';
  const title = sidebar.panel.querySelector('#journey-title');
  if (title) title.textContent = journey ? `${w.name} · ${journey.stage} / ${journey.total}` : w.name;
  const briefing = sidebar.panel.querySelector<HTMLElement>('#campaign-briefing');
  if (briefing) { briefing.hidden = !journey; briefing.textContent = journey?.briefing ?? ''; }
  const discovery = sidebar.panel.querySelector('#campaign-discovery');
  if (discovery) discovery.textContent = journey && s.discovered ? journey.discovery : 'Explore to discover the next runic connection.';
  const carry = sidebar.panel.querySelector('#campaign-carry');
  if (carry) carry.textContent = journey ? `${journey.knownSpells} researched spells carried into this area. Travel retains completed research and building unlocks; a fresh crew, economy and unprepared spells await. Restart area restores its arrival state.` : '';
  const onward = sidebar.panel.querySelector('#onward-status');
  if (onward)
    onward.textContent = s.ready
      ? journey?.completion ?? 'The onward Hearthstone is ready. This area is complete.'
      : `${s.name} · ${s.status}`;
  const activate = sidebar.panel.querySelector<HTMLButtonElement>('#activate-hearth');
  if (activate) {
    activate.disabled = !s.canRequest;
    activate.textContent = s.requested ? 'Activation requested' : 'Activate onward Hearthstone';
    activate.title = s.canRequest ? 'Send an available dwarf to awaken the onward Hearthstone.' : s.status;
  }
  const terminal = sidebar.root.querySelector<HTMLElement>('#level-outcome')!;
  terminal.hidden = !w.outcome;
  if (w.outcome) {
    terminal.dataset.outcome = w.outcome;
    terminal.querySelector('#outcome-title')!.textContent =
      w.outcome === 'defeat' ? 'The Hearth has fallen' : journey?.complete ? 'The runic routes are restored' : 'The onward Hearthstone is ready';
    terminal.querySelector('#outcome-message')!.textContent =
      w.outcome === 'defeat'
        ? 'Your stronghold is lost. Restart this area to try again.'
        : journey?.completion ?? 'This area is complete. The ancient network has awakened.';
    if (sidebar.selection.tool !== 'inspect') sidebar.selection.setTool('inspect');
  }
  const travel = terminal.querySelector<HTMLButtonElement>('#travel-onward')!;
  travel.hidden = !journey?.canTravel;
  travel.disabled = !journey?.canTravel;
  travel.textContent = journey?.nextName ? `Travel to ${journey.nextName}` : 'Travel onward';
  travel.title = 'Leave this settlement behind and begin the next area with a fresh crew. Research knowledge and building unlocks carry forward.';
  terminal.querySelector<HTMLButtonElement>('#restart-campaign')!.hidden = !journey?.complete;
}
