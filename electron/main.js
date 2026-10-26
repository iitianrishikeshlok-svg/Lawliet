import electron from 'electron';
const { app, BrowserWindow, ipcMain, screen, desktopCapturer, globalShortcut, Tray, Menu, nativeImage, dialog, shell, webContents, session } = electron;
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import LocalStore from './store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize persistent configuration and vault history
const configStore = new LocalStore('l_config.json', {
  theme: 'graphite',
  accent: 'cobalt',
  iconState: 'visible', // 'visible' | 'hidden' | 'disabled'
  iconSize: 52, // 44, 52, 60
  iconOpacity: 0.95,
  iconShadow: 'subtle', // 'none', 'subtle', 'medium', 'deep'
  iconBackground: 'graphite', // 'graphite', 'glass', 'outline'
  dockingEnabled: true,
  model: 'gemini-2.5-flash',
  thinkingLevel: 2,
  audioFeedback: true,
  pinnedAlwaysOnTop: true,
  firstRunHintSeen: false,
});

const historyStore = new LocalStore('l_history.json', { items: [] });

// Dedicated Window References
let iconWindow = null;
let actionMenuWindow = null;
let assistantWindow = null;
let browserWindow = null;
let sniperWindow = null;
let tray = null;

const ICON_WINDOW_SIZE = { width: 72, height: 72 };
const ACTION_MENU_SIZE = { width: 240, height: 320 };
const ASSISTANT_SIZE = { width: 440, height: 640 };
const BROWSER_SIZE = { width: 640, height: 720 };

/**
 * Clamp coordinates to valid screen area across multiple monitors.
 * Protects against monitor disconnection or off-screen placement.
 */
function clampBoundsToScreen(bounds, width, height) {
  const displays = screen.getAllDisplays();
  const matchingDisplay = screen.getDisplayMatching(bounds) || screen.getPrimaryDisplay();
  const workArea = matchingDisplay.workArea;

  let x = bounds.x;
  let y = bounds.y;

  // Ensure within workArea
  if (x + width > workArea.x + workArea.width) {
    x = workArea.x + workArea.width - width - 12;
  }
  if (x < workArea.x) {
    x = workArea.x + 12;
  }
  if (y + height > workArea.y + workArea.height) {
    y = workArea.y + workArea.height - height - 12;
  }
  if (y < workArea.y) {
    y = workArea.y + 12;
  }

  return { x: Math.round(x), y: Math.round(y) };
}

/**
 * Generate native tray icon with the iconic Capital "L"
 */
function createTrayIcon() {
  const size = 32;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">
      <rect width="32" height="32" rx="8" fill="#141518"/>
      <rect x="1" y="1" width="30" height="30" rx="7" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
      <path d="M11 9 L15 9 L15 20 L21 20 L21 23 L11 23 Z" fill="#f1f2f4"/>
      <circle cx="21" cy="11" r="2" fill="#3b82f6"/>
    </svg>
  `;
  const base64 = Buffer.from(svg).toString('base64');
  return nativeImage.createFromDataURL(`data:image/svg+xml;base64,${base64}`);
}

/**
 * Helper to get target URL for a window mode.
 */
function getWindowTargetUrl(mode = '') {
  const queryParam = mode ? `?mode=${mode}` : '';
  const devUrl = `http://localhost:5173${queryParam}`;
  const prodPath = path.join(__dirname, '../dist/index.html');
  const fallbackPath = path.join(__dirname, '../index.html');

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    return { type: 'url', target: devUrl, fallbackFile: fs.existsSync(prodPath) ? prodPath : fallbackPath, queryParam };
  }
  return { type: 'file', target: fs.existsSync(prodPath) ? prodPath : fallbackPath, queryParam };
}

function loadWindowContent(win, mode = '') {
  const route = getWindowTargetUrl(mode);
  if (route.type === 'url') {
    win.loadURL(route.target).catch(() => {
      win.loadFile(route.fallbackFile, { query: mode ? { mode } : {} });
    });
  } else {
    win.loadFile(route.target, { query: mode ? { mode } : {} });
  }
}

// ----------------------------------------------------------------------
// 1. FLOATING ICON WINDOW
// ----------------------------------------------------------------------

function createFloatingIconWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workArea;

  // Restore saved position or default to top-right
  const defaultPos = {
    x: workArea.x + workArea.width - ICON_WINDOW_SIZE.width - 24,
    y: workArea.y + 100,
  };
  const savedPos = configStore.get('iconPosition', defaultPos);
  const clamped = clampBoundsToScreen(savedPos, ICON_WINDOW_SIZE.width, ICON_WINDOW_SIZE.height);

  iconWindow = new BrowserWindow({
    x: clamped.x,
    y: clamped.y,
    width: ICON_WINDOW_SIZE.width,
    height: ICON_WINDOW_SIZE.height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    skipTaskbar: true,
    focusable: true, // Able to receive clicks, but shown inactive when idle
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  loadWindowContent(iconWindow, 'icon');

  // Avoid stealing focus when initially shown
  const state = configStore.get('iconState', 'visible');
  if (state === 'visible') {
    iconWindow.showInactive();
  } else {
    iconWindow.hide();
  }

  // Handle window movement for persistence and edge clamping
  iconWindow.on('moved', () => {
    if (!iconWindow) return;
    const currentBounds = iconWindow.getBounds();
    const clampedPos = clampBoundsToScreen(currentBounds, currentBounds.width, currentBounds.height);
    if (clampedPos.x !== currentBounds.x || clampedPos.y !== currentBounds.y) {
      iconWindow.setPosition(clampedPos.x, clampedPos.y);
    }
    configStore.set('iconPosition', clampedPos);
  });

  iconWindow.on('closed', () => {
    iconWindow = null;
  });
}

function showFloatingIcon() {
  if (!iconWindow) {
    createFloatingIconWindow();
    return;
  }
  const savedPos = configStore.get('iconPosition');
  if (savedPos) {
    const clamped = clampBoundsToScreen(savedPos, ICON_WINDOW_SIZE.width, ICON_WINDOW_SIZE.height);
    iconWindow.setPosition(clamped.x, clamped.y);
  }
  iconWindow.showInactive();
  configStore.set('iconState', 'visible');
  updateTrayMenu();
  broadcastAppState();
}

function hideFloatingIcon() {
  if (iconWindow) {
    iconWindow.hide();
  }
  if (actionMenuWindow) {
    actionMenuWindow.hide();
  }
  configStore.set('iconState', 'hidden');
  updateTrayMenu();
  broadcastAppState();
}

function toggleFloatingIcon() {
  const currentState = configStore.get('iconState', 'visible');
  if (currentState === 'visible' && iconWindow && iconWindow.isVisible()) {
    hideFloatingIcon();
  } else {
    showFloatingIcon();
  }
}

// ----------------------------------------------------------------------
// 2. ACTION MENU WINDOW
// ----------------------------------------------------------------------

function createActionMenuWindow() {
  actionMenuWindow = new BrowserWindow({
    width: ACTION_MENU_SIZE.width,
    height: ACTION_MENU_SIZE.height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  loadWindowContent(actionMenuWindow, 'action-menu');

  // Automatically hide when clicking outside / losing focus
  actionMenuWindow.on('blur', () => {
    if (actionMenuWindow && actionMenuWindow.isVisible()) {
      actionMenuWindow.hide();
    }
  });

  actionMenuWindow.on('closed', () => {
    actionMenuWindow = null;
  });
}

function showActionMenu(anchorBounds = null) {
  if (!actionMenuWindow) {
    createActionMenuWindow();
  }

  // Anchor near icon position
  const iconBounds = anchorBounds || (iconWindow ? iconWindow.getBounds() : { x: 200, y: 100 });
  const primaryDisplay = screen.getDisplayMatching(iconBounds) || screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workArea;

  let x = iconBounds.x - ACTION_MENU_SIZE.width - 8;
  let y = iconBounds.y;

  // If opening to the left would overflow screen edge, open to the right
  if (x < workArea.x) {
    x = iconBounds.x + (iconBounds.width || ICON_WINDOW_SIZE.width) + 8;
  }
  // Clamp vertical positioning
  if (y + ACTION_MENU_SIZE.height > workArea.y + workArea.height) {
    y = workArea.y + workArea.height - ACTION_MENU_SIZE.height - 12;
  }
  if (y < workArea.y) {
    y = workArea.y + 12;
  }

  actionMenuWindow.setPosition(Math.round(x), Math.round(y));
  actionMenuWindow.show();
  actionMenuWindow.focus();
}

function hideActionMenu() {
  if (actionMenuWindow && actionMenuWindow.isVisible()) {
    actionMenuWindow.hide();
  }
}

// ----------------------------------------------------------------------
// 3. ASSISTANT / CHAT PRODUCTIVITY PANEL WINDOW
// ----------------------------------------------------------------------

function createAssistantWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workArea;

  const defaultX = workArea.x + workArea.width - ASSISTANT_SIZE.width - 24;
  const defaultY = workArea.y + Math.max(20, Math.round((workArea.height - ASSISTANT_SIZE.height) / 2));

  assistantWindow = new BrowserWindow({
    x: defaultX,
    y: defaultY,
    width: ASSISTANT_SIZE.width,
    height: ASSISTANT_SIZE.height,
    minWidth: 380,
    minHeight: 500,
    frame: false,
    transparent: true,
    alwaysOnTop: configStore.get('pinnedAlwaysOnTop', true),
    resizable: true,
    hasShadow: false,
    skipTaskbar: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
    },
  });

  loadWindowContent(assistantWindow, 'assistant');

  // Prevent navigation away from the assistant app
  assistantWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  assistantWindow.on('closed', () => {
    assistantWindow = null;
  });
}

function openAssistant(tab = 'chat', attachment = null) {
  if (!assistantWindow) {
    createAssistantWindow();
  }

  hideActionMenu();

  assistantWindow.show();
  assistantWindow.focus();

  // Send initial routing or context
  assistantWindow.webContents.send('open-action', { tab, attachment });
}

function closeAssistant() {
  if (assistantWindow && assistantWindow.isVisible()) {
    assistantWindow.hide();
  }
}

// ----------------------------------------------------------------------
// 4. MINI BROWSER DEDICATED WORKSPACE WINDOW
// ----------------------------------------------------------------------

function createBrowserWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workArea;

  const defaultX = workArea.x + Math.round((workArea.width - BROWSER_SIZE.width) / 2);
  const defaultY = workArea.y + Math.round((workArea.height - BROWSER_SIZE.height) / 2);

  browserWindow = new BrowserWindow({
    x: defaultX,
    y: defaultY,
    width: BROWSER_SIZE.width,
    height: BROWSER_SIZE.height,
    minWidth: 420,
    minHeight: 480,
    frame: false,
    transparent: true,
    alwaysOnTop: false,
    resizable: true,
    hasShadow: true,
    skipTaskbar: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
    },
  });

  loadWindowContent(browserWindow, 'browser');

  browserWindow.on('closed', () => {
    browserWindow = null;
  });
}

