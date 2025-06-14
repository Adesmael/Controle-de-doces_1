
import type { Product, Entry, Sale } from './types';
import { initialProductsData } from './products'; 

// Adjusted storage keys for the new app name
const APP_PREFIX = 'controleDocesApp_';
const PRODUCTS_KEY = `${APP_PREFIX}products`;
const ENTRIES_KEY = `${APP_PREFIX}entries`;
const SALES_KEY = `${APP_PREFIX}sales`;


// Product Management
export const getStoredProducts = (): Product[] => {
  if (typeof window === 'undefined') return [...initialProductsData]; 
  try {
    const stored = localStorage.getItem(PRODUCTS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(initialProductsData));
    return [...initialProductsData];
  } catch (error) {
    console.error("Error reading products from localStorage", error);
    return [...initialProductsData];
  }
};

export const saveStoredProducts = (products: Product[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  } catch (error) {
    console.error("Error saving products to localStorage", error);
  }
};

// Entry Management
export const getStoredEntries = (): Entry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(ENTRIES_KEY);
    const entries = stored ? JSON.parse(stored) : [];
    return entries.map((entry: any) => ({ ...entry, date: new Date(entry.date) }));
  } catch (error) {
    console.error("Error reading entries from localStorage", error);
    return [];
  }
};

export const saveStoredEntries = (entries: Entry[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error("Error saving entries to localStorage", error);
  }
};

// Sale Management
export const getStoredSales = (): Sale[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(SALES_KEY);
    const sales = stored ? JSON.parse(stored) : [];
    return sales.map((sale: any) => ({ ...sale, date: new Date(sale.date) }));
  } catch (error) {
    console.error("Error reading sales from localStorage", error);
    return [];
  }
};

export const saveStoredSales = (sales: Sale[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SALES_KEY, JSON.stringify(sales));
  } catch (error) {
    console.error("Error saving sales to localStorage", error);
  }
};

// Backup/Restore
export interface BackupData {
  products: Product[];
  entries: Entry[];
  sales: Sale[];
}

export const getBackupData = (): BackupData => {
  return {
    products: getStoredProducts(),
    entries: getStoredEntries(),
    sales: getStoredSales(),
  };
};

export const restoreBackupData = (data: BackupData) => {
  if (data.products) saveStoredProducts(data.products);
  if (data.entries) saveStoredEntries(data.entries.map((entry: any) => ({ ...entry, date: new Date(entry.date) })));
  if (data.sales) saveStoredSales(data.sales.map((sale: any) => ({ ...sale, date: new Date(sale.date) })));
};


// --- IndexedDB Setup ---
const DB_NAME = 'ControleDocesDB';
const DB_VERSION = 1; // Increment this when schema changes

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
        reject("IndexedDB is not supported or not available in this environment.");
        return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('entries')) {
        db.createObjectStore('entries', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('sales')) {
        db.createObjectStore('sales', { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      console.error("IndexedDB error:", (event.target as IDBOpenDBRequest).error);
      reject("Error opening IndexedDB: " + (event.target as IDBOpenDBRequest).error?.name);
    };
  });
};

// For now, to demonstrate an initial step, we'll log that the DB can be opened.
// This is a side effect and in a larger app might be handled in an initialization module.
if (typeof window !== 'undefined' && window.indexedDB) {
  openDB().then(db => {
    console.log('ControleDocesDB setup initiated. Database opened successfully. Version:', db.version);
    // It's good practice to close the DB if it's not being actively used by the current operation.
    // For this initial setup, we'll just open and log.
    // In a real migration, you'd get this db instance and pass it to your CRUD functions.
    db.close(); 
  }).catch(error => {
    console.warn('Failed to open ControleDocesDB for initial setup:', error);
  });
}

// TODO: Future steps will involve:
// 1. Migrating getStoredProducts, saveStoredProducts to use IndexedDB (async).
// 2. Migrating getStoredEntries, saveStoredEntries to use IndexedDB (async).
// 3. Migrating getStoredSales, saveStoredSales to use IndexedDB (async).
// 4. Updating components to handle asynchronous data fetching from IndexedDB.
// 5. Updating backup/restore to use IndexedDB.
