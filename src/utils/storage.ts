import { ProductItem, Order, AppSettings, ExpenseItem, SavedPackage } from '../types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_SETTINGS, INITIAL_EXPENSES, INITIAL_PACKAGES } from '../data/initialData';

const PRODUCTS_KEY = 'packagecraft_products_v2';
const ORDERS_KEY = 'packagecraft_orders_v2';
const SETTINGS_KEY = 'packagecraft_settings_v2';
const EXPENSES_KEY = 'packagecraft_expenses_v2';
const PACKAGES_KEY = 'packagecraft_packages_v2';

export function loadProducts(): ProductItem[] {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (!raw) {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_PRODUCTS;
  }
}

export function saveProducts(products: ProductItem[]): void {
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  } catch (e) {
    console.error(e);
  }
}

export function loadPackages(): SavedPackage[] {
  try {
    const raw = localStorage.getItem(PACKAGES_KEY);
    if (!raw) {
      localStorage.setItem(PACKAGES_KEY, JSON.stringify(INITIAL_PACKAGES));
      return INITIAL_PACKAGES;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_PACKAGES;
  }
}

export function savePackages(packages: SavedPackage[]): void {
  try {
    localStorage.setItem(PACKAGES_KEY, JSON.stringify(packages));
  } catch (e) {
    console.error(e);
  }
}

export function loadOrders(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(INITIAL_ORDERS));
      return INITIAL_ORDERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_ORDERS;
  }
}

export function saveOrders(orders: Order[]): void {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error(e);
  }
}

export function loadExpenses(): ExpenseItem[] {
  try {
    const raw = localStorage.getItem(EXPENSES_KEY);
    if (!raw) {
      localStorage.setItem(EXPENSES_KEY, JSON.stringify(INITIAL_EXPENSES));
      return INITIAL_EXPENSES;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_EXPENSES;
  }
}

export function saveExpenses(expenses: ExpenseItem[]): void {
  try {
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  } catch (e) {
    console.error(e);
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(INITIAL_SETTINGS));
      return INITIAL_SETTINGS;
    }
    return { ...INITIAL_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    return INITIAL_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error(e);
  }
}

export function resetAllData(): {
  products: ProductItem[];
  orders: Order[];
  expenses: ExpenseItem[];
  settings: AppSettings;
  packages: SavedPackage[];
} {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
  localStorage.setItem(ORDERS_KEY, JSON.stringify(INITIAL_ORDERS));
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(INITIAL_EXPENSES));
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(INITIAL_SETTINGS));
  localStorage.setItem(PACKAGES_KEY, JSON.stringify(INITIAL_PACKAGES));
  return {
    products: INITIAL_PRODUCTS,
    orders: INITIAL_ORDERS,
    expenses: INITIAL_EXPENSES,
    settings: INITIAL_SETTINGS,
    packages: INITIAL_PACKAGES,
  };
}

export function exportAllData(): string {
  const data = {
    products: loadProducts(),
    orders: loadOrders(),
    packages: loadPackages(),
    expenses: loadExpenses(),
    settings: loadSettings(),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}

