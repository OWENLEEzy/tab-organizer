<div align="center">
  <img src="./public/readme-assets/real-screenshot.png" alt="Tab Organizer Dashboard" width="800">

  # Tab Organizer
  
  **The Local-First Dashboard for Your Browser Tabs.**

  [![License: MIT](https://img.shields.io/badge/License-MIT-sage.svg)](https://opensource.org/licenses/MIT)
  [![Version](https://img.shields.io/badge/Version-1.0.0-blue.svg)]()
  [![Chrome](https://img.shields.io/badge/Chrome-Extension-amber.svg)]()

  ### [English](README.md) | [中文说明](README_zh.md) | [Original Project ↗️](https://github.com/OWENLEEzy/tab-out)

</div>

  ### [English](README.md) | [中文说明](README_zh.md) | [Original Project ↗️](https://github.com/OWENLEEzy/tab-out)

</div>

---

# 📖 Table of Contents
- [PART I: User Guide](#part-i-user-guide)
  - [✨ Vision & Philosophy](#-vision--philosophy)
  - [🚀 Installation](#-installation)
  - [💎 Core Features](#-core-features)
  - [⌨️ Usage & Shortcuts](#️-usage--shortcuts)
  - [🔒 Privacy & Security](#-privacy--security)
- [PART II: Developer Hub](#part-ii-developer-hub)
  - [🏗️ Technical Architecture](#️-technical-architecture)
  - [🔄 Data & Mutation Flow](#-data--mutation-flow)
  - [📂 Project Structure](#-project-structure)
  - [📚 Documentation Architecture](#-documentation-architecture)
  - [🛠️ Development Lifecycle](#️-development-lifecycle)
  - [🧪 Testing Strategy](#-testing-strategy)
- [🏗️ Tech Stack](#️-tech-stack)

---

# PART I: User Guide

## ✨ Vision & Philosophy
**Tab Organizer** is built for the "Tab Hoarder" who values a clean, aesthetic, and distraction-free workspace. Inspired by the minimalist elegance of **Notion**, it aims to solve "Tab Fatigue" by shifting the focus from a horizontal list of icons to a structured, product-centric dashboard.

## 🚀 Installation
1. **Download**: Visit the [Releases](https://github.com/OWENLEEzy/tab-organizer/releases) page.
   - **⚠️ IMPORTANT**: Download the file named **`tab-organizer-latest.zip`**.
   - **DO NOT** download the "Source code (zip)" at the bottom; it is uncompiled and won't work as an extension directly.
2. **Unpack**: Extract the downloaded `.zip` file to a permanent folder on your computer (e.g., Documents).
3. **Load**: 
   - Open Chrome and type `chrome://extensions` in the address bar.
   - Toggle **Developer mode** (top right).
   - Click **Load unpacked** and select the folder you just extracted.
4. **Pin**: Pin the Tab Organizer icon to your toolbar for instant access.

## 💎 Core Features
- **Smart Product Grouping**: Uses a proprietary mapping logic to group tabs by "Product" (e.g., all Google Docs together, all GitHub repos together) rather than just raw domains.
- **Visual Cleanup**:
  - **Swoosh & Confetti**: Closing tabs feels rewarding with high-quality micro-interactions.
  - **Duplicate Badges**: Amber badges highlight redundant tabs; one click closes all extras.
- **Multiple Views**:
  - **Cards View**: A spacious, tactile layout for visual scanning.
  - **Table View**: A dense, high-efficiency list for power users.
- **Recovery System**: Automatically takes local "snapshots" of your open sessions. If you accidentally close a window, restore it in seconds.
- **Developer Mode Intelligence**: Recognizes `localhost` and `127.0.0.1` projects, grouping them by port number automatically.

## ⌨️ Usage & Shortcuts
- **Open Dashboard**: Click the extension icon or use `Cmd+Shift+K` (customizable in Chrome shortcuts).
- **Quick Search**: Just start typing anywhere to filter your tabs instantly.
- **Navigation**: Use `Arrow Keys` to move between tab chips, and `Enter` to switch to that tab.
- **Organize Mode**: Toggle "Organize" in the header to drag and drop product groups into custom sections.

## 🔒 Privacy & Security
Tab Organizer is **Local-First**. 
- **No Cloud**: Your tab data never leaves your machine.
- **No Tracking**: No analytics, no telemetry, no tracking pixels.
- **No Permissions Bloat**: Only uses `tabs` and `storage` permissions.

---

# PART II: Developer Hub

## 🏗️ System Architecture & Engineering
Tab Organizer is engineered as a robust, local-first Chrome Extension leveraging modern web technologies and Manifest V3 (MV3) best practices.

### 1. Runtime Ownership & Core Pillars
The project is divided into three distinct execution contexts, each with strict responsibilities:

- **The Background Service Worker (`src/background/`)**: 
  - **Stateless Event Hub**: Acts as the central listener for Chrome system events (tab creation, window focus, etc.).
  - **Badge Orchestration**: Manages the toolbar badge count using a debounced update logic to ensure zero-flicker UI.
  - **Context Management**: Handles the "Singleton" dashboard pattern—ensuring only one Tab Organizer dashboard is open or focused at a time.
- **The Dashboard Runtime (`src/newtab/`)**:
  - **Orchestrator Pattern**: `App.tsx` is the single point of entry for global state. It performs the "Final Join" between raw browser tabs and user-defined groupings.
  - **Lazy-Loaded Modules**: High-impact dependencies like `@dnd-kit` are lazy-loaded only when "Organize Mode" is active to keep the initial paint under 100ms.
- **The Storage Adapter (`src/utils/storage.ts`)**:
  - **Serializable Queue**: Implements a write-queue to handle atomic updates to `chrome.storage.local`. This prevents data corruption during rapid tab-closing bursts.
  - **Schema Normalization**: Automatically prunes stale product assignments and migrates legacy data shapes at the boundary.

### 2. State & Data Lifecycle
We employ a **Unidirectional Data Flow** with a synchronized storage backend.

```text
[Browser Event] ──▶ [Background SW] ──▶ [Dashboard Refresh]
                                              │
      ┌───────────────────────────────────────┘
      ▼
[User Action] ──▶ [Zustand Store] ──▶ [Storage Adapter] ──▶ [Persistence]
      ▲                                       │
      └───────────────────────────────────────┘
```
- **State Source of Truth**: The active dashboard state is held in **Zustand**. 
- **Persistence Source of Truth**: All configuration (sections, order, settings) is persisted in **Chrome Storage Local**. 
- **Snapshot Engine**: A background routine periodically captures the current tab state into "Recovery Snapshots" using a lightweight JSON structure, capped to a configurable history limit.

### 3. Logic & Domain Separation
To maintain testability and clean code, we separate concerns:
- **`src/lib/` (Pure Logic)**: Contains the "Grouping Engine" and "Title Sanitizers". These are pure TS functions that transform raw `chrome.tabs.Tab` objects into our internal `TabGroup` hierarchy. Zero dependencies on React or DOM APIs.
- **`src/stores/` (State)**: Encapsulates the mutation logic. No direct calls to `chrome.tabs` are allowed inside components; they must go through store actions.
- **`src/components/` (UI)**: Pure presentational elements. They do not know about Zustand or Chrome APIs.

## 📂 Project Structure
```text
src/
├── background/   # MV3 Service Worker (Stateless event logic)
├── newtab/       # React App (Page orchestrator & Components)
│   ├── components/ # Pure UI/UX (Atomic design)
│   └── styles/     # Tailwind v4 (Design tokens & Global CSS)
├── stores/       # Zustand State (Tabs, Settings, Recovery, Organizer)
├── lib/          # Domain Logic (Grouping engine, Snapshot logic)
├── utils/        # Infrastructure (Storage adapters, Chrome API wrappers)
├── types/        # Type System (Shared interfaces & Enums)
└── __tests__/    # Quality Gate (Unit, UI, A11y, E2E)
```

## 🛠️ Development Lifecycle
- **Build Pipeline**: Vite + CRXJS provides a seamless development experience for MV3, handling hot module replacement for the dashboard UI.
- **Performance Budgeting**: We strictly monitor the bundle size to ensure the extension remains lightweight. Current budget is <500KB for the main bundle.
- **CSS Architecture**: Tailwind v4 with Lightning CSS is used to implement the "Warm Paper" design system, ensuring fast rendering and consistent spacing.

## 🧪 Testing Strategy
- **Unit Testing**: Vitest handles core logic testing (grouping, URL parsing).
- **UI/A11y Testing**: We use a custom Vitest harness to verify component rendering and accessibility.
- **E2E Testing**: Playwright runs in a real browser environment to ensure tab-closing and navigation flows work as expected.
- **Gatekeeping**: `npm run check` is required before any merge. It enforces linting, testing, and bundle size budgets.

---

## 🏗️ Tech Stack
| Layer | Technology |
| :--- | :--- |
| **Framework** | React 19 + TypeScript |
| **State** | Zustand (Local Persistence) |
| **Styling** | Tailwind CSS v4 + Newsreader & DM Sans |
| **Build** | Vite + CRXJS |
| **Testing** | Vitest + Playwright |
| **Runtime** | Chrome Extension MV3 |

---

## 🔗 Credits
Inspired by the original **[Tab Out](https://github.com/OWENLEEzy/tab-out)**. Built with ❤️ for a cleaner browser.
