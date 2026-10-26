/**
 * Storage Service for L HUD.
 * Seamlessly abstracts Electron IPC storage with browser localStorage fallback.
 */

const HAS_ELECTRON = typeof window !== 'undefined' && !!window.electronAPI;

export const storageService = {
  async get(key, defaultValue = null) {
    if (HAS_ELECTRON && window.electronAPI.getStore) {
      try {
        const val = await window.electronAPI.getStore(key, defaultValue);
        return val !== undefined && val !== null ? val : defaultValue;
      } catch (e) {
        console.warn('[Storage] Electron getStore error, falling back:', e);
      }
    }
    try {
      const item = localStorage.getItem(`l_hud_${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  async set(key, value) {
    if (HAS_ELECTRON && window.electronAPI.setStore) {
      try {
        await window.electronAPI.setStore(key, value);
      } catch (e) {
        console.warn('[Storage] Electron setStore error:', e);
      }
    }
    try {
      localStorage.setItem(`l_hud_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error('[Storage] localStorage set error:', e);
    }
    return true;
  },

  async getHistory() {
    if (HAS_ELECTRON && window.electronAPI.getHistory) {
      try {
        return await window.electronAPI.getHistory();
      } catch (e) {
        console.warn('[Storage] Electron getHistory error:', e);
      }
    }
    try {
      const items = localStorage.getItem('l_hud_history');
      return items ? JSON.parse(items) : [];
    } catch {
      return [];
    }
  },

  async saveHistoryItem(item) {
    if (HAS_ELECTRON && window.electronAPI.saveHistoryItem) {
      try {
        await window.electronAPI.saveHistoryItem(item);
      } catch (e) {
        console.warn('[Storage] Electron saveHistoryItem error:', e);
      }
    }
    try {
      const current = await this.getHistory();
      const updated = [item, ...current.slice(0, 99)];
      localStorage.setItem('l_hud_history', JSON.stringify(updated));
    } catch (e) {
      console.error('[Storage] History save error:', e);
    }
    return true;
  },

  async clearHistory() {
    if (HAS_ELECTRON && window.electronAPI.clearHistory) {
      try {
        await window.electronAPI.clearHistory();
      } catch (e) {
        console.warn('[Storage] Electron clearHistory error:', e);
      }
    }
    try {
      localStorage.removeItem('l_hud_history');
    } catch {}
    return true;
  },

  async exportHistory(format = 'markdown') {
    if (HAS_ELECTRON && window.electronAPI.exportHistory) {
      try {
        return await window.electronAPI.exportHistory(format);
      } catch (e) {
        console.warn('[Storage] Electron exportHistory error:', e);
      }
    }
    // Web fallback export: download file directly
    try {
      const items = await this.getHistory();
      let content = '';
      let mimeType = 'text/plain';
      let extension = 'txt';

      if (format === 'markdown') {
        mimeType = 'text/markdown';
        extension = 'md';
        content = `# "L" AI HUD — Vault History Export\nGenerated: ${new Date().toISOString()}\n\n`;
        items.forEach((it, idx) => {
          content += `## ${idx + 1}. ${it.title || 'Analysis'} (${it.timestamp})\n`;
          content += `**Thinking Depth:** Level ${it.thinkingLevel || 1} | **Latency:** ${it.latency || 'N/A'}\n\n`;
          content += `### Query:\n${it.prompt || it.query || ''}\n\n`;
          content += `### Response:\n${it.response || ''}\n\n---\n\n`;
        });
      } else {
        mimeType = 'application/json';
        extension = 'json';
        content = JSON.stringify(items, null, 2);
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `l_vault_history_${Date.now()}.${extension}`;
      a.click();
      URL.revokeObjectURL(url);
      return true;
    } catch (e) {
      console.error('[Storage] Fallback export error:', e);
      return false;
    }
  },
};
