import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Briefcase,
  Loader2,
  Package,
  RefreshCcw,
  Search,
  UserCheck,
} from 'lucide-react';
import { InventoryItem, ConsignmentEntry } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createConsignmentEntry, fetchStockMovementData } from '@/store/slices/stockMovementSlice';
import { ConsignmentCustomerOption, movementService } from '@/services/movementService';

const ConsignmentStockView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { consignments, items, actionLoading, error, loading } = useAppSelector((state) => state.stockMovement);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Outward' | 'Inward'>('All');
  const [customers, setCustomers] = useState<ConsignmentCustomerOption[]>([]);
  const [supportLoading, setSupportLoading] = useState(true);
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
  }, [dispatch]);

  useEffect(() => {
    const loadCustomers = async () => {
      setSupportLoading(true);
      const options = await movementService.getConsignmentCustomers();
      setCustomers(options);
      setSupportLoading(false);
    };

    loadCustomers();
  }, []);

  const typedItems = items as InventoryItem[];
  const typedConsignments = consignments as ConsignmentEntry[];

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
      partyName: selectedCustomer?.name || current.partyName,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.partyName.trim() || !formData.itemId) {
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
      setCustomers(refreshedCustomers);
    } catch (submitError) {
      console.error('Consignment creation failed', submitError);
    }
  };

  const pageLoading = loading || supportLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customer Stock</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track consignment stock sent to customers and record stock returns against live backend data.
          </p>
        </div>

        <button
          type="button"
          onClick={() => dispatch(fetchStockMovementData())}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Active Entries</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{summary.activeEntries}</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
              <Briefcase size={20} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Stock With Customers</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{summary.liveCustomerStock}</p>
            </div>
            <div className="rounded-lg bg-indigo-50 p-3 text-indigo-600">
              <Package size={20} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Outward Quantity</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{summary.outwardQty}</p>
            </div>
            <div className="rounded-lg bg-orange-50 p-3 text-orange-600">
              <ArrowUpRight size={20} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Returned Quantity</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{summary.inwardQty}</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
              <ArrowDownLeft size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Record Customer Stock Movement</h2>
            <p className="mt-1 text-sm text-slate-500">
              Create outward consignments and customer returns using backend-backed customer and item data.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Movement Type</label>
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
                  {(['Outward', 'Inward'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData((current) => ({ ...current, type }))}
                      className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        formData.type === type
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {type === 'Outward' ? 'Send to Customer' : 'Receive Back'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Customer</label>
                <select
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-700"
                  value={formData.partyId}
                  onChange={(event) => handleCustomerSelect(event.target.value)}
                >
                  <option value="">Select Customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Customer Name</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-700"
                  value={formData.partyName}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      partyName: event.target.value,
                    }))
                  }
                  placeholder="Enter customer name"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Item</label>
                <select
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-700"
                  value={formData.itemId}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      itemId: event.target.value,
                    }))
                  }
                >
                  <option value="">Select Item</option>
                  {typedItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.sku} - {item.name} (Stock: {item.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Quantity</label>
                <input
                  type="number"
                  min={1}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-700"
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
                <label className="mb-2 block text-sm font-medium text-slate-700">Notes</label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-700"
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Briefcase size={16} />}
                Save Movement
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <UserCheck size={18} className="text-blue-600" />
              <h3 className="text-base font-semibold text-slate-900">Top Customer Stock Items</h3>
            </div>

            <div className="mt-4 space-y-3">
              {topItems.length === 0 ? (
                <p className="text-sm text-slate-500">No active customer stock is available yet.</p>
              ) : (
                topItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.sku}</p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                      {item.consignmentStock} units
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="xl:col-span-8">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Customer Stock Ledger</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Review all outward consignments and inward returns synced from the backend.
                  </p>
                </div>

                <div className="flex flex-col gap-3 md:flex-row">
                  <div className="relative">
                    <Search
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search by customer, item or reference"
                      className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-700 md:w-72"
                    />
                  </div>

                  <select
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value as 'All' | 'Outward' | 'Inward')}
                  >
                    <option value="All">All Movements</option>
                    <option value="Outward">Outward Only</option>
                    <option value="Inward">Inward Only</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">Reference</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Customer</th>
                    <th className="px-6 py-4 font-medium">Item</th>
                    <th className="px-6 py-4 font-medium">Type</th>
                    <th className="px-6 py-4 text-right font-medium">Quantity</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pageLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        <Loader2 size={18} className="mr-2 inline animate-spin" />
                        Loading customer stock...
                      </td>
                    </tr>
                  ) : filteredConsignments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        No customer stock records found.
                      </td>
                    </tr>
                  ) : (
                    filteredConsignments.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-blue-600">{entry.reference}</td>
                        <td className="px-6 py-4 text-slate-600">{entry.date}</td>
                        <td className="px-6 py-4 text-slate-900">{entry.partyName}</td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-slate-900">{entry.itemName}</p>
                            <p className="text-xs text-slate-500">{entry.itemId}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                              entry.type === 'Outward'
                                ? 'bg-orange-50 text-orange-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {entry.type === 'Outward' ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                            {entry.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-900">{entry.quantity}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              entry.status === 'Active'
                                ? 'bg-blue-50 text-blue-700'
                                : entry.status === 'Returned'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {entry.status}
                          </span>
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
