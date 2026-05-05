# Tab Out — Chrome Extension (V2 Rewrite)

## Quick Start

```bash
npm install
npm run dev          # Vite dev server with HMR (CRXJS)
```

Requires Node.js 22+ (project uses TypeScript 6.0 + Vite 8).

## Commands

```bash
npm run dev          # Vite dev server with HMR (CRXJS)
npm run build        # tsc + vite build → dist/
npm run preview      # preview production build
npm test             # vitest run (unit tests)
npm run test:watch   # vitest in watch mode
npm run lint         # eslint
```

## Architecture

Chrome Extension MV3 built with Vite + CRXJS. Two entry points:

- `src/newtab/` — React dashboard opened from the extension toolbar action
- `src/background/index.ts` — Service worker (badge updates)

CRXJS reads `manifest.json` at project root and resolves the background service worker. Keep `src/newtab/index.html` as an explicit Vite build input so the toolbar-opened dashboard remains bundled.

```
src/
├── types/index.ts              # All TypeScript interfaces
├── config/
│   ├── friendly-domains.ts     # 40+ domain name mappings
│   └── custom-groups.ts        # User-defined tab group rules
├── lib/
│   ├── constants.ts            # Shared constants (confetti, sound, animation)
│   ├── tab-grouper.ts          # Tab grouping by domain + dupe detection
│   ├── title-cleaner.ts        # Tab title normalization
│   ├── landing-pages.ts        # Landing page detection
│   ├── confetti.ts             # Confetti animation effects
│   └── sound.ts                # Sound effects
├── utils/
│   ├── storage.ts              # Chrome Storage with schema versioning + write queue
│   ├── badge.ts                # Badge color logic
│   ├── url.ts                  # URL parsing + sanitization
│   └── error.ts                # Error handling utilities
├── stores/                     # Zustand state management
│   ├── tab-store.ts            # Tab state, grouping, mutations
│   ├── saved-store.ts          # Saved/deferred items
│   ├── settings-store.ts       # User preferences
│   └── workspace-store.ts      # Workspace/session state
├── background/index.ts         # Service worker (badge updates)
├── newtab/                     # React dashboard page
│   ├── App.tsx, main.tsx, index.html
│   ├── components/             # 17 UI components (see below)
│   ├── hooks/                  # useChromeStorage, useKeyboard
│   └── styles/
│       ├── global.css          # Tailwind v4 @theme tokens (Notion design)
│       └── fonts.css           # @font-face declarations (local woff2)
└── __tests__/                  # Vitest unit tests
```

`public/` — Static assets bundled by Vite:
- `public/fonts/` — Local woff2 font files (Newsreader, DM Sans)
- `public/icons/` — Extension icons (16/48/128px)

`dist/` — Generated Chrome-ready output. Do NOT edit manually; rebuild it via `npm run build`.

## Key Dependencies

- **Zustand** (`^5.0`) — State management across 4 stores
- **@dnd-kit** (`core ^6`, `sortable ^10`) — Drag-and-drop for domain cards

## Key Files

- `manifest.json` — MV3 manifest (CRXJS reads this, not vite config)
- `vite.config.ts` — CRXJS plugin config
- `tsconfig.app.json` — App source, includes `chrome` types
- `tsconfig.node.json` — Build tooling (vite.config.ts)

## Testing

- Vitest with jsdom environment (`@testing-library/react`, `jsdom` in devDeps)
- Chrome API mocked via `vi.stubGlobal('chrome', {...})` in storage tests
- Test files: `badge`, `landing-pages`, `storage`, `tab-grouper`, `title-cleaner`, `url`
- Run: `npm test`

## Gotchas

- **CRXJS stable**: Use `@crxjs/vite-plugin@^2.4.0` (not beta). Supports Vite 8.
- **Import style**: CRXJS uses named export: `import { crx } from '@crxjs/vite-plugin'`
- **Tailwind v4**: Config lives in CSS via `@theme` directives, not `tailwind.config.ts`. `@tailwindcss/vite` plugin handles processing. lightningcss `@theme` warnings during build are expected and harmless.
- **Chrome types**: `@types/chrome` must be listed in `tsconfig.app.json` `types` array.
- **React 19**: Use `React.ReactElement` instead of `JSX.Element` for return types.
- **Storage write queue**: `storage.ts` uses a serial write queue to prevent race conditions during rapid read-modify-write. All mutations go through `writeStorage()`.
- **CSP constraint**: Manifest enforces `script-src 'self'` — no inline scripts, no CDN loads. Fonts must be local woff2 (already handled via `public/fonts/`).
- **No vitest.config**: Vitest runs with defaults via CLI. No separate config file.

## Style

- Notion-inspired design tokens in `global.css` (warm paper palette)
- Dark mode via `.dark` class toggle (system preference init in App.tsx)
- Fonts: Newsreader (headings) + DM Sans (body) — bundled as local woff2 for MV3 CSP compliance
- Immutable data patterns: spread/map for all state updates
