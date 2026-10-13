import React, { useState, useMemo, useEffect } from 'react';
import {
  Truck,
  Send,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  User,
  RefreshCw,
  X,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import {
  Order,
  CourierShipment,
  CourierApiConfig,
  CourierDeliveryStatus,
} from '../types';
import { courierService } from '../services/courierService';
import { formatCurrency } from '../utils/formatters';

interface CourierViewProps {
  orders: Order[];
  shipments: CourierShipment[];
  courierConfig: CourierApiConfig;
  onSaveShipment: (shipment: CourierShipment, updatedOrder?: Order) => void;
  onUpdateShipment: (shipment: CourierShipment) => void;
  onDeleteShipment: (shipmentId: string) => void;
  onSaveConfig: (config: CourierApiConfig) => void;
  onUpdateOrderStatus: (orderId: string, status: any) => void;
  preselectedOrder?: Order | null;
}

const STATUS_CONFIG: Record<
  CourierDeliveryStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  pending: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  in_review: { label: 'In Review', bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  pickup_requested: { label: 'Pickup Requested', bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  in_transit: { label: 'In Transit', bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
  out_for_delivery: { label: 'Out for Delivery', bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-200' },
  delivered: { label: 'Delivered', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  returned: { label: 'Returned', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
  cancelled: { label: 'Cancelled', bg: 'bg-neutral-100', text: 'text-neutral-700', border: 'border-neutral-200' },
};

export const CourierView: React.FC<CourierViewProps> = ({
  orders,
  shipments,
  courierConfig,
  onSaveShipment,
  onUpdateShipment,
  onDeleteShipment,
  onUpdateOrderStatus,
  preselectedOrder,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'tracking'>('orders');
  const [search, setSearch] = useState('');
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
  const [copiedTracking, setCopiedTracking] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Send Confirmation Popup State (Name, Phone, Address, Account, Amount)
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  // If preselectedOrder is provided and not already dispatched, open confirmation modal
  useEffect(() => {
    if (preselectedOrder && !preselectedOrder.courierConsignmentId) {
      setPendingOrder(preselectedOrder);
      setActiveTab('orders');
    }
  }, [preselectedOrder]);

  // Show temporary toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Confirm and Send to Pathao Courier
  const handleConfirmSend = async (order: Order) => {
    setIsBooking(true);
    setLoadingOrderId(order.id);
    try {
      const isInsideDhaka = (order.customerAddress || '').toLowerCase().includes('dhaka');
      const deliveryCharge = isInsideDhaka ? 60 : 120;

      const newShipment = await courierService.bookShipment(
        {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerAddress: order.customerAddress || 'Dhaka',
          recipientCity: isInsideDhaka ? 'Dhaka' : 'Outside Dhaka',
          codAmount: order.sellingPrice,
          deliveryCharge,
          weightKg: 0.5,
          itemType: 'parcel',
          instruction: order.packageTitle || 'Gift package',
          courier: 'pathao',
        },
        courierConfig
      );

      const updatedOrder: Order = {
        ...order,
        status: 'shipped',
        courierProvider: 'pathao',
        courierConsignmentId: newShipment.consignmentId,
        courierTrackingCode: newShipment.trackingCode,
        courierStatus: newShipment.status,
      };

      onSaveShipment(newShipment, updatedOrder);
      onUpdateOrderStatus(order.id, 'shipped');

      setPendingOrder(null);
      showToast(`পার্সেলটি পাঠাও ড্যাশবোর্ডে পাঠানো হয়েছে! (ID: ${newShipment.consignmentId})`);

      // Open Pathao merchant portal directly in new tab
      window.open('https://merchant.pathao.com', '_blank');
    } catch (err: any) {
      alert(`Error sending to Pathao: ${err.message || err}`);
    } finally {
      setIsBooking(false);
      setLoadingOrderId(null);
    }
  };

  const handleCopyTracking = (tracking: string) => {
    navigator.clipboard.writeText(tracking);
    setCopiedTracking(tracking);
    setTimeout(() => setCopiedTracking(null), 2000);
  };

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchText =
        o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        o.customerName.toLowerCase().includes(search.toLowerCase()) ||
        o.customerPhone.includes(search) ||
        (o.customerAddress && o.customerAddress.toLowerCase().includes(search.toLowerCase()));
      return matchText;
    });
  }, [orders, search]);

  // Filtered shipments list
  const filteredShipments = useMemo(() => {
    return shipments.filter((s) => {
      const matchText =
        s.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        s.consignmentId.toLowerCase().includes(search.toLowerCase()) ||
        s.customerName.toLowerCase().includes(search.toLowerCase()) ||
        s.customerPhone.includes(search);
      return matchText;
    });
  }, [shipments, search]);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-80">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-neutral-900 leading-tight">Pathao Courier</h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Connected: {courierConfig.pathao.storeName || 'Budget Choice BD'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-500">
              Account: {courierConfig.pathao.username || 'budgetchoicebd@gmail.com'}
            </p>
          </div>
        </div>

        {/* Tab Controls & Direct Portal Link */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Orders to Ship ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('tracking')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'tracking'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Track Parcels ({shipments.length})
            </button>
          </div>

          <a
            href="https://merchant.pathao.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
            title="Open Pathao Merchant Portal"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Pathao Dashboard</span>
          </a>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search order, customer, phone or address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-rose-500 shadow-2xs"
        />
      </div>

      {/* ================= TAB 1: ORDERS TO SHIP ================= */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-400">
              No orders found. Add an order from "New Order" to send to Pathao.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-neutral-500 font-bold uppercase text-[10px] border-b border-neutral-100 bg-neutral-50/70">
                    <th className="py-2.5 px-3">Order #</th>
                    <th className="py-2.5 px-3">Customer Name</th>
                    <th className="py-2.5 px-3">Phone</th>
                    <th className="py-2.5 px-3">Address</th>
                    <th className="py-2.5 px-3 text-right">Total Amount (COD)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Send to Pathao</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredOrders.map((ord) => {
                    const activeShipment = shipments.find(
                      (s) => s.orderId === ord.id || (ord.orderNumber && s.orderNumber === ord.orderNumber)
                    );
                    const isAlreadySent = Boolean(ord.courierConsignmentId || activeShipment?.consignmentId);
                    const consignmentId = ord.courierConsignmentId || activeShipment?.consignmentId;
                    const isLoading = loadingOrderId === ord.id;

                    return (
                      <tr key={ord.id} className="hover:bg-neutral-50 transition-colors">
                        {/* Order # */}
                        <td className="py-3 px-3 whitespace-nowrap font-mono font-bold text-neutral-900">
                          {ord.orderNumber}
                        </td>

                        {/* Customer Name */}
                        <td className="py-3 px-3 font-semibold text-neutral-900 whitespace-nowrap">
                          {ord.customerName}
                        </td>

                        {/* Phone */}
                        <td className="py-3 px-3 font-mono text-neutral-600 whitespace-nowrap">
                          {ord.customerPhone}
                        </td>

                        {/* Address */}
                        <td className="py-3 px-3 max-w-xs text-neutral-700 leading-snug">
                          <div className="truncate font-medium">{ord.customerAddress || 'No address specified'}</div>
                        </td>

                        {/* Total Price (COD) */}
                        <td className="py-3 px-3 text-right whitespace-nowrap font-mono font-bold text-neutral-900 text-sm">
                          {formatCurrency(ord.sellingPrice)}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {isAlreadySent ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              PATHAO • {consignmentId}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 text-neutral-600">
                              Not Sent
                            </span>
                          )}
                        </td>

                        {/* Action: Send to Pathao Button */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          {isAlreadySent ? (
                            <a
                              href="https://merchant.pathao.com"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                            >
                              <span>Sent</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setPendingOrder(ord)}
                              disabled={isLoading}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                            >
                              {isLoading ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Send className="w-3 h-3" />
                              )}
                              <span>Send to Pathao</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: TRACK PARCELS ================= */}
      {activeTab === 'tracking' && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
          {filteredShipments.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-400">
              No shipments dispatched yet. Click "Send to Pathao" from the orders tab.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-neutral-500 font-bold uppercase text-[10px] border-b border-neutral-100 bg-neutral-50/70">
                    <th className="py-2.5 px-3">Consignment ID</th>
                    <th className="py-2.5 px-3">Order #</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">COD Amount</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Pathao Dashboard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredShipments.map((s) => {
                    const st = STATUS_CONFIG[s.status] || STATUS_CONFIG.pending;
                    return (
                      <tr key={s.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-neutral-900 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span>{s.consignmentId}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyTracking(s.consignmentId)}
                              className="text-neutral-400 hover:text-neutral-700"
                              title="Copy Consignment ID"
                            >
                              {copiedTracking === s.consignmentId ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono font-medium text-neutral-700 whitespace-nowrap">
                          #{s.orderNumber}
                        </td>
                        <td className="py-3 px-3 font-semibold text-neutral-900">
                          <div>{s.customerName}</div>
                          <div className="text-[10px] text-neutral-500 font-mono">{s.customerPhone}</div>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-neutral-900 whitespace-nowrap">
                          {formatCurrency(s.codAmount)}
                        </td>
                        <td className="py-3 px-3 text-neutral-500 whitespace-nowrap">
                          {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'Today'}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${st.bg} ${st.text} ${st.border}`}
                          >
                            {st.label}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <a
                            href="https://merchant.pathao.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <span>View Portal</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= CONFIRMATION POPUP (Exact specification from user) ================= */}
      {pendingOrder && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white">
                  <Send className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-sm text-neutral-900">
                  পাঠাও কুরিয়ারে পাঠান
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPendingOrder(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Verification Fields: Name, Phone, Address, Account, COD Amount */}
            <div className="space-y-2 text-xs bg-neutral-50 rounded-xl border border-neutral-200 p-3.5">
              <div className="flex justify-between items-center py-1 border-b border-neutral-200/60">
                <span className="text-neutral-500 font-medium">নাম:</span>
                <span className="font-bold text-neutral-900">{pendingOrder.customerName}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-neutral-200/60">
                <span className="text-neutral-500 font-medium">ফোন নম্বর:</span>
                <span className="font-mono font-bold text-neutral-900">{pendingOrder.customerPhone}</span>
              </div>

              <div className="py-1 border-b border-neutral-200/60">
                <span className="text-neutral-500 font-medium block mb-0.5">ঠিকানা:</span>
                <span className="font-semibold text-neutral-900 block leading-snug">
                  {pendingOrder.customerAddress || 'কোনো ঠিকানা দেওয়া হয়নি'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-neutral-200/60">
                <span className="text-neutral-500 font-medium">অ্যাকাউন্ট:</span>
                <span className="font-semibold text-neutral-800">
                  {courierConfig.pathao.storeName || 'Budget Choice BD'} ({courierConfig.pathao.username || 'budgetchoicebd@gmail.com'})
                </span>
              </div>

              <div className="flex justify-between items-center pt-1.5">
                <span className="text-neutral-700 font-bold">টোটাল অ্যামাউন্ট:</span>
                <span className="text-base font-black font-mono text-rose-600">
                  {formatCurrency(pendingOrder.sellingPrice)}
                </span>
              </div>
            </div>

            {/* Confirmation Question */}
            <div className="text-center py-0.5">
              <p className="font-bold text-xs text-neutral-800">
                তুমি কি পাঠাতে চাও?
              </p>
            </div>

            {/* Actions: Cancel & Send */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPendingOrder(null)}
                disabled={isBooking}
                className="px-3.5 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl cursor-pointer transition-colors"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={isBooking}
                onClick={() => handleConfirmSend(pendingOrder)}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
              >
                {isBooking ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>পাঠানো হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>পাঠান (Send to Pathao)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
