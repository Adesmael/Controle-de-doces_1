
import type { Product, Entry, Sale } from './types';
import { initialProductsData } from './products'; 

const PRODUCTS_KEY = 'bananaBlissApp_products';
const ENTRIES_KEY = 'bananaBlissApp_entries';
const SALES_KEY = 'bananaBlissApp_sales';

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
