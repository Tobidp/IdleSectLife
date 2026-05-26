# IdleSectLife

Idle/incremental wuxia **sect management** game. Vanilla TypeScript + Vite, 100% client-side (saves to `localStorage`). Design lives in [PROJECT.md](PROJECT.md).

## Run

```bash
npm install
npm run dev        # dev server (http://localhost:5173)
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build
```

## Tests (headless)

```bash
npm run test       # runs both of the below
npm run test:sim   # simulates 1 year and asserts economy/disciple invariants
npm run test:ui    # renders every panel in jsdom and asserts the DOM builds
```

## Structure

```
src/
  core/        # time engine, RNG, game loop, save/load, controller
  domain/      # pure game logic: resources, sect, disciples, buildings, fame, market, simulation
  data/        # tunable constants: baseStats, costs, prices, balance, seasons, progression
  state/       # GameState shape, observable store, event log
  ui/          # panels, controls, components, render orchestrator
  main.ts      # entry point
```

All balance numbers are isolated in `src/data/` for easy playtesting tweaks.

## v1 scope

Found a sect → recruit disciples → assign their 3 daily actions (collect / train) → manage food,
resources and pavilions (Quarters, Warehouse) → grow fame to attract more disciples → upgrade the sect.

Disciple attributes level up as **stars (1–10) within a rank**; filling 10★ promotes to the next
cultivation rank (Mortal → Body Tempering → Qi Gathering → …) and resets the stars, getting slower
each rank but growing without a cap.

Missions, items, crafting, championships and extra sects are planned for v2+.
