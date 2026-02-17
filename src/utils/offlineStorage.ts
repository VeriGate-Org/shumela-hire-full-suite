// IndexedDB wrapper for offline storage
export interface OfflineStorageManager {
  store: (key: string, data: any) => Promise<void>;
  get: (key: string) => Promise<any>;
  remove: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  getAllKeys: () => Promise<string[]>;
}

export interface OfflineAction {
  id?: number;
  type: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  timestamp?: number;
}

export class IndexedDBManager implements OfflineStorageManager {
  private dbName = 'shumelahire-offline';
  private version = 1;
  private db: IDBDatabase | null = null;

  private async openDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('offline-actions')) {
          const actionsStore = db.createObjectStore('offline-actions', { keyPath: 'id', autoIncrement: true });
          actionsStore.createIndex('type', 'type', { unique: false });
          actionsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('cached-data')) {
          db.createObjectStore('cached-data', { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains('user-preferences')) {
          db.createObjectStore('user-preferences', { keyPath: 'key' });
        }
      };
    });
  }

  async store(key: string, data: any): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction(['cached-data'], 'readwrite');
    const store = transaction.objectStore('cached-data');
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put({ 
        key, 
        data, 
        timestamp: Date.now(),
        expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async get(key: string): Promise<any> {
    const db = await this.openDB();
    const transaction = db.transaction(['cached-data'], 'readonly');
    const store = transaction.objectStore('cached-data');
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }

        // Check if data has expired
        if (result.expires && Date.now() > result.expires) {
          // Remove expired data
          this.remove(key);
          resolve(null);
          return;
        }

        resolve(result.data);
      };
    });
  }

  async remove(key: string): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction(['cached-data'], 'readwrite');
    const store = transaction.objectStore('cached-data');
    
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction(['cached-data'], 'readwrite');
    const store = transaction.objectStore('cached-data');
    
    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getAllKeys(): Promise<string[]> {
    const db = await this.openDB();
    const transaction = db.transaction(['cached-data'], 'readonly');
    const store = transaction.objectStore('cached-data');
    
    return new Promise((resolve, reject) => {
      const request = store.getAllKeys();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as string[]);
    });
  }

  // Offline action methods
  async storeOfflineAction(action: OfflineAction): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction(['offline-actions'], 'readwrite');
    const store = transaction.objectStore('offline-actions');
    
    await new Promise<void>((resolve, reject) => {
      const request = store.add({
        ...action,
        timestamp: Date.now()
      });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getOfflineActions(type?: string): Promise<OfflineAction[]> {
    const db = await this.openDB();
    const transaction = db.transaction(['offline-actions'], 'readonly');
    const store = transaction.objectStore('offline-actions');
    
    return new Promise((resolve, reject) => {
      let request: IDBRequest;
      
      if (type) {
        const index = store.index('type');
        request = index.getAll(type);
      } else {
        request = store.getAll();
      }
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async removeOfflineAction(id: number): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction(['offline-actions'], 'readwrite');
    const store = transaction.objectStore('offline-actions');
    
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}
