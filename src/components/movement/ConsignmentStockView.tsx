import React, { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Briefcase,
  Download,
  Loader2,
  Paperclip,
  Package,
  RefreshCcw,
  Search,
  Upload,
  Users,
  ChevronDown,
} from 'lucide-react';
import { InventoryItem, ConsignmentEntry, DocumentAttachment } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createConsignmentEntry, fetchStockMovementData } from '@/store/slices/stockMovementSlice';
import { fetchCustomers } from '@/store/slices/customerSlice';
import { ConsignmentCustomerOption, movementService } from '@/services/movementService';
import { documentService } from '@/services/documentService';

const ConsignmentStockView: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { consignments, items, actionLoading, error, loading } = useAppSelector((state) => state.stockMovement);
  const reduxCustomers = useAppSelector((state) => state.customers?.customers || []);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Outward' | 'Inward'>('All');
  const [customers, setCustomers] = useState<ConsignmentCustomerOption[]>([]);
  const [attachments, setAttachments] = useState<DocumentAttachment[]>([]);
  const [supportLoading, setSupportLoading] = useState(true);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Outward' as 'Outward' | 'Inward',
    partyId: '',
    partyName: '',
    itemId: '',
    quantity: 1,
    notes: '',
  });

  useEffect(() => {
    dispatch(fetchStockMovementData());
    dispatch(fetchCustomers());
  }, [dispatch]);

  useEffect(() => {
    const loadCustomers = async () => {
      setSupportLoading(true);
      // Convert Redux customers to ConsignmentCustomerOption format
      const reduxOptions: ConsignmentCustomerOption[] = reduxCustomers.map((customer: any) => ({
        id: customer.id,
        name: customer.name || customer.code || 'Unknown',
      }));
      
      const linkedDocuments = await documentService.getAttachments({ referenceType: 'CustomerStock', limit: 200 });
      
      setCustomers(reduxOptions);
      setAttachments(linkedDocuments);
      setSupportLoading(false);
    };

    loadCustomers();
  }, [reduxCustomers]);

  const typedItems = items as InventoryItem[];
  const typedConsignments = consignments as ConsignmentEntry[];
  const attachmentsByConsignment = useMemo(() => {
    return attachments.reduce<Record<string, DocumentAttachment[]>>((acc, attachment) => {
      if (!attachment.referenceId) return acc;
      acc[attachment.referenceId] = [...(acc[attachment.referenceId] || []), attachment];
      return acc;
    }, {});
  }, [attachments]);

  const filteredConsignments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return typedConsignments.filter((entry) => {
      const matchesFilter = typeFilter === 'All' || entry.type === typeFilter;
      const matchesSearch =
        !term ||
        entry.partyName.toLowerCase().includes(term) ||
        entry.itemName.toLowerCase().includes(term) ||
        entry.reference.toLowerCase().includes(term);

      return matchesFilter && matchesSearch;
    });
  }, [searchTerm, typeFilter, typedConsignments]);

  const summary = useMemo(() => {
    const activeEntries = typedConsignments.filter((entry) => entry.status === 'Active').length;
    const outwardQty = typedConsignments
      .filter((entry) => entry.type === 'Outward')
      .reduce((total, entry) => total + entry.quantity, 0);
    const inwardQty = typedConsignments
      .filter((entry) => entry.type === 'Inward')
      .reduce((total, entry) => total + entry.quantity, 0);
    const liveCustomerStock = typedItems.reduce((total, item) => total + Number(item.consignmentStock || 0), 0);

    return {
      activeEntries,
      outwardQty,
      inwardQty,
      liveCustomerStock,
    };
  }, [typedConsignments, typedItems]);

  const topItems = useMemo(
    () =>
      [...typedItems]
        .filter((item) => Number(item.consignmentStock || 0) > 0)
        .sort((a, b) => Number(b.consignmentStock || 0) - Number(a.consignmentStock || 0))
        .slice(0, 4),
    [typedItems]
  );

  const handleCustomerSelect = (customerId: string) => {
    const selectedCustomer = customers.find((customer) => customer.id === customerId);
    setFormData((current) => ({
      ...current,
      partyId: customerId,
      partyName: selectedCustomer?.name || '',
    }));
  };

  const handleSubmit = async () => {
    if (!formData.partyId || !formData.partyName.trim() || !formData.itemId) {
      alert('Please select a customer and item.');
      return;
    }

    if (formData.quantity <= 0) {
      alert('Quantity must be greater than zero.');
      return;
    }

    const item = typedItems.find((record) => record.id === formData.itemId);

    try {
      await dispatch(
        createConsignmentEntry({
          ...formData,
          partyName: formData.partyName.trim(),
          itemName: item?.name || 'Unknown',
        })
      ).unwrap();

      setFormData({
        type: 'Outward',
        partyId: '',
        partyName: '',
        itemId: '',
        quantity: 1,
        notes: '',
      });

      const refreshedCustomers = await movementService.getConsignmentCustomers();
        // Convert to Redux format and update local state
        const updatedOptions: ConsignmentCustomerOption[] = refreshedCustomers.map((customer: any) => ({
          id: customer.id,
          name: customer.name || customer.code || 'Unknown',
        }));
        setCustomers(updatedOptions);
    } catch (submitError) {
      console.error('Consignment creation failed', submitError);
    }
  };

  const refreshCustomerStockDocuments = async () => {
    const linkedDocuments = await documentService.getAttachments({
      referenceType: 'CustomerStock',
      limit: 200,
    });
    setAttachments(linkedDocuments);
    // Also refresh customers from Redux
    dispatch(fetchCustomers());
  };

  const handleDocumentUpload = async (entry: ConsignmentEntry, file?: File | null) => {
    if (!file) return;

    setDocumentLoading(true);
    try {
      await documentService.uploadAttachment(file, {
        name: file.name,
        category: 'Document',
        tag: entry.type === 'Outward' ? 'Contract' : 'Report',
        uploadedBy: 'Admin User',
        referenceType: 'CustomerStock',
        referenceId: entry.id,
        referenceLabel: `${entry.reference} / ${entry.partyName}`,
        notes: `Linked to customer stock ${entry.reference}`,
      });
      await refreshCustomerStockDocuments();
    } catch (uploadError: any) {
      alert(uploadError?.response?.data?.message || uploadError?.message || 'Document upload failed.');
    } finally {
      setDocumentLoading(false);
    }
  };

  const pageLoading = loading || supportLoading;

  // Searchable Customer Dropdown Component
  const SearchableCustomerDropdown = () => {
    const [focused, setFocused] = useState(false);
    const [search, setSearch] = useState('');
    const filteredCustomers = customers.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
      <div className="relative">
        <div className={`relative flex items-center rounded-lg border transition-all duration-200 ${
          focused 
            ? 'border-blue-500 bg-blue-50 shadow-md focus:ring-2 focus:ring-blue-100' 
            : 'border-slate-300 bg-white hover:border-slate-400'
        }`}>
          <Users size={18} className={`ml-3 flex-shrink-0 ${focused ? 'text-blue-500' : 'text-slate-400'}`} />
          <input
            type="text"
            value={focused ? search : (formData.partyName || '')}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => { setFocused(false); setSearch(''); }}
            placeholder="Search customers..."
            className="w-full bg-transparent px-3 py-3 text-sm text-slate-700 outline-none placeholder-slate-400"
          />
          <ChevronDown size={16} className="mr-3 text-slate-400 flex-shrink-0" />
        </div>
        {focused && (
          <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-white border-2 border-blue-500 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map(customer => (
                <div
                  key={customer.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleCustomerSelect(customer.id);
                    setSearch('');
                    setFocused(false);
                  }}
                  className={`px-4 py-3 text-sm cursor-pointer transition-colors ${
                    formData.partyId === customer.id
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'text-slate-700 hover:bg-blue-50'
                  }`}
                >
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-xs text-slate-500">{customer.id}</p>
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-slate-400">No customers found</div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Searchable Item Dropdown Component
  const SearchableItemDropdown = () => {
    const [focused, setFocused] = useState(false);
    const [search, setSearch] = useState('');
    
    const selectedItem = typedItems.find(item => item.id === formData.itemId);
    
    const filteredItems = typedItems.filter(item => 
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase())
    );

    return (
      <div className="relative">
        <div className={`relative flex items-center rounded-lg border transition-all duration-200 ${
          focused 
            ? 'border-blue-500 bg-blue-50 shadow-md focus:ring-2 focus:ring-blue-100' 
            : 'border-slate-300 bg-white hover:border-slate-400'
        }`}>
          <Package size={18} className={`ml-3 flex-shrink-0 ${focused ? 'text-blue-500' : 'text-slate-400'}`} />
          <input
            type="text"
            value={focused ? search : (selectedItem ? `${selectedItem.sku} - ${selectedItem.name}` : '')}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => { setFocused(false); setSearch(''); }}
            placeholder="Search items..."
            className="w-full bg-transparent px-3 py-3 text-sm text-slate-700 outline-none placeholder-slate-400"
          />
          <ChevronDown size={16} className="mr-3 text-slate-400 flex-shrink-0" />
        </div>
        {focused && (
          <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-white border-2 border-blue-500 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {filteredItems.length > 0 ? (
              filteredItems.map(item => (
                <div
                  key={item.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setFormData((current) => ({
                      ...current,
                      itemId: item.id,
                    }));
                    setSearch('');
                    setFocused(false);
                  }}
                  className={`px-4 py-3 text-sm cursor-pointer transition-colors ${
                    formData.itemId === item.id
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'text-slate-700 hover:bg-blue-50'
                  }`}
                >
                  <p className="font-medium">{item.sku} - {item.name}</p>
                  <p className="text-xs text-slate-500">Stock: {item.stock}</p>
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-slate-400">No items found</div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Customer Stock</h1>
          <p className="mt-2 text-base text-slate-600">
            Track consignment stock sent to customers and record stock returns against live backend data.
          </p>
        </div>

        <button
          type="button"
          onClick={() => dispatch(fetchStockMovementData())}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCcw size={18} className={loading ? 'animate-spin-slow' : ''} />
          Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="group overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-md transition-all hover:shadow-lg hover:border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Active Entries</p>
              <p className="mt-3 text-3xl font-bold text-blue-900">{summary.activeEntries}</p>
            </div>
            <div className="rounded-xl bg-white p-3 text-blue-600 shadow-md group-hover:shadow-lg transition-shadow">
              <Briefcase size={24} />
            </div>
          </div>
        </div>

        <div className="group overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 shadow-md transition-all hover:shadow-lg hover:border-indigo-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Stock With Customers</p>
              <p className="mt-3 text-3xl font-bold text-indigo-900">{summary.liveCustomerStock}</p>
            </div>
            <div className="rounded-xl bg-white p-3 text-indigo-600 shadow-md group-hover:shadow-lg transition-shadow">
              <Package size={24} />
            </div>
          </div>
        </div>

        <div className="group overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-orange-100 p-6 shadow-md transition-all hover:shadow-lg hover:border-orange-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-orange-600">Outward Quantity</p>
              <p className="mt-3 text-3xl font-bold text-orange-900">{summary.outwardQty}</p>
            </div>
            <div className="rounded-xl bg-white p-3 text-orange-600 shadow-md group-hover:shadow-lg transition-shadow">
              <ArrowUpRight size={24} />
            </div>
          </div>
        </div>

        <div className="group overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 shadow-md transition-all hover:shadow-lg hover:border-emerald-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Returned Quantity</p>
              <p className="mt-3 text-3xl font-bold text-emerald-900">{summary.inwardQty}</p>
            </div>
            <div className="rounded-xl bg-white p-3 text-emerald-600 shadow-md group-hover:shadow-lg transition-shadow">
              <ArrowDownLeft size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="space-y-8 xl:col-span-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 text-white">
                <Briefcase size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Record Movement</h2>
                <p className="text-xs text-slate-500">Create outward consignments and customer returns</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Movement Type</label>
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1.5">
                  {(['Outward', 'Inward'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData((current) => ({ ...current, type }))}
                      className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                        formData.type === type
                          ? 'bg-white text-blue-600 shadow-md'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {type === 'Outward' ? '📤 Send' : '📥 Receive'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Customer</label>
                <SearchableCustomerDropdown />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Item</label>
                <SearchableItemDropdown />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Quantity</label>
                <input
                  type="number"
                  min={1}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={formData.quantity}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      quantity: Number(event.target.value),
                    }))
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Notes</label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={formData.notes}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="Optional delivery or return note"
                />
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={actionLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading ? <Loader2 size={18} className="animate-spin-slow" /> : <Briefcase size={18} />}
                Save Movement
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 p-2.5 text-white">
                <Package size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Top Items</h3>
            </div>

            <div className="space-y-3">
              {topItems.length === 0 ? (
                <p className="text-center text-sm text-slate-500">No active customer stock available yet.</p>
              ) : (
                topItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="group flex items-center justify-between rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white px-4 py-3.5 transition-all hover:border-blue-300 hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-bold text-slate-400">{index + 1}</span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.sku}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-700">
                      {item.consignmentStock} units
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700 shadow-md">
              ⚠️ {error}
            </div>
          )}
        </div>

        <div className="xl:col-span-8">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Stock Ledger</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    All outward consignments and inward returns synced from the backend
                  </p>
                </div>

                <div className="flex flex-col gap-3 md:flex-row">
                  <div className="relative">
                    <Search
                      size={18}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search customer, item..."
                      className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 md:w-80"
                    />
                  </div>

                  <select
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value as 'All' | 'Outward' | 'Inward')}
                  >
                    <option value="All">📊 All Movements</option>
                    <option value="Outward">📤 Outward Only</option>
                    <option value="Inward">📥 Inward Only</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-700">Reference</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Date</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Customer</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Item</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Type</th>
                    <th className="px-6 py-4 text-right font-semibold text-slate-700">Quantity</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Documents</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pageLoading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-16 text-center">
                        <Loader2 size={24} className="mx-auto mb-2 animate-spin-slow text-blue-600" />
                        <p className="text-slate-500 font-medium">Loading customer stock...</p>
                      </td>
                    </tr>
                  ) : filteredConsignments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-16 text-center">
                        <Package size={32} className="mx-auto mb-3 text-slate-300" />
                        <p className="text-slate-500 font-medium">No customer stock records found.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredConsignments.map((entry, index) => (
                      <tr key={entry.id} className={`transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50`}>
                        <td className="px-6 py-4">
                          <span className="inline-block rounded-lg bg-blue-100 px-3 py-1 font-semibold text-blue-700">
                            {entry.reference}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{entry.date}</td>
                        <td className="px-6 py-4 font-semibold text-slate-900">{entry.partyName}</td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-slate-900">{entry.itemName}</p>
                            <p className="text-xs text-slate-500">{entry.itemId}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                              entry.type === 'Outward'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {entry.type === 'Outward' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                            {entry.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">{entry.quantity}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
                              entry.status === 'Active'
                                ? 'bg-blue-100 text-blue-700'
                                : entry.status === 'Returned'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {entry.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            {(attachmentsByConsignment[entry.id] || []).slice(0, 2).map((attachment) => (
                              <a
                                key={attachment.id}
                                href={attachment.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                              >
                                <Download size={12} />
                                v{attachment.version}
                              </a>
                            ))}
                            {(attachmentsByConsignment[entry.id] || []).length === 0 && (
                              <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                                <Paperclip size={12} /> None
                              </span>
                            )}
                            {(attachmentsByConsignment[entry.id] || []).length > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `/documents/doc-ver?referenceType=CustomerStock&referenceId=${entry.id}`,
                                  )
                                }
                                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                              >
                                View all
                              </button>
                            )}
                            <label className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100">
                              {documentLoading ? <Loader2 size={12} className="animate-spin-slow" /> : <Upload size={12} />}
                              Upload
                              <input
                                type="file"
                                className="hidden"
                                onChange={(event) => handleDocumentUpload(entry, event.target.files?.[0])}
                              />
                            </label>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsignmentStockView;
