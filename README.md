# Tab Organizer

**Keep tabs on your tabs.**

Tab Organizer is a Chrome extension that opens a dashboard of everything you have open when you click its toolbar icon. Tabs are grouped by domain, with homepages (Gmail, X, LinkedIn, etc.) pulled into their own group. Close tabs with a satisfying swoosh + confetti.

No server. No account. No external API calls. Just a Chrome extension.

---

## Install with a coding agent

Send your coding agent (Claude Code, Codex, etc.) this repo and say **"install this"**:

```
https://github.com/OWENLEEzy/tab-organizer
```

The agent will walk you through it. Takes about 1 minute.

---

## Features

- **See all your tabs at a glance** on a clean grid, grouped by domain
- **Homepages group** pulls Gmail inbox, X home, YouTube, LinkedIn, GitHub homepages into one card
- **Close tabs with style** with swoosh sound + confetti burst
- **Duplicate detection** flags when you have the same page open twice, with one-click cleanup
- **Click any tab to jump to it** across windows, no new tab opened
- **Save for later** bookmark tabs to a checklist before closing them
- **Localhost grouping** shows port numbers next to each tab so you can tell your vibe coding projects apart
- **Expandable groups** show the first 8 tabs with a clickable "+N more"
- **100% local** your data never leaves your machine
- **Pure Chrome extension** no server, no Node.js, no npm, no setup beyond loading the extension

---

## Manual Setup

**推荐：按这三步做**

1. Build one-click package:

```bash
git clone https://github.com/OWENLEEzy/tab-organizer.git
cd tab-organizer
npm install
npm run build
```

2. Load unpacked in Chrome:

Open `chrome://extensions` -> 开启 Developer mode -> 点击 **Load unpacked** -> 选 `dist/` 文件夹.

3. Open Tab Organizer:

点击浏览器工具栏里的 Tab Organizer 图标。

If you changed source code and want to rebuild the loadable package:

```bash
npm run build
# Quick sync only (icons/paths):
npm run sync:dist
```

This writes a Chrome-ready `dist/` bundle directly.

Legacy `extension/` output has been removed. `dist/` is the only loadable and publishable extension bundle.

---

## How it works

```
You click the Tab Out toolbar icon
  -> Tab Out opens a dashboard with your open tabs grouped by domain
  -> Homepages (Gmail, X, etc.) get their own group at the top
  -> Click any tab title to jump to it
  -> Close groups you're done with (swoosh + confetti)
  -> Save tabs for later before closing them
```

Everything runs inside the Chrome extension. No external server, no API calls, no data sent anywhere. Saved tabs are stored in `chrome.storage.local`.

---

## Tech stack

| What | How |
|------|-----|
| Extension | Chrome Manifest V3 |
| Storage | chrome.storage.local |
| Sound | Web Audio API (synthesized, no files) |
| Animations | CSS transitions + JS confetti particles |

---

## License

MIT

---

Built by Tab Organizer contributors
