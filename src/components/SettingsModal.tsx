import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Upload,
  RotateCcw,
  Save,
  Store,
  Truck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Eye,
  EyeOff,
  Webhook,
  Sparkles,
} from 'lucide-react';
import { AppSettings, ProductItem, Order, ExpenseItem, CourierApiConfig, CourierProvider } from '../types';
import { exportAllData } from '../utils/storage';
import { courierService } from '../services/courierService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'general' | 'courier';
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  courierConfig: CourierApiConfig;
  onSaveCourierConfig: (config: CourierApiConfig) => void;
  onResetData: () => void;
  onImportData: (data: {
    products: ProductItem[];
    orders: Order[];
    expenses?: ExpenseItem[];
    settings: AppSettings;
  }) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'general',
  settings,
  onSaveSettings,
  courierConfig,
  onSaveCourierConfig,
  onResetData,
  onImportData,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'courier'>(initialTab);

  // Shop Settings State
  const [shopName, setShopName] = useState(settings.shopName);
  const [shopPhone, setShopPhone] = useState(settings.shopPhone);
  const [shopAddress, setShopAddress] = useState(settings.shopAddress);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol);
  const [defaultDeliveryCharge, setDefaultDeliveryCharge] = useState(settings.defaultDeliveryCharge);
  const [defaultPackagingCharge, setDefaultPackagingCharge] = useState(settings.defaultPackagingCharge);
  const [successMsg, setSuccessMsg] = useState('');

  // Courier API Settings State
  const [courierDraft, setCourierDraft] = useState<CourierApiConfig>(courierConfig);
  const [apiTestResult, setApiTestResult] = useState<{ courier: string; success: boolean; message: string } | null>(null);
  const [isTestingApi, setIsTestingApi] = useState(false);

  // Copy State & Visibility
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showClientSecret, setShowClientSecret] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setShopName(settings.shopName);
      setShopPhone(settings.shopPhone);
      setShopAddress(settings.shopAddress);
      setCurrencySymbol(settings.currencySymbol);
      setDefaultDeliveryCharge(settings.defaultDeliveryCharge);
      setDefaultPackagingCharge(settings.defaultPackagingCharge);
      setCourierDraft(courierConfig);
      setApiTestResult(null);
      setSuccessMsg('');
      setCopiedField(null);
    }
  }, [isOpen, initialTab, settings, courierConfig]);

  if (!isOpen) return null;

  const handleCopy = (text: string, fieldKey: string) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldKey);
      setTimeout(() => {
        setCopiedField((curr) => (curr === fieldKey ? null : curr));
      }, 2000);
    } catch (e) {
      console.error('Clipboard copy failed:', e);
    }
  };

  const handleCopyAllPathao = () => {
    const p = courierDraft.pathao;
    const lines = [
      `=== Pathao Courier API Credentials ===`,
      `Store Name: ${p.storeName || 'Budget Choice BD'}`,
      `Store ID: ${p.storeId || ''}`,
      `Merchant Email / Username: ${p.username || 'budgetchoicebd@gmail.com'}`,
      `Client ID: ${p.clientId || ''}`,
      `Client Secret: ${p.clientSecret || ''}`,
      `Webhook Callback URL: ${window.location.origin}/api/courier/webhook/pathao`,
    ].join('\n');

    handleCopy(lines, 'all_pathao');
  };

  const handleSaveShopSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      shopName: shopName.trim() || 'My Gift Shop',
      shopPhone: shopPhone.trim(),
      shopAddress: shopAddress.trim(),
      currencySymbol: currencySymbol.trim() || '৳',
      defaultDeliveryCharge: Number(defaultDeliveryCharge) || 0,
      defaultPackagingCharge: Number(defaultPackagingCharge) || 0,
    });
    setSuccessMsg('Shop settings saved successfully!');
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 1000);
  };

  const handleSaveCourierSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCourierConfig(courierDraft);
    setSuccessMsg('Courier API settings saved successfully!');
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 1000);
  };

  const handleTestCourierApi = async (provider: CourierProvider) => {
    setIsTestingApi(true);
    setApiTestResult(null);
    try {
      const res = await courierService.testApiConnection(provider, courierDraft);
      setApiTestResult({
        courier: provider,
        success: res.success,
        message: res.message,
      });
    } catch (err: any) {
      setApiTestResult({
        courier: provider,
        success: false,
        message: err.message || 'API connection test failed',
      });
    } finally {
      setIsTestingApi(false);
    }
  };

  const handleExport = () => {
    const jsonStr = exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.products && parsed.orders) {
          onImportData(parsed);
          setSuccessMsg('Data imported successfully!');
          setTimeout(() => {
            setSuccessMsg('');
            onClose();
          }, 1200);
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Could not read the file.');
      }
    };
    reader.readAsText(file);
  };

  const webhookCallbackUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://budgetchoicebd.com'}/api/courier/webhook/pathao`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header & Sub-Tabs */}
        <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeTab === 'general' ? (
              <Store className="w-5 h-5 text-emerald-600" />
            ) : (
              <Truck className="w-5 h-5 text-rose-600" />
            )}
            <h3 className="font-bold text-neutral-900 text-sm">
              {activeTab === 'general' ? 'Shop Settings & Backup' : 'Courier API Settings'}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            {/* Sub-menu tab pills */}
            <div className="flex items-center bg-neutral-200/60 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  activeTab === 'general'
                    ? 'bg-white text-neutral-900 shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                General
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('courier')}
                className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === 'courier'
                    ? 'bg-white text-neutral-900 shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Truck className="w-3 h-3 text-rose-500" />
                <span>Courier Setting</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success toast inside modal */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* ================= 1. GENERAL / SHOP SETTINGS ================= */}
          {activeTab === 'general' && (
            <form onSubmit={handleSaveShopSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Shop / Brand Name
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full px-3 py-2 pr-20 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(shopName, 'shopName')}
                    className="absolute right-1 px-2.5 py-1 text-[11px] font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded flex items-center gap-1 transition-all cursor-pointer"
                  >
                    {copiedField === 'shopName' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700 text-[10px]">কপি হয়েছে</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-neutral-500" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={shopPhone}
                      onChange={(e) => setShopPhone(e.target.value)}
                      className="w-full px-3 py-2 pr-20 text-xs font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(shopPhone, 'shopPhone')}
                      className="absolute right-1 px-2.5 py-1 text-[11px] font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded flex items-center gap-1 transition-all cursor-pointer"
                    >
                      {copiedField === 'shopPhone' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700 text-[10px]">কপি হয়েছে</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-neutral-500" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    value={currencySymbol}
                    onChange={(e) => setCurrencySymbol(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Shop Address (Shown on Invoice)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={shopAddress}
                    onChange={(e) => setShopAddress(e.target.value)}
                    className="w-full px-3 py-2 pr-20 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(shopAddress, 'shopAddress')}
                    className="absolute right-1 px-2.5 py-1 text-[11px] font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded flex items-center gap-1 transition-all cursor-pointer"
                  >
                    {copiedField === 'shopAddress' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700 text-[10px]">কপি হয়েছে</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-neutral-500" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Default Delivery Fee (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={defaultDeliveryCharge}
                    onChange={(e) => setDefaultDeliveryCharge(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Default Packaging Fee (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={defaultPackagingCharge}
                    onChange={(e) => setDefaultPackagingCharge(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Backup & Export */}
              <div className="border-t border-neutral-100 pt-4 space-y-2">
                <label className="block text-xs font-bold text-neutral-800">
                  Backup & Restore
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExport}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export JSON</span>
                  </button>

                  <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset all data to default demo data?')) {
                      onResetData();
                      onClose();
                    }
                  }}
                  className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Data</span>
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Settings</span>
                </button>
              </div>
            </form>
          )}

          {/* ================= 2. COURIER SETTING SUB-MENU (PATHAO API & COPY) ================= */}
          {activeTab === 'courier' && (
            <form onSubmit={handleSaveCourierSettings} className="space-y-4">
              <div className="flex items-start justify-between gap-2 text-xs text-neutral-700 bg-rose-50 border border-rose-200 p-3 rounded-xl">
                <div>
                  <span className="font-bold text-rose-900 block mb-0.5">পাঠাও (Pathao) মার্চেন্ট API সেটিংস</span>
                  এখানে আপনার পাঠাও মার্চেন্ট একাউন্টের তথ্য সেট ও কপি করুন। প্রতিটি ফিল্ডের পাশে কপি করার বাটন রয়েছে।
                </div>
                <button
                  type="button"
                  onClick={handleCopyAllPathao}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer transition-colors"
                  title="সব তথ্য এক ক্লিকে কপি করুন"
                >
                  {copiedField === 'all_pathao' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>সব কপি হয়েছে!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>সব তথ্য কপি করুন</span>
                    </>
                  )}
                </button>
              </div>

              {apiTestResult && (
                <div
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                    apiTestResult.success
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {apiTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{apiTestResult.message}</span>
                  </div>
                  <button type="button" onClick={() => setApiTestResult(null)} className="opacity-60 hover:opacity-100">
                    ✕
                  </button>
                </div>
              )}

              {/* Pathao API Block with Copy Option on each item */}
              <div className="border border-neutral-200 rounded-xl p-4 space-y-3.5 bg-neutral-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="font-bold text-xs text-neutral-900">Pathao Courier API Credentials</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTestCourierApi('pathao')}
                      disabled={isTestingApi}
                      className="px-2.5 py-1 bg-white border border-neutral-300 hover:border-neutral-400 text-neutral-700 text-[11px] font-semibold rounded-lg shadow-2xs cursor-pointer transition-colors"
                    >
                      {isTestingApi ? 'Testing...' : 'Test Pathao'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Client ID */}
                  <div>
                    <label className="block text-neutral-700 font-semibold mb-1">
                      Client ID
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={courierDraft.pathao.clientId}
                        onChange={(e) =>
                          setCourierDraft({
                            ...courierDraft,
                            pathao: { ...courierDraft.pathao, clientId: e.target.value },
                          })
                        }
                        className="w-full px-3 py-1.5 pr-20 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium font-mono"
                        placeholder="e.g. pmbk5kJezJ"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(courierDraft.pathao.clientId, 'clientId')}
                        className="absolute right-1 px-2 py-1 text-[11px] font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded flex items-center gap-1 transition-all cursor-pointer"
                        title="Client ID কপি করুন"
                      >
                        {copiedField === 'clientId' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 text-[10px]">কপি হয়েছে</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-neutral-500" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Client Secret */}
                  <div>
                    <label className="block text-neutral-700 font-semibold mb-1">
                      Client Secret
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type={showClientSecret ? 'text' : 'password'}
                        value={courierDraft.pathao.clientSecret}
                        onChange={(e) =>
                          setCourierDraft({
                            ...courierDraft,
                            pathao: { ...courierDraft.pathao, clientSecret: e.target.value },
                          })
                        }
                        className="w-full px-3 py-1.5 pr-26 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium font-mono"
                        placeholder="••••••••••••••••"
                      />
                      <div className="absolute right-1 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowClientSecret(!showClientSecret)}
                          title={showClientSecret ? 'Hide Secret' : 'Show Secret'}
                          className="p-1 text-neutral-400 hover:text-neutral-700 rounded hover:bg-neutral-100 cursor-pointer"
                        >
                          {showClientSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(courierDraft.pathao.clientSecret, 'clientSecret')}
                          className="px-2 py-1 text-[11px] font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded flex items-center gap-1 transition-all cursor-pointer"
                          title="Client Secret কপি করুন"
                        >
                          {copiedField === 'clientSecret' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700 text-[10px]">কপি হয়েছে</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-neutral-500" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Store Name */}
                  <div>
                    <label className="block text-neutral-700 font-semibold mb-1">
                      Store Name
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={courierDraft.pathao.storeName || ''}
                        onChange={(e) =>
                          setCourierDraft({
                            ...courierDraft,
                            pathao: { ...courierDraft.pathao, storeName: e.target.value },
                          })
                        }
                        className="w-full px-3 py-1.5 pr-20 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
                        placeholder="Budget Choice BD"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(courierDraft.pathao.storeName || '', 'storeName')}
                        className="absolute right-1 px-2 py-1 text-[11px] font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded flex items-center gap-1 transition-all cursor-pointer"
                        title="Store Name কপি করুন"
                      >
                        {copiedField === 'storeName' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 text-[10px]">কপি হয়েছে</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-neutral-500" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Store ID */}
                  <div>
                    <label className="block text-neutral-700 font-semibold mb-1">
                      Store ID
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={courierDraft.pathao.storeId}
                        onChange={(e) =>
                          setCourierDraft({
                            ...courierDraft,
                            pathao: { ...courierDraft.pathao, storeId: e.target.value },
                          })
                        }
                        className="w-full px-3 py-1.5 pr-20 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium font-mono"
                        placeholder="e.g. 7N1aMJQbWm"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(courierDraft.pathao.storeId, 'storeId')}
                        className="absolute right-1 px-2 py-1 text-[11px] font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded flex items-center gap-1 transition-all cursor-pointer"
                        title="Store ID কপি করুন"
                      >
                        {copiedField === 'storeId' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 text-[10px]">কপি হয়েছে</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-neutral-500" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Merchant Email / Username */}
                  <div className="sm:col-span-2">
                    <label className="block text-neutral-700 font-semibold mb-1">
                      Merchant Email / Username
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="email"
                        value={courierDraft.pathao.username}
                        onChange={(e) =>
                          setCourierDraft({
                            ...courierDraft,
                            pathao: { ...courierDraft.pathao, username: e.target.value },
                          })
                        }
                        className="w-full px-3 py-1.5 pr-20 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium font-mono"
                        placeholder="budgetchoicebd@gmail.com"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(courierDraft.pathao.username, 'username')}
                        className="absolute right-1 px-2 py-1 text-[11px] font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded flex items-center gap-1 transition-all cursor-pointer"
                        title="Email কপি করুন"
                      >
                        {copiedField === 'username' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 text-[10px]">কপি হয়েছে</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-neutral-500" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Webhook & Callback URL Section (Especially useful for Pathao Webhook Integration) */}
              <div className="border border-indigo-200 bg-indigo-50/60 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Webhook className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-xs text-indigo-950">
                      Pathao Webhook Integration (ওয়েবহুক কলব্যাক)
                    </span>
                  </div>
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-200">
                    Webhook URL
                  </span>
                </div>
                <p className="text-[11px] text-neutral-600 leading-relaxed">
                  পাঠাও মার্চেন্ট পোর্টালে Webhook Integration এ ব্যবহার করতে নিচের Callback URL টি কপি করুন:
                </p>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    Callback URL
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      readOnly
                      value={webhookCallbackUrl}
                      className="w-full px-3 py-1.5 pr-20 bg-white border border-neutral-300 rounded-lg text-xs font-mono text-neutral-700 select-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(webhookCallbackUrl, 'webhook_url')}
                      className="absolute right-1 px-2 py-1 text-[11px] font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded flex items-center gap-1 transition-all cursor-pointer"
                      title="Callback URL কপি করুন"
                    >
                      {copiedField === 'webhook_url' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700 text-[10px]">কপি হয়েছে</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-neutral-500" />
                          <span>Copy URL</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 flex items-center justify-between border-t border-neutral-100">
                <button
                  type="button"
                  onClick={handleCopyAllPathao}
                  className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{copiedField === 'all_pathao' ? 'সব তথ্য ক্লিপবোর্ডে কপি হয়েছে!' : 'সব সেটিংস একবারে কপি'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Courier API Keys</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
