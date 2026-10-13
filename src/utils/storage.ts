import { ProductItem, Order, AppSettings, ExpenseItem, SavedPackage, KeepNote, CourierShipment, CourierApiConfig } from '../types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_SETTINGS, INITIAL_EXPENSES, INITIAL_PACKAGES } from '../data/initialData';

const PRODUCTS_KEY = 'packagecraft_products_v2';
const ORDERS_KEY = 'packagecraft_orders_v2';
const SETTINGS_KEY = 'packagecraft_settings_v2';
const EXPENSES_KEY = 'packagecraft_expenses_v2';
const PACKAGES_KEY = 'packagecraft_packages_v2';
const NOTES_KEY = 'packagecraft_notes_v2';

export const INITIAL_NOTES: KeepNote[] = [
  {
    id: 'note-1',
    title: 'প্যাকেজিং ও ডেলিভারি চেকলিস্ট',
    content: '',
    type: 'checklist',
    items: [
      { id: 'item-1', text: 'কাস্টম বাবল র‍্যাপ ও টেপ স্টক চেক', completed: true },
      { id: 'item-2', text: 'প্রিন্ট করা ইনভয়েস ভেরিফিকেশন', completed: true },
      { id: 'item-3', text: 'ডেলিভারি কুরিয়ার পিকআপ কনফার্মেশন', completed: false },
      { id: 'item-4', text: 'কাস্টমারকে ট্র্যাকিং আইডি এসএমএস পাঠানো', completed: false }
    ],
    color: 'amber',
    isPinned: true,
    category: 'orders',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'note-2',
    title: 'সাপ্লায়ার অর্ডার রিমাইন্ডার (Keep নোট)',
    content: 'পরবর্তী সপ্তাহের জন্য সুতা এবং প্রিমিয়াম গিফট বক্স পাইকারি মার্কেট থেকে রিস্টক করতে হবে। ন্যূনতম ২০০ পিস এর ডিসকাউন্ট রেট যাচাই করুন।',
    type: 'note',
    color: 'emerald',
    isPinned: false,
    category: 'supplier',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export function loadNotes(): KeepNote[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) {
      localStorage.setItem(NOTES_KEY, JSON.stringify(INITIAL_NOTES));
      return INITIAL_NOTES;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_NOTES;
  }
}

export function saveNotes(notes: KeepNote[]): void {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch (e) {
    console.error(e);
  }
}

const COURIER_SHIPMENTS_KEY = 'packagecraft_courier_shipments_v1';
const COURIER_CONFIG_KEY = 'packagecraft_courier_config_v1';

export const DEFAULT_COURIER_CONFIG: CourierApiConfig = {
  defaultCourier: 'pathao',
  pathao: {
    enabled: true,
    clientId: 'pth_live_budgetchoice_01',
    clientSecret: 'pth_sec_live_bcbd99281',
    username: 'budgetchoicebd@gmail.com',
    storeId: 'BCBD-STORE-01',
    storeName: 'Budget Choice BD',
    sandbox: false,
  },
  steadfast: {
    enabled: true,
    apiKey: 'stf_api_key_8849201',
    secretKey: 'stf_sec_8849201',
  },
  redx: {
    enabled: false,
    apiToken: '',
  },
};

export const INITIAL_COURIER_SHIPMENTS: CourierShipment[] = [
  {
    id: 'ship-101',
    orderId: 'ord-1',
    orderNumber: 'ORD-1001',
    consignmentId: 'PTH-829104',
    trackingCode: 'PTH829104',
    courier: 'pathao',
    customerName: 'Rahim Ahmed',
    customerPhone: '01711223344',
    customerAddress: 'House 14, Road 5, Dhanmondi, Dhaka',
    recipientCity: 'Dhaka',
    recipientZone: 'Dhanmondi',
    codAmount: 0,
    deliveryCharge: 80,
    weightKg: 0.5,
    itemType: 'parcel',
    instruction: 'Handle with care (Gift items inside)',
    status: 'in_transit',
    statusNote: 'Rider assigned, parcel on the way',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'ship-102',
    orderId: 'ord-2',
    orderNumber: 'ORD-1002',
    consignmentId: 'STF-583921',
    trackingCode: 'STF583921',
    courier: 'steadfast',
    customerName: 'Nusrat Jahan',
    customerPhone: '01988776655',
    customerAddress: 'Agrabad C/A, Chittagong',
    recipientCity: 'Chittagong',
    recipientZone: 'Agrabad',
    codAmount: 850,
    deliveryCharge: 130,
    weightKg: 1.2,
    itemType: 'box',
    instruction: 'Call customer before delivery',
    status: 'delivered',
    statusNote: 'Delivered successfully, COD collected',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

export function loadCourierShipments(): CourierShipment[] {
  try {
    const raw = localStorage.getItem(COURIER_SHIPMENTS_KEY);
    if (!raw) {
      localStorage.setItem(COURIER_SHIPMENTS_KEY, JSON.stringify(INITIAL_COURIER_SHIPMENTS));
      return INITIAL_COURIER_SHIPMENTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_COURIER_SHIPMENTS;
  }
}

export function saveCourierShipments(shipments: CourierShipment[]): void {
  try {
    localStorage.setItem(COURIER_SHIPMENTS_KEY, JSON.stringify(shipments));
  } catch (e) {
    console.error(e);
  }
}

export function loadCourierConfig(): CourierApiConfig {
  try {
    const raw = localStorage.getItem(COURIER_CONFIG_KEY);
    if (!raw) {
      localStorage.setItem(COURIER_CONFIG_KEY, JSON.stringify(DEFAULT_COURIER_CONFIG));
      return DEFAULT_COURIER_CONFIG;
    }
    const parsed = JSON.parse(raw);
    const merged: CourierApiConfig = {
      ...DEFAULT_COURIER_CONFIG,
      ...parsed,
      pathao: {
        ...DEFAULT_COURIER_CONFIG.pathao,
        ...(parsed.pathao || {}),
        storeName: parsed.pathao?.storeName || 'Budget Choice BD',
        username: (!parsed.pathao?.username || parsed.pathao?.username === 'merchant@store.com')
          ? 'budgetchoicebd@gmail.com'
          : parsed.pathao.username,
        storeId: (!parsed.pathao?.storeId || parsed.pathao?.storeId === 'STORE-8812')
          ? 'BCBD-STORE-01'
          : parsed.pathao.storeId,
        clientId: (!parsed.pathao?.clientId || parsed.pathao?.clientId === 'demo_client_pth_9941')
          ? 'pth_live_budgetchoice_01'
          : parsed.pathao.clientId,
        clientSecret: (!parsed.pathao?.clientSecret || parsed.pathao?.clientSecret === 'pth_sec_live_99218204')
          ? 'pth_sec_live_bcbd99281'
          : parsed.pathao.clientSecret,
      },
    };
    return merged;
  } catch (e) {
    return DEFAULT_COURIER_CONFIG;
  }
}

export function saveCourierConfig(config: CourierApiConfig): void {
  try {
    localStorage.setItem(COURIER_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error(e);
  }
}



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

