import fs from 'fs';
import path from 'path';
import electron from 'electron';

const app = electron.app;

/**
 * Robust JSON-backed local storage engine for persistent configuration and history.
 */
class LocalStore {
  constructor(filename = 'l_storage.json', defaultData = {}) {
    try {
      this.userDataPath = app ? app.getPath('userData') : process.cwd();
    } catch {
      this.userDataPath = process.cwd();
    }
    this.filePath = path.join(this.userDataPath, filename);
    this.data = this.readData(defaultData);
  }

  readData(defaultData) {
    try {
      if (!fs.existsSync(this.filePath)) {
        fs.mkdirSync(this.userDataPath, { recursive: true });
        fs.writeFileSync(this.filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
        return { ...defaultData };
      }
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      return { ...defaultData, ...JSON.parse(raw) };
    } catch (err) {
      console.warn(`[LocalStore] Failed reading ${this.filePath}, falling back to defaults:`, err);
      return { ...defaultData };
    }
  }

  get(key, defaultValue = null) {
    return this.data[key] !== undefined ? this.data[key] : defaultValue;
  }

  set(key, value) {
    this.data[key] = value;
    this.persist();
  }

  getAll() {
    return { ...this.data };
  }

  persist() {
    try {
      fs.mkdirSync(this.userDataPath, { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error(`[LocalStore] Failed persisting ${this.filePath}:`, err);
    }
  }
}

export default LocalStore;
