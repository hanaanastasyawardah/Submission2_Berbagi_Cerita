const DB_NAME = 'berbagi-cerita-db';
const DB_VERSION = 1;
const STORE_NAME = 'favorites';
const OFFLINE_STORE = 'offline-stories';

class IndexedDBHelper {
  constructor() {
    this.db = null;
  }

  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB: Error opening database');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB: Database opened successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        console.log('IndexedDB: Upgrading database');

        // Create favorites store
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          objectStore.createIndex('name', 'name', { unique: false });
          objectStore.createIndex('createdAt', 'createdAt', { unique: false });
          console.log('IndexedDB: Favorites store created');
        }

        // Create offline stories store for sync
        if (!db.objectStoreNames.contains(OFFLINE_STORE)) {
          const offlineStore = db.createObjectStore(OFFLINE_STORE, { 
            keyPath: 'tempId', 
            autoIncrement: true 
          });
          offlineStore.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('IndexedDB: Offline stories store created');
        }
      };
    });
  }

  async ensureDB() {
    if (!this.db) {
      await this.openDB();
    }
  }

  // FAVORITES METHODS

  async addFavorite(story) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(story);

      request.onsuccess = () => {
        console.log('IndexedDB: Story added to favorites', story.id);
        resolve(story);
      };

      request.onerror = () => {
        console.error('IndexedDB: Error adding favorite');
        reject(request.error);
      };
    });
  }

  async getAllFavorites() {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        console.log('IndexedDB: Retrieved all favorites', request.result.length);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('IndexedDB: Error getting favorites');
        reject(request.error);
      };
    });
  }

  async getFavoriteById(id) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('IndexedDB: Error getting favorite');
        reject(request.error);
      };
    });
  }

  async deleteFavorite(id) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('IndexedDB: Story removed from favorites', id);
        resolve(id);
      };

      request.onerror = () => {
        console.error('IndexedDB: Error deleting favorite');
        reject(request.error);
      };
    });
  }

  async searchFavorites(query) {
    await this.ensureDB();
    
    const favorites = await this.getAllFavorites();
    const lowerQuery = query.toLowerCase();
    
    return favorites.filter(story => {
      const name = (story.name || '').toLowerCase();
      const description = (story.description || '').toLowerCase();
      return name.includes(lowerQuery) || description.includes(lowerQuery);
    });
  }

  async sortFavorites(sortBy = 'createdAt', order = 'desc') {
    await this.ensureDB();
    
    const favorites = await this.getAllFavorites();
    
    return favorites.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'createdAt') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      
      if (order === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }

  // OFFLINE SYNC METHODS

  async addOfflineStory(storyData) {
    await this.ensureDB();
    
    const offlineStory = {
      ...storyData,
      timestamp: Date.now(),
      synced: false
    };
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([OFFLINE_STORE], 'readwrite');
      const store = transaction.objectStore(OFFLINE_STORE);
      const request = store.add(offlineStory);

      request.onsuccess = () => {
        console.log('IndexedDB: Offline story saved');
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('IndexedDB: Error saving offline story');
        reject(request.error);
      };
    });
  }

  async getAllOfflineStories() {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([OFFLINE_STORE], 'readonly');
      const store = transaction.objectStore(OFFLINE_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async deleteOfflineStory(tempId) {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([OFFLINE_STORE], 'readwrite');
      const store = transaction.objectStore(OFFLINE_STORE);
      const request = store.delete(tempId);

      request.onsuccess = () => {
        console.log('IndexedDB: Offline story deleted');
        resolve(tempId);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async clearAllOfflineStories() {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([OFFLINE_STORE], 'readwrite');
      const store = transaction.objectStore(OFFLINE_STORE);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('IndexedDB: All offline stories cleared');
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }
}

export default new IndexedDBHelper();