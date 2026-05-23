# CLAUDE.md

This file provides guidance to Claude Code (`claude.ai/code`) when working with code in this repository.

## What is Ketcher
Ketcher is an open-source **chemical structure editor** built with TypeScript and React. It renders molecules, reactions, macromolecules, and monomers using a custom MVC architecture over SVG.

## Prerequisites
- Node.js >= 24.14.1
- npm >= 7.0.0 (yarn is not used)
- All `npm install` commands must be run from the **root directory**

## Commands

### Install
```sh
npm install
```

### Development (fast, Vite-based)
```sh
cd example
npm run dev:standalone   # Standalone mode (WASM Indigo)
npm run dev:remote       # Remote mode (Indigo service at localhost:8002)
```

### Development (react-app-rewired, closer to production)
Start each package in watch mode in separate terminals, then the example app:
```sh
cd packages/ketcher-core && npm start
cd packages/ketcher-react && npm start
cd packages/ketcher-standalone && npm start
cd example && npm run start:standalone   # or start:remote
```

### Build
```sh
npm run build              # Build all packages + example app
npm run build:packages     # Build only library packages (core → standalone+react → macromolecules)
npm run build:core
npm run build:react
npm run build:standalone
npm run build:macromolecules
```

### Testing
```sh
# Unit tests (all packages)
npm run test

# Unit tests for a single package
npm run test --workspace=packages/ketcher-core
npm run test:unit -w packages/ketcher-core   # jest only, no lint/types

# Type checking
npm run test:types

# Linting
npm run test:eslint -w packages/ketcher-core
npm run stylelint -w packages/ketcher-react

# Playwright e2e autotests
cd ketcher-autotests
npx playwright test                        # all tests
npx playwright test tests/path/to/test.ts  # single file
npx playwright test --debug               # with debugger
npx playwright test --update-snapshots=changed  # update screenshots
```

Playwright requires a running Ketcher app. Default URL is `DEFAULT_KETCHER_STANDALONE_URL` from `ketcher-autotests/constants`. Configure via `.env` in `ketcher-autotests/` with `KETCHER_URL` and `MODE` variables.

## Architecture

### Monorepo Structure
This is an npm workspaces monorepo with four library packages and an example app:

- **`packages/ketcher-core`** — Framework-agnostic core: domain model, rendering engine, editor logic, format serializers, and the `Ketcher` API class. The largest and most important package.
- **`packages/ketcher-react`** — React component wrapper (`<Editor>`). Contains the legacy Redux-based UI (`src/script/ui/`), toolbar, dialogs, and wires the core editor into React.
- **`packages/ketcher-standalone`** — Thin package that bundles Indigo WASM and provides `StandaloneStructServiceProvider`. Builds multiple Rollup targets (wasm, base64, cjs variants).
- **`packages/ketcher-macromolecules`** — Self-contained React app for the macromolecules (biopolymer) editor. Has its own Redux store (`src/state/`), layout modes, and monomer library.
- **`example/`** — Integration example app. Uses Vite for dev, react-app-rewired/Webpack for production builds.
- **`ketcher-autotests/`** — Playwright e2e test suite.

### ketcher-core Layers

```
src/
  domain/
    entities/      # Pure data model: Struct, Atom, Bond, DrawingEntitiesManager, monomers
    serializers/   # mol (V2000/V3000), sdf, ket (JSON) — pure in/out, no rendering
    services/      # Domain service interfaces
    helpers/
  application/
    editor/        # Editor state machine, tools, operations, actions, modes (flex/snake/sequence)
    render/        # SVG rendering via Raphael (restruct/ = render-time view model, renderers/ = SVG drawers)
    formatters/    # Format detection, server-side format conversion wrappers, ketFormatter
    ketcher.ts     # Public Ketcher API class
    indigo.ts      # Indigo service calls (aromatize, layout, check, calculate, etc.)
  infrastructure/
    services/struct/  # RemoteStructService + RemoteStructServiceProvider (HTTP → Indigo REST API)
```

**Two rendering stacks coexist:**
1. **Raphael/SVG** (`application/render/restruct/`) — legacy renderer for small molecules. `ReStruct` is a mirror of `Struct` with render-state attached. Produces SVG via Raphael.
2. **PixiJS/Canvas renderers** (`application/render/renderers/`) — newer renderer used for macromolecules. Class hierarchy: `BaseRenderer` → monomer-specific renderers (`PeptideRenderer`, `ChemRenderer`, etc.).

### Editor Tools & Operations (ketcher-core)
- **Tools** (`application/editor/tools/`) implement mouse interaction (Tool interface: `mousedown`, `mousemove`, `mouseup`, `click`, etc.). Each tool class handles one editing mode.
- **Operations** (`application/editor/operations/`) are atomic undoable units (`BaseOperation` subclasses). They mutate `Struct` or `DrawingEntitiesManager`.
- **Actions** (`application/editor/actions/`) are named composites of operations — the undo/redo unit. `EditorHistory` manages the stack.
- **Modes** (`application/editor/modes/`) — macromolecules layout modes (`FlexMode`, `SnakeMode`, `SequenceMode`), each changing how monomers are positioned and connected.

### ketcher-react UI
The React package has a legacy architecture under `src/script/ui/`:
- Redux store (`state/`) manages toolbar state, modal visibility, server requests, options.
- `views/` contains the top-level layout components.
- `dialog/` contains all modal dialogs.
- `toolbar/` contains the toolbar action config and button components.

### Format Support
Format detection (`application/formatters/identifyStructFormat.ts`) inspects string content to auto-detect format. Each format has a formatter class implementing `StructFormatter`. Server-side formats (InChI, SMILES, CML, CDX, etc.) go through `serverFormatter.ts` which calls the Indigo REST API or WASM.

### Service Provider Pattern
`StructService` interface is implemented by:
- `RemoteStructService` — HTTP calls to an Indigo backend
- The WASM provider in `ketcher-standalone` — runs Indigo in-browser

### Build pipeline note
**Vite** is used for development only. **Rollup** builds the library packages. The `example/` production build uses **react-app-rewired** (Webpack). After developing with Vite, verify behavior with react-app-rewired before opening a PR.
