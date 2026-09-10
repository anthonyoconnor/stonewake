# Project instructions

Read `README.md` and `development-plan.md` before development. Read the relevant design document before changing a system. The user's latest decisions take precedence over proposals, old prompts, and concept-art details.

Completed milestones and dated verification records are in [archive/development-history.md](archive/development-history.md). Read it only if past context is required; it is not routine startup reading.

## Development priorities

- Build this browser game with TypeScript and Babylon.js.
- Optimize for speed of development and frequent iteration. Prefer simple modules and the smallest working solution over production hardening.
- Do not add game saves, persistence infrastructure, multiplayer, accounts, cloud services, or production release machinery unless the user explicitly changes scope.
- Make characters, rooms, levels, and features easy to add through editable definitions, stable identifiers, shared services, and tunable values. Keep gameplay state independent of rendering and UI; avoid an elaborate framework.
- Maintain a quick local run/reload/reset workflow and usable debugging controls. Debug room construction must use the actual gameplay systems.
- Follow `room-development-checklist.md` for every room. Verify automatic furnishings, capacity, access, irregular layouts, and the free room construction flag.
- Preserve the single terrain layer, autonomous continuous movement, shared gold currency, and information in the left sidebar. Do not add floating world text, numbers, health bars, or progress bars.
- Use text sparingly in the left-hand in-game input panel. Prefer recognizable icons with enabled/disabled states and direct activation; keep costs and short status visible where useful, and put labels, explanations and secondary controls in tooltips or expandable details.
- Consult approved concept art for visual direction. Use recognizable prototype geometry; do not treat concept sheets as production assets or fixed room templates.
- Match verification to the change: documentation-only edits need no executable checks; small logic/balance changes need the relevant simulation tests and one source/test typecheck; UI/rendering changes add only the relevant browser check. Use a short browser check for a displayed value or control when it adds confidence. Full suites, production builds and broader browser playtests are for major integrations or milestones.
- Default to `npm run verify -- <focused scope or test>`; preview uncertain selection with `--list`. A request to choose a scope is for the developer/agent to resolve, not a reason to ask the user. Do not run unrelated spell, campaign or visual checks for a pricing change, or run typecheck again through `npm run build` after it has passed. Repeat/broaden checks only for new changes, failures or unresolved concerns.
- Preserve tests for meaningful gameplay failures; consolidate overlapping browser flows under selectable checks. Avoid tests that duplicate implementation, obsolete roster/level assumptions and unrelated hardening. Keep numerical design rules in their owning document and link to them rather than duplicating values in several documents.
- Commit reasonable completed chunks. Check `git diff --check`, review the changes, and keep the working tree limited to intended work. Do not commit generated builds or dependencies.
- Keep `development-plan.md` focused on current status, unfinished work, provisional choices and known limitations. Move historical scope and dated completion/verification records to `archive/development-history.md`. Keep README run instructions and companion design documents accurate.

## Current scope

The existing game and subsequent graphics/room overhauls are implemented. The active status, audio listening review and deferred scope are in [development-plan.md](development-plan.md). New implementation follows the user's current request; old milestone authorizations are historical and do not start new work. Prior authorization and milestone specifications are retained in [the archive](archive/README.md).

Preserve the permanent comparison renderers: `*-baseline.ts`, independent reference material caches, and `room-decoration-baseline.ts`. Use [graphics.md](graphics.md), [graphics-overhaul.md](graphics-overhaul.md), [room-overhaul.md](room-overhaul.md) and [arcana-overhaul.md](arcana-overhaul.md) for current visual direction and controls.

Keep active documentation focused on current behavior and new development. Archive superseded proposals, milestone specifications and dated verification rather than leaving contradictory historical text in the rules.
