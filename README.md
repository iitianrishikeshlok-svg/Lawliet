# "L" — Premium Desktop Assistant & Persistent Floating Icon

> A native Windows productivity utility engineered with restrained aesthetics, dedicated multi-window lifecycles, and multimodal reasoning powered by Google Gemini.

---

## 1. Visual & Architectural Philosophy

**L** is designed as a thoughtfully crafted native Windows utility closer to PowerToys, Linear, and macOS utilities than a generic AI dashboard.

### Design Principles:
- **Restrained Color & Contrast:** Neutral graphite and deep charcoal base surfaces (`#141518`), soft off-white typography (`#f1f2f4`), muted secondary labels (`#8b909a`), and subtle borders (`rgba(255,255,255,0.08)`).
- **No Clutter:** No excessive glowing borders, oversized empty cards, repetitive glassmorphism, or placeholder decorative charts.
- **Strict Multi-Window Lifecycles:** The Floating Icon, Action Menu, Assistant Panel, and Mini Browser operate as independent native desktop windows. Closing one panel never destroys or hides the floating icon or exits the application.
- **Both Light & Dark Mode:** Supports **Neutral Graphite (Default)**, **Paper Slate (Light Mode)**, **Obsidian Minimal**, **Nordic Frost**, and **Death Note Noir**, with user-configurable accent colors (Cobalt, Indigo, Emerald, Crimson, Amber, Slate).

---

## 2. Persistent Floating Icon: Native Desktop Window

The floating icon is a dedicated native Windows desktop window managed by the Electron shell:

1. **Persistent Desktop Overlay:**
   - Appears above ordinary desktop windows (Edge, Chrome, VS Code, Word, Terminal).
   - Floats unobtrusively at user-configured size (`44px`, `52px`, or `60px`).
   - Uses `showInactive()` when idle so it never steals focus from active applications.
2. **Three Distinct States:**
   - `Visible`: The floating icon is active on screen.
   - `Hidden`: The user single-clicked the icon to hide it. The application stays running in the background.
   - `Disabled`: Explicitly turned off by the user in Settings.
3. **Simple, Predictable Interaction:**
   - **Single Click on Idle Icon:** Hides the icon cleanly.
   - **Right-Click on Icon:** Opens the compact 7-action floating Action Menu.
   - **Alt + L Global Shortcut:** Restores the icon immediately to its previous screen position (or toggles the Action Menu if already visible).
   - **System Tray Menu:** View icon state, show/hide icon, open actions, or reset icon position.
   - **Smooth Dragging:** Dragging moves the icon smoothly; dragging does not trigger the hide action.
4. **Display Clamping & Multi-Monitor Safety:**
   - Automatically detects display scaling (e.g. 100%, 125%, 150%) and multiple monitors.
   - Clamps coordinates to monitor work area, preventing the icon from clipping off-screen or being lost if a monitor is disconnected.

---

## 3. The 7 Prioritized Actions

Triggered via right-clicking the icon, system tray, or `Alt+L`:

| # | Action | Hotkey | Description |
|---|---|---|---|
| **1** | **Ask L** | `Enter` / `1` | Opens the compact Assistant Productivity Panel for multiline reasoning, code analysis, and multimodal queries. |
| **2** | **Screenshot** | `Alt + S` / `2` | Instantly freezes screen buffer for region marquee capture, OCR, and multimodal inspection. |
| **3** | **Draw** | `Alt + D` / `3` | Vector drawing and annotation canvas with pens, arrows, text callouts, and rectangles. |
| **4** | **Camera** | `Alt + C` / `4` | Optical webcam feed with crosshairs and 3-second snapshot shutter. |
| **5** | **Browser** | `Alt + B` / `5` | Independent Mini Browser workspace with opacity slider (10%–100%) and "Send Page to L". |
| **6** | **History** | `Alt + H` / `6` | Searchable local Vault history with one-click Markdown and JSON export. |
| **7** | **Settings** | `Alt + ,` / `7` | Customize icon size, accent color, background appearance, opacity, shadow, themes, and Gemini API keys. |

---

## 4. Assistant Productivity Panel

- **Tactile 3-Stage Thinking Switcher:**
  - `⚡ Flash (0 tokens)`: Sub-second OCR and fast queries.
  - `⚖️ Balanced (2,048 tokens)`: Code review and structured insights.
  - `🧠 Deep Reasoning (16,384 tokens)`: Multi-step architectural proofs and deep verification.
- **Collapsible Reasoning Drawer:** Inspect the step-by-step internal deduction before the final answer.
- **Attachment Preview:** Visible screenshot attachment chip with one-click remove.
- **Code Block Copy:** High-precision syntax display with one-click copy feedback.
- **Non-Destructive Close (`Esc` / `✕`):** Closes the panel without hiding or destroying the floating icon.

---

## 5. Setup & Launch

### Prerequisites
- Node.js (v18.0.0 or higher) & npm

### Installation & Build
```bash
# 1. Install dependencies
npm install

# 2. Build production assets
npm run build

# 3. Launch native desktop application
npm run electron:prod
```

Or simply double-click `launch.bat`.

---

## 6. Architecture & File Layout

```
ASD/
├── electron/
│   ├── main.js         # Dedicated window management (Icon, Action Menu, Assistant, Browser, Sniper)
│   ├── preload.js      # Secure contextBridge API for window states, shortcuts & IPC
│   └── store.js        # Atomic JSON persistence (l_config.json, l_history.json)
├── src/
│   ├── components/
│   │   ├── FloatingIcon.jsx     # Capital "L" persistent floating icon (click to hide, drag to move)
│   │   ├── ActionMenu.jsx       # 7 prioritized quick actions floating menu
│   │   ├── Header.jsx           # Compact header with Quick/Deep selector & close control
│   │   ├── NavigationDock.jsx   # Tab switcher for Assistant modules
│   │   ├── ChatHUD.jsx          # Conversation stream, attachment chips, markdown & reasoning
│   │   └── tabs/                # Browser, Camera, History, ScreenWatch, Settings, Snip
│   ├── themes/themeConfig.js    # Neutral Graphite, Light Mode, Obsidian, Frost, Noir & Accents
│   └── index.css                # Windows utility design system with subtle borders & shadows
├── standalone.html              # Standalone self-contained preview of the full UI
└── launch.bat                   # Desktop one-click launcher
```
