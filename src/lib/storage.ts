
import type { Product, Entry, Sale } from './types';
import { initialProductsData } from './products';

const DB_NAME = 'ControleDocesDB';
const DB_VERSION = 1;
const STORE_PRODUCTS = 'products';
const STORE_ENTRIES = 'entries';
const STORE_SALES = 'sales';

let dbPromise: Promise<IDBDatabase> | null = null;

const openDB = (): Promise<IDBDatabase> => {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error("IndexedDB is not supported or not available in this environment."));
  }
  if (dbPromise) {
    return dbPromise;
  }
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PRODUCTS)) {
        db.createObjectStore(STORE_PRODUCTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_ENTRIES)) {
        const entryStore = db.createObjectStore(STORE_ENTRIES, { keyPath: 'id' });
        entryStore.createIndex('date', 'date', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_SALES)) {
        const saleStore = db.createObjectStore(STORE_SALES, { keyPath: 'id' });
        saleStore.createIndex('date', 'date', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      // Close the DB connection if an older version is open elsewhere in the same browser context
      db.onversionchange = () => {
        db.close();
        alert("Uma nova versão da página está pronta. Por favor, recarregue!");
        window.location.reload();
      };
      resolve(db);
    };

    request.onerror = (event) => {
      console.error("IndexedDB error:", (event.target as IDBOpenDBRequest).error);
      dbPromise = null; // Reset promise if an error occurs
      reject(new Error("Error opening IndexedDB: " + (event.target as IDBOpenDBRequest).error?.name));
    };
  });
  return dbPromise;
};

const getStore = (storeName: string, mode: IDBTransactionMode): Promise<IDBObjectStore> => {
  return openDB().then(db => {
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  });
};

// Generic CRUD operations
const getAll = async <T>(storeName: string): Promise<T[]> => {
  const store = await getStore(storeName, 'readonly');
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
};

const getById = async <T>(storeName: string, id: string): Promise<T | undefined> => {
  const store = await getStore(storeName, 'readonly');
  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error);
  });
};

const add = async <T>(storeName: string, item: T): Promise<IDBValidKey> => {
  const store = await getStore(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.add(item);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const put = async <T>(storeName: string, item: T): Promise<IDBValidKey> => {
  const store = await getStore(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.put(item);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const deleteItem = async (storeName: string, id: string): Promise<void> => {
  const store = await getStore(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const clear = async (storeName: string): Promise<void> => {
  const store = await getStore(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};


// Initialize Products
export const initializeProductsDB = async (): Promise<void> => {
  try {
    const products = await getProducts();
    if (products.length === 0) {
      const store = await getStore(STORE_PRODUCTS, 'readwrite');
      const transaction = store.transaction;
      await Promise.all(initialProductsData.map(product => {
        return new Promise<void>((resolve, reject) => {
          const request = store.add(product);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }));
      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    }
  } catch (error) {
    console.error("Failed to initialize products in IndexedDB", error);
  }
};
// Call initialization once. This is a side effect, might be better handled in app root.
if (typeof window !== 'undefined') {
  initializeProductsDB();
}


// Product Management
export const getProducts = (): Promise<Product[]> => getAll<Product>(STORE_PRODUCTS);
export const getProductById = (id: string): Promise<Product | undefined> => getById<Product>(STORE_PRODUCTS, id);
export const addProduct = (product: Product): Promise<IDBValidKey> => add<Product>(STORE_PRODUCTS, product);
export const updateProduct = (product: Product): Promise<IDBValidKey> => put<Product>(STORE_PRODUCTS, product);
export const deleteProduct = (id: string): Promise<void> => deleteItem(STORE_PRODUCTS, id);

// Entry Management
export const getEntries = async (): Promise<Entry[]> => {
    const entries = await getAll<Entry>(STORE_ENTRIES);
    return entries.map(entry => ({ ...entry, date: new Date(entry.date) })).sort((a,b) => b.date.getTime() - a.date.getTime());
};
export const addEntry = (entry: Entry): Promise<IDBValidKey> => add<Entry>(STORE_ENTRIES, entry);

// Sale Management
export const getSales = async (): Promise<Sale[]> => {
    const sales = await getAll<Sale>(STORE_SALES);
    return sales.map(sale => ({ ...sale, date: new Date(sale.date) })).sort((a,b) => b.date.getTime() - a.date.getTime());
};
export const addSale = (sale: Sale): Promise<IDBValidKey> => add<Sale>(STORE_SALES, sale);


// Backup/Restore
export interface BackupData {
  products: Product[];
  entries: Entry[];
  sales: Sale[];
}

export const getBackupData = async (): Promise<BackupData> => {
  const [products, entries, sales] = await Promise.all([
    getProducts(),
    getEntries(),
    getSales(),
  ]);
  return { products, entries, sales };
};

export const restoreBackupData = async (data: BackupData): Promise<void> => {
  try {
    const productStore = await getStore(STORE_PRODUCTS, 'readwrite');
    await new Promise<void>((resolve, reject) => { const req = productStore.clear(); req.onsuccess = () => resolve(); req.onerror = () => reject(req.error);});
    for (const product of data.products) {
      await new Promise<void>((resolve, reject) => { const req = productStore.add(product); req.onsuccess = () => resolve(); req.onerror = () => reject(req.error);});
    }
    
    const entryStore = await getStore(STORE_ENTRIES, 'readwrite');
    await new Promise<void>((resolve, reject) => { const req = entryStore.clear(); req.onsuccess = () => resolve(); req.onerror = () => reject(req.error);});
    for (const entry of data.entries) {
        // Ensure dates are Date objects
      await new Promise<void>((resolve, reject) => { const req = entryStore.add({...entry, date: new Date(entry.date)}); req.onsuccess = () => resolve(); req.onerror = () => reject(req.error);});
    }

    const saleStore = await getStore(STORE_SALES, 'readwrite');
    await new Promise<void>((resolve, reject) => { const req = saleStore.clear(); req.onsuccess = () => resolve(); req.onerror = () => reject(req.error);});
    for (const sale of data.sales) {
         // Ensure dates are Date objects
      await new Promise<void>((resolve, reject) => { const req = saleStore.add({...sale, date: new Date(sale.date)}); req.onsuccess = () => resolve(); req.onerror = () => reject(req.error);});
    }
  } catch (error) {
    console.error("Error restoring data to IndexedDB", error);
    throw error; // Re-throw to be caught by the calling UI
  }
};
