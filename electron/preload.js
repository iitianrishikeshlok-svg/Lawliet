const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose secure API bridge for L Desktop Utility.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // Floating Icon Lifecycle & State
  getAppState: () => ipcRenderer.invoke('get-app-state'),
  setIconState: (state) => ipcRenderer.invoke('set-icon-state', state),
  hideIcon: () => ipcRenderer.invoke('hide-icon'),
  restoreIcon: () => ipcRenderer.invoke('restore-icon'),
  toggleIcon: () => ipcRenderer.invoke('toggle-icon'),
  saveIconPosition: (pos) => ipcRenderer.invoke('save-icon-position', pos),
  resetIconPosition: () => ipcRenderer.invoke('reset-icon-position'),

  // Windows & Menus
  openActionMenu: (anchorBounds) => ipcRenderer.invoke('open-action-menu', anchorBounds),
  closeActionMenu: () => ipcRenderer.invoke('close-action-menu'),
  openAssistant: (tab = 'chat', attachment = null) => ipcRenderer.invoke('open-assistant', { tab, attachment }),
  closeAssistant: () => ipcRenderer.invoke('close-assistant'),
  openBrowser: (url = 'https://duckduckgo.com') => ipcRenderer.invoke('open-browser', { url }),
  closeBrowser: () => ipcRenderer.invoke('close-browser'),

  // Backward compatibility with previous expand/collapse calls
  expandHUD: (width = 440, height = 640) => ipcRenderer.invoke('open-assistant', { tab: 'chat' }),
  collapseHUD: () => ipcRenderer.invoke('close-assistant'),
  toggleHUD: () => ipcRenderer.invoke('toggle-hud'),
  setWindowOpacity: (opacity) => ipcRenderer.invoke('set-window-opacity', opacity),
  setAlwaysOnTop: (flag) => ipcRenderer.invoke('set-always-on-top', flag),
  getWindowState: () => ipcRenderer.invoke('get-window-state'),

  // Screen Snip & Vision Capture
  triggerSnip: () => ipcRenderer.invoke('trigger-snip'),
  captureScreenFrame: () => ipcRenderer.invoke('capture-screen-frame'),
  onSnipCaptured: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('snip-captured', handler);
    return () => ipcRenderer.removeListener('snip-captured', handler);
  },
  onScreenBufferReady: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('screen-buffer-ready', handler);
    return () => ipcRenderer.removeListener('screen-buffer-ready', handler);
  },
  sendSnipResult: (imageDataUrl) => ipcRenderer.send('snip-result-selected', imageDataUrl),
  cancelSnipOverlay: () => ipcRenderer.send('snip-cancelled'),

  // Mini-Browser Capture
  captureWebviewPage: (webContentsId) => ipcRenderer.invoke('capture-webview', webContentsId),

  // Storage & Persistent Configuration
  getStore: (key, defaultVal) => ipcRenderer.invoke('store-get', key, defaultVal),
  setStore: (key, val) => ipcRenderer.invoke('store-set', key, val),
  getHistory: () => ipcRenderer.invoke('history-get'),
  saveHistoryItem: (item) => ipcRenderer.invoke('history-save', item),
  clearHistory: () => ipcRenderer.invoke('history-clear'),
  exportHistory: (format) => ipcRenderer.invoke('history-export', format),

  // System Events & Notifications
  onAppStateChanged: (callback) => {
    const handler = (_event, state) => callback(state);
    ipcRenderer.on('app-state-changed', handler);
    return () => ipcRenderer.removeListener('app-state-changed', handler);
  },
  onThemeChanged: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('theme-changed', handler);
    return () => ipcRenderer.removeListener('theme-changed', handler);
  },
  onOpenActionRequested: (callback) => {
    const handler = (_event, action) => callback(action);
    ipcRenderer.on('open-action', handler);
    return () => ipcRenderer.removeListener('open-action', handler);
  },

  // System Utilities
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  quitApp: () => ipcRenderer.send('quit-app'),
});
