# Project instructions

Read `README.md` and `development-plan.md` before development. Read the relevant design document before changing a system. The user's latest decisions take precedence over proposals, old prompts, and concept-art details.

Completed milestones and dated verification records are in [development-history.md](development-history.md). Read it only if past context is required; it is not routine startup reading.

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
- Commit reasonable completed chunks and always commit at milestone completion. Check `git diff --check`, review the changes, and keep the working tree limited to intended work. Do not commit generated builds or dependencies.
- Keep `development-plan.md` focused on current status, unfinished work, provisional choices and known limitations. Move completed milestones and dated completion/verification records to `development-history.md`. Keep README run instructions and companion design documents accurate.

## Current authorization

The user authorized implementation of all milestones M1–M8, including M5.1, on 2026-09-07, and subsequently requested M9 after M8: review the concept art and add a graphics and animation pass to the existing game. M1–M9 are complete; verification is archived in `development-history.md`, and pending integrations and unfinished milestones remain in `development-plan.md`. This authorization supersedes the earlier planning-only instruction for M1–M9. Continue to follow these development priorities for subsequent user-authorized work. Do not claim a milestone complete until its required behavior has been implemented and verified.

The user subsequently authorized implementing **M10 and M13 using agents in parallel** on 2026-09-07. This supersedes the planning-only status for those two milestones. Other unfinished milestones remain planned unless separately authorized. M10 and M13 are now implemented and verified; their completed scope/checks are in `development-history.md`. Keep coordinating shared files for future parallel work.

The user subsequently authorized **M11 and M14 in parallel** on 2026-09-07. They are now implemented and verified; accepted scope and checks are archived in `development-history.md`. Subsequent roadmap decisions and authorizations are recorded below.

The user subsequently authorized **M16** in this task. It is implemented and verified; its crossing scenario, bridge rules and completion checks are documented in the development plan, rooms/levels documents and development history.

The user subsequently authorized implementation of **M17, M18, M20, M21 and M22** in this task. M17 includes all ten current enemy concepts. These milestones are implemented and verified; completed scope/checks are archived in development-history.md. M19 was still planned at that point; its subsequent authorization is recorded below. M12 and M15 have been removed from the active roadmap and their guarding, retreat and door maintenance features remain deferred. Coordinate shared files during parallel implementation and verify each milestone before marking it complete.

The user subsequently authorized **M24, M25 and M25.1**, followed by creation of an **M33 test room**, on 2026-09-09. M24, M25, M25.1 and the M33 test room are implemented and verified. Full M33 gameplay lighting was still planned at that point; its subsequent implementation is recorded below. Completed scope and checks are archived in development-history.md.

The user subsequently authorized **all remaining active milestones: M26–M33 and M19** in this task. Implement and verify them in dependency order, using parallel agents with coordinated file ownership. M12 and M15 remain removed from the active roadmap; deferred features outside these milestones are not reinstated.

M19, M26–M29 and M31–M33 are now implemented and verified, including the full authored campaign and final simulation/browser checks. M30 audio is implemented with playback/control checks passed; listening review remains pending. Use development-plan.md for the current remaining work and development-history.md for completed verification.

The user subsequently authorized a substantial **character and terrain graphics overhaul** on 2026-09-09. It is implemented and verified: all six residents and ten enemies were individually refined against their concepts; starting renderers are preserved in permanent comparison studios; new cohesion concepts and runtime surface assets guide terrain and whole-level refinement. Use `graphics-overhaul.md` for the current visual direction, reference controls and practical limits. Preserve the `*-baseline.ts` archive and its separate materials during later visual changes. M30 listening review remains pending.

The user subsequently authorized a **spell, trap and Hearthstone graphics overhaul** on 2026-09-09. All nine current spells, both traps and both Hearthstones are implemented and verified against individual concepts, with twelve new concept sheets and a permanent thirteen-pair `arcana-gallery`. Use `arcana-overhaul.md` for concepts, iteration notes, controls and verification. Preserve the starting effect/prop renderers and their independent `arcana-*-baseline.ts` material/geometry archives during future visual work. Gameplay rules and prices remain unchanged. M30 listening review remains pending.
