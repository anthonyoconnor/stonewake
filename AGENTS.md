# Project instructions

Read `README.md` and `development-plan.md` before development. Read the relevant design document before changing a system. The user's latest decisions take precedence over proposals, old prompts, and concept-art details.

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
- Update `development-plan.md` with verified progress, checks, provisional choices, and known limitations. Keep README run instructions and companion design documents accurate.

## Current authorization

The user authorized implementation of all milestones M1–M8, including M5.1, on 2026-09-07. Proceed through the sequence without requesting approval again for ordinary implementation, verification, or milestone commits. This authorization supersedes the earlier planning-only instruction. Do not claim a milestone complete until its required behavior has been implemented and verified.
