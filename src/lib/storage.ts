
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
        entryStore.createIndex('productId', 'productId', {unique: false});
      }
      if (!db.objectStoreNames.contains(STORE_SALES)) {
        const saleStore = db.createObjectStore(STORE_SALES, { keyPath: 'id' });
        saleStore.createIndex('date', 'date', { unique: false });
        saleStore.createIndex('productId', 'productId', {unique: false});
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      db.onversionchange = () => {
        db.close();
        alert("Uma nova versão da página está pronta. Por favor, recarregue!");
        window.location.reload();
      };
      resolve(db);
    };

    request.onerror = (event) => {
      console.error("IndexedDB error:", (event.target as IDBOpenDBRequest).error);
      dbPromise = null; 
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

// Product Management functions
export const getProducts = (): Promise<Product[]> => getAll<Product>(STORE_PRODUCTS);
export const getProductById = (id: string): Promise<Product | undefined> => getById<Product>(STORE_PRODUCTS, id);
export const addProduct = (product: Product): Promise<IDBValidKey> => add<Product>(STORE_PRODUCTS, product);
export const updateProduct = (product: Product): Promise<IDBValidKey> => put<Product>(STORE_PRODUCTS, product);
export const deleteProduct = (id: string): Promise<void> => deleteItem(STORE_PRODUCTS, id);

// Entry Management functions
export const getEntries = async (): Promise<Entry[]> => {
    const entries = await getAll<Entry>(STORE_ENTRIES);
    return entries.map(entry => ({ ...entry, date: new Date(entry.date) })).sort((a,b) => b.date.getTime() - a.date.getTime());
};
export const addEntry = (entry: Entry): Promise<IDBValidKey> => add<Entry>(STORE_ENTRIES, entry);
export const deleteEntry = (id: string): Promise<void> => deleteItem(STORE_ENTRIES, id);


// Sale Management functions
export const getSales = async (): Promise<Sale[]> => {
    const sales = await getAll<Sale>(STORE_SALES);
    return sales.map(sale => ({ ...sale, date: new Date(sale.date) })).sort((a,b) => b.date.getTime() - a.date.getTime());
};
export const addSale = (sale: Sale): Promise<IDBValidKey> => add<Sale>(STORE_SALES, sale);
export const deleteSale = (id: string): Promise<void> => deleteItem(STORE_SALES, id);

// Function to initialize products if DB is empty
export const initializeProductsDB = async (): Promise<void> => {
  try {
    const productsFromDB = await getProducts();
    if (productsFromDB.length === 0) {
      const store = await getStore(STORE_PRODUCTS, 'readwrite');
      const transaction = store.transaction;
      
      await new Promise<void>((resolveTransaction, rejectTransaction) => {
        transaction.oncomplete = () => resolveTransaction();
        transaction.onerror = (event) => {
            console.error("Transaction error during initial product add:", transaction.error || (event.target as IDBTransaction).error);
            rejectTransaction(transaction.error || (event.target as IDBTransaction).error);
        };
        transaction.onabort = () => {
            console.error("Transaction aborted during initial product add");
            rejectTransaction(new Error("Transaction aborted"));
        };

        const addPromises = initialProductsData.map(product => {
          return new Promise<void>((resolveProductAdd, rejectProductAdd) => {
            if (transaction.db.objectStoreNames.contains(STORE_PRODUCTS)){ // ensure store still exists
                const request = store.add(product);
                request.onsuccess = () => resolveProductAdd();
                request.onerror = (event) => {
                    console.error("Error adding initial product:", (event.target as IDBRequest).error);
                    rejectProductAdd((event.target as IDBRequest).error);
                }
            } else {
                rejectProductAdd(new Error(`Object store ${STORE_PRODUCTS} not found.`));
            }
          });
        });
        
        Promise.all(addPromises)
        .then(() => {
            // On transaction complete is handled above
        })
        .catch(error => {
            console.error("Error in Promise.all for initial products:", error);
            if (transaction.error === null && !transaction.objectStoreNames.length) { // Check if transaction is still active
                 try { transaction.abort(); } catch (e) { console.error("Error aborting transaction:", e); }
            }
            rejectTransaction(error);
        });
      });
      console.log("Initial products populated into IndexedDB.");
    }
  } catch (error) {
    console.error("Failed to initialize products in IndexedDB:", error);
  }
};

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
  const db = await openDB(); 

  const clearStore = async (storeName: string) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();
    return new Promise<void>((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => resolve(); 
      transaction.onerror = () => reject(transaction.error);
    });
  };

  const populateStore = async <T extends { id: string }>(storeName: string, items: T[]) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    for (const item of items) {
      let itemToAdd = item;
      if ((storeName === STORE_ENTRIES || storeName === STORE_SALES) && (item as any).date && typeof (item as any).date === 'string') {
        itemToAdd = { ...item, date: new Date((item as any).date) };
      }
      const request = store.add(itemToAdd);
      await new Promise<void>((resolve, reject) => { 
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }
    return new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  };

  try {
    await clearStore(STORE_PRODUCTS);
    await populateStore(STORE_PRODUCTS, data.products);
    
    await clearStore(STORE_ENTRIES);
    await populateStore(STORE_ENTRIES, data.entries);

    await clearStore(STORE_SALES);
    await populateStore(STORE_SALES, data.sales);

  } catch (error) {
    console.error("Error restoring data to IndexedDB", error);
    throw error; 
  }
};

if (typeof window !== 'undefined' && window.indexedDB) {
    openDB().then(async () => { 
      try {
        await initializeProductsDB();
      } catch (error) {
        console.error("Error during top-level initializeProductsDB:", error);
      }
    }).catch(error => {
        console.error("Error opening DB for initialization:", error);
    });
}




    