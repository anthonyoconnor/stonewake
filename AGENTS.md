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
- Consult approved concept art for visual direction. Use recognizable prototype geometry; do not treat concept sheets as production assets or fixed room templates.
- Run focused simulation checks and browser playtests for changed behavior. Avoid unrelated hardening and tests that merely duplicate implementation.
- Commit reasonable completed chunks and always commit at milestone completion. Check `git diff --check`, review the changes, and keep the working tree limited to intended work. Do not commit generated builds or dependencies.
- Keep `development-plan.md` focused on current status, unfinished work, provisional choices and known limitations. Move completed milestones and dated completion/verification records to `development-history.md`. Keep README run instructions and companion design documents accurate.

## Current authorization

The user authorized implementation of all milestones M1–M8, including M5.1, on 2026-09-07, and subsequently requested M9 after M8: review the concept art and add a graphics and animation pass to the existing game. M1–M9 are complete; verification is archived in `development-history.md`, and pending integrations and planned M10–M19 remain in `development-plan.md`. This authorization supersedes the earlier planning-only instruction for M1–M9. Continue to follow these development priorities for subsequent user-authorized work. Do not claim a milestone complete until its required behavior has been implemented and verified.
