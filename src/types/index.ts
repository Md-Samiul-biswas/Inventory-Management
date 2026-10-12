export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'packaging'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'paid' | 'partial' | 'unpaid' | 'cod';

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  unitCost: number; // Cost Price
  suggestedSellingPrice: number; // Selling Price
  stock: number; // Current Stock
  minStockAlert: number; // Low Stock threshold
  unit: string; // pcs, box, pack, set
  sku?: string;
  notes?: string;
  createdAt: string;
}

export interface PackageOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  subtotalCost: number;
  suggestedPrice?: number;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. ORD-1001
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  packageTitle: string;
  items: PackageOrderItem[];
  
  // Costs
  totalProductCost: number;
  transportCost: number;
  packagingCost: number;
  miscCost: number;
  totalCost: number;

  // Selling & Profit
  sellingPrice: number;
  discount?: number;
  netProfit: number;
  profitMargin: number;

  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  isStockDeducted: boolean;
  orderDate: string; // YYYY-MM-DD
  deliveryDate?: string;
  notes?: string;
  createdAt: string;
}

export interface ExpenseItem {
  id: string;
  title: string;
  category: 'Delivery' | 'Packaging' | 'Product Restock' | 'Marketing' | 'Rent & Utilities' | 'Other';
  amount: number;
  date: string;
  note?: string;
}

export interface AppSettings {
  shopName: string;
  shopPhone: string;
  shopAddress: string;
  currencySymbol: string;
  defaultDeliveryCharge: number;
  defaultPackagingCharge: number;
}

export interface SavedPackageItem {
  id: string;
  productId: string;
  quantity: number;
  isCustom?: boolean;
  customName?: string;
  customCostPrice?: number | '';
  customSellingPrice?: number | '';
  customUnit?: string;
}

export interface SavedPackage {
  id: string;
  name: string;
  description?: string;
  items: SavedPackageItem[];
  customSellingPrice?: number | '';
  defaultDeliveryCharge?: number | '';
  defaultPackagingCharge?: number | '';
  createdAt: string;
}