function openBrowserWorkspace(url = 'https://duckduckgo.com') {
  if (!browserWindow) {
    createBrowserWindow();
  }
  hideActionMenu();
  browserWindow.show();
  browserWindow.focus();
  browserWindow.webContents.send('open-action', { tab: 'browser', url });
}

function closeBrowserWorkspace() {
  if (browserWindow && browserWindow.isVisible()) {
    browserWindow.hide();
  }
}

// ----------------------------------------------------------------------
// 5. SCREENSHOT & DRAW TOOL WINDOW
// ----------------------------------------------------------------------

async function capturePrimaryScreen() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const scale = primaryDisplay.scaleFactor || 1;
  const { width, height } = primaryDisplay.size;

  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: {
      width: Math.round(width * scale),
      height: Math.round(height * scale),
    },
  });

  if (sources.length > 0) {
    return sources[0].thumbnail.toDataURL();
  }
  throw new Error('No screen source found for capture');
}

async function triggerSnippingTool() {
  try {
    hideActionMenu();

    // Momentarily hide overlay windows so they don't block the capture buffer
    const wasIconVisible = iconWindow && iconWindow.isVisible();
    const wasAssistantVisible = assistantWindow && assistantWindow.isVisible();

    if (wasIconVisible) iconWindow.hide();
    if (wasAssistantVisible) assistantWindow.hide();

    await new Promise((r) => setTimeout(r, 120));
    const screenBufferDataUrl = await capturePrimaryScreen();

    // Restore icon window if it was visible
    if (wasIconVisible && configStore.get('iconState') === 'visible') {
      iconWindow.showInactive();
    }

    // Spawn fullscreen sniper overlay window
    const primaryDisplay = screen.getPrimaryDisplay();
    const { x, y, width, height } = primaryDisplay.bounds;

    if (sniperWindow) {
      sniperWindow.close();
    }

    sniperWindow = new BrowserWindow({
      x,
      y,
      width,
      height,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      fullscreen: true,
      skipTaskbar: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    loadWindowContent(sniperWindow, 'sniper');

    sniperWindow.webContents.on('did-finish-load', () => {
      sniperWindow.webContents.send('screen-buffer-ready', {
        bufferUrl: screenBufferDataUrl,
        width,
        height,
      });
    });

    sniperWindow.on('closed', () => {
      sniperWindow = null;
    });
  } catch (err) {
    console.error('[Sniper] Failed capture:', err);
    if (iconWindow && configStore.get('iconState') === 'visible') {
      iconWindow.showInactive();
    }
  }
}

// ----------------------------------------------------------------------
// SYSTEM TRAY & CONTEXT MENU
// ----------------------------------------------------------------------

function updateTrayMenu() {
  if (!tray) return;

  const iconState = configStore.get('iconState', 'visible');
  const isIconVisible = iconState === 'visible' && iconWindow && iconWindow.isVisible();

  const contextMenu = Menu.buildFromTemplate([
    {
      label: `L Status: ${iconState.toUpperCase()}`,
      enabled: false,
    },
    { type: 'separator' },
    {
      label: isIconVisible ? 'Hide Floating Icon' : 'Restore Floating Icon (Alt + L)',
      click: () => {
        if (isIconVisible) hideFloatingIcon();
        else showFloatingIcon();
      },
    },
    {
      label: 'Open Action Menu',
      click: () => showActionMenu(),
    },
    {
      label: 'Ask L (Assistant)',
      click: () => openAssistant('chat'),
    },
    {
      label: 'Take Screenshot (Alt + S)',
      click: () => triggerSnippingTool(),
    },
    {
      label: 'Open Mini Browser',
      click: () => openBrowserWorkspace(),
    },
    {
      label: 'Reset Icon Position',
      click: () => {
        const display = screen.getPrimaryDisplay();
        const pos = {
          x: display.workArea.x + display.workArea.width - ICON_WINDOW_SIZE.width - 24,
          y: display.workArea.y + 100,
        };
        configStore.set('iconPosition', pos);
        if (iconWindow) {
          iconWindow.setPosition(pos.x, pos.y);
          showFloatingIcon();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Theme: Neutral Graphite (Default)',
      click: () => notifyThemeChange('graphite', 'cobalt'),
    },
    {
      label: 'Theme: Paper Slate (Light Mode)',
      click: () => notifyThemeChange('light', 'cobalt'),
    },
    {
      label: 'Theme: Obsidian Minimal',
      click: () => notifyThemeChange('obsidian', 'indigo'),
    },
    {
      label: 'Theme: Nordic Frost',
      click: () => notifyThemeChange('frost', 'cobalt'),
    },
    {
      label: 'Theme: Death Note Noir',
      click: () => notifyThemeChange('noir', 'crimson'),
    },
    { type: 'separator' },
    {
      label: 'Quit L completely',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

function setupTray() {
  tray = new Tray(createTrayIcon());
  tray.setToolTip('L — Desktop Assistant');
  updateTrayMenu();

  tray.on('click', () => {
    const iconState = configStore.get('iconState', 'visible');
    if (iconState === 'visible' && iconWindow && iconWindow.isVisible()) {
      showActionMenu();
    } else {
      showFloatingIcon();
    }
  });
}

function notifyThemeChange(themeId, accentId) {
  configStore.set('theme', themeId);
  if (accentId) configStore.set('accent', accentId);

  const payload = { themeId, accentId };
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send('theme-changed', payload);
  });
}

function broadcastAppState() {
  const state = {
    iconState: configStore.get('iconState', 'visible'),
    theme: configStore.get('theme', 'graphite'),
    accent: configStore.get('accent', 'cobalt'),
    iconSize: configStore.get('iconSize', 52),
    iconOpacity: configStore.get('iconOpacity', 0.95),
    iconShadow: configStore.get('iconShadow', 'subtle'),
    iconBackground: configStore.get('iconBackground', 'graphite'),
    dockingEnabled: configStore.get('dockingEnabled', true),
  };

  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send('app-state-changed', state);
  });
}

// ----------------------------------------------------------------------
// GLOBAL HOTKEYS
// ----------------------------------------------------------------------

function registerGlobalShortcuts() {
  // Alt+L: Restores icon if hidden; toggles Action Menu / Assistant if visible
  globalShortcut.register('Alt+L', () => {
    const iconState = configStore.get('iconState', 'visible');
    if (iconState === 'hidden' || !iconWindow || !iconWindow.isVisible()) {
      showFloatingIcon();
    } else if (actionMenuWindow && actionMenuWindow.isVisible()) {
      hideActionMenu();
    } else {
      showActionMenu();
    }
  });

  // Alt+S: Instant screen capture
  globalShortcut.register('Alt+S', () => {
    triggerSnippingTool();
  });
}

// ----------------------------------------------------------------------
// IPC DISPATCH HANDLERS
// ----------------------------------------------------------------------

ipcMain.handle('get-app-state', () => ({
  iconState: configStore.get('iconState', 'visible'),
  theme: configStore.get('theme', 'graphite'),
  accent: configStore.get('accent', 'cobalt'),
  iconSize: configStore.get('iconSize', 52),
  iconOpacity: configStore.get('iconOpacity', 0.95),
  iconShadow: configStore.get('iconShadow', 'subtle'),
  iconBackground: configStore.get('iconBackground', 'graphite'),
  dockingEnabled: configStore.get('dockingEnabled', true),
  firstRunHintSeen: configStore.get('firstRunHintSeen', false),
  model: configStore.get('model', 'gemini-2.5-flash'),
  thinkingLevel: configStore.get('thinkingLevel', 2),
  audioFeedback: configStore.get('audioFeedback', true),
}));

ipcMain.handle('set-icon-state', (_e, state) => {
  if (state === 'hidden') hideFloatingIcon();
  else if (state === 'visible') showFloatingIcon();
  else {
    configStore.set('iconState', 'disabled');
    if (iconWindow) iconWindow.hide();
    updateTrayMenu();
    broadcastAppState();
  }
  return true;
});

ipcMain.handle('hide-icon', () => {
  hideFloatingIcon();
  return true;
});

ipcMain.handle('restore-icon', () => {
  showFloatingIcon();
  return true;
});

ipcMain.handle('toggle-icon', () => {
  toggleFloatingIcon();
  return true;
});

ipcMain.handle('save-icon-position', (_e, pos) => {
  if (iconWindow && pos) {
    const clamped = clampBoundsToScreen(pos, ICON_WINDOW_SIZE.width, ICON_WINDOW_SIZE.height);
    configStore.set('iconPosition', clamped);
    iconWindow.setPosition(clamped.x, clamped.y);
  }
  return true;
});

ipcMain.handle('reset-icon-position', () => {
  const display = screen.getPrimaryDisplay();
  const pos = {
    x: display.workArea.x + display.workArea.width - ICON_WINDOW_SIZE.width - 24,
    y: display.workArea.y + 100,
  };
  configStore.set('iconPosition', pos);
  if (iconWindow) {
    iconWindow.setPosition(pos.x, pos.y);
    showFloatingIcon();
  }
  return pos;
});

ipcMain.handle('open-action-menu', (_e, anchorBounds) => {
  showActionMenu(anchorBounds);
  return true;
});

ipcMain.handle('close-action-menu', () => {
  hideActionMenu();
  return true;
});

ipcMain.handle('open-assistant', (_e, { tab, attachment } = {}) => {
  openAssistant(tab || 'chat', attachment);
  return true;
});

ipcMain.handle('close-assistant', () => {
  closeAssistant();
  return true;
});

ipcMain.handle('open-browser', (_e, { url } = {}) => {
  openBrowserWorkspace(url);
  return true;
});

ipcMain.handle('close-browser', () => {
  closeBrowserWorkspace();
  return true;
});

ipcMain.handle('set-always-on-top', (_e, flag) => {
  configStore.set('pinnedAlwaysOnTop', flag);
  if (assistantWindow) {
    assistantWindow.setAlwaysOnTop(flag);
  }
  return true;
});

ipcMain.handle('set-window-opacity', (_e, opacity) => {
  configStore.set('iconOpacity', opacity);
  if (iconWindow) {
    iconWindow.setOpacity(Math.max(0.2, Math.min(1.0, opacity)));
  }
  return true;
});

ipcMain.handle('trigger-snip', async () => {
  await triggerSnippingTool();
  return true;
});

ipcMain.handle('capture-screen-frame', async () => {
  return await capturePrimaryScreen();
});

ipcMain.on('snip-result-selected', (_e, imageDataUrl) => {
  if (sniperWindow) {
    sniperWindow.close();
    sniperWindow = null;
  }
  openAssistant('chat', imageDataUrl);
});

ipcMain.on('snip-cancelled', () => {
  if (sniperWindow) {
    sniperWindow.close();
    sniperWindow = null;
  }
});

ipcMain.handle('capture-webview', async (_e, wcId) => {
  try {
    const wc = webContents.fromId(wcId);
    if (wc) {
      const image = await wc.capturePage();
      return image.toDataURL();
    }
  } catch (err) {
    console.error('[Webview] Capture error:', err);
  }
  return null;
});

// Storage and History IPC
ipcMain.handle('store-get', (_e, key, defaultVal) => configStore.get(key, defaultVal));
ipcMain.handle('store-set', (_e, key, val) => {
  configStore.set(key, val);
  return true;
});

ipcMain.handle('history-get', () => historyStore.get('items', []));
ipcMain.handle('history-save', (_e, item) => {
  const current = historyStore.get('items', []);
  const updated = [item, ...current.slice(0, 99)];
  historyStore.set('items', updated);
  return true;
});
ipcMain.handle('history-clear', () => {
  historyStore.set('items', []);
  return true;
});

ipcMain.handle('history-export', async (_e, format) => {
  const items = historyStore.get('items', []);
  const defaultFilename = `l_history_export_${Date.now()}.${format === 'markdown' ? 'md' : 'json'}`;
  
  const { canceled, filePath } = await dialog.showSaveDialog(assistantWindow || iconWindow, {
    defaultPath: defaultFilename,
    filters: format === 'markdown' 
      ? [{ name: 'Markdown', extensions: ['md'] }] 
      : [{ name: 'JSON', extensions: ['json'] }],
  });

  if (canceled || !filePath) return false;

  let content = '';
  if (format === 'markdown') {
    content = `# L Assistant — Export\nGenerated: ${new Date().toISOString()}\n\n`;
    items.forEach((it, idx) => {
      content += `## ${idx + 1}. ${it.title || 'Analysis'} (${it.timestamp})\n`;
      content += `**Mode:** Level ${it.thinkingLevel || 1} | **Latency:** ${it.latency || 'N/A'}\n\n`;
      content += `### Query:\n${it.prompt || it.query || ''}\n\n`;
      content += `### Response:\n${it.response || ''}\n\n---\n\n`;
    });
  } else {
    content = JSON.stringify(items, null, 2);
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  return true;
});

ipcMain.handle('open-external', (_e, url) => shell.openExternal(url));

ipcMain.on('quit-app', () => {
  app.isQuitting = true;
  app.quit();
});

// ----------------------------------------------------------------------
// APPLICATION LIFECYCLE
// ----------------------------------------------------------------------

app.whenReady().then(() => {
  if (session && session.defaultSession) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      const responseHeaders = { ...details.responseHeaders };
      delete responseHeaders['x-frame-options'];
      delete responseHeaders['X-Frame-Options'];
      delete responseHeaders['content-security-policy'];
      delete responseHeaders['Content-Security-Policy'];
      delete responseHeaders['content-security-policy-report-only'];
      delete responseHeaders['Content-Security-Policy-Report-Only'];
      callback({ cancel: false, responseHeaders });
    });
  }

  createFloatingIconWindow();
  setupTray();
  registerGlobalShortcuts();

  // Watch for monitor connect / disconnect / scale change
  screen.on('display-metrics-changed', () => {
    if (iconWindow) {
      const bounds = iconWindow.getBounds();
      const clamped = clampBoundsToScreen(bounds, bounds.width, bounds.height);
      iconWindow.setPosition(clamped.x, clamped.y);
    }
  });

  screen.on('display-removed', () => {
    if (iconWindow) {
      const bounds = iconWindow.getBounds();
      const clamped = clampBoundsToScreen(bounds, bounds.width, bounds.height);
      iconWindow.setPosition(clamped.x, clamped.y);
    }
  });

  app.on('activate', () => {
    if (!iconWindow) {
      createFloatingIconWindow();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Crucial: closing windows must never terminate the background application
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && app.isQuitting) {
    app.quit();
  }
});
