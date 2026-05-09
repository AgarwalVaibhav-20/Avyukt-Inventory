import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownLeft,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  Loader2,
  Package,
  PackageOpen,
  RefreshCcw,
  RotateCcw,
  Search,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { ConsignmentEntry, InventoryItem } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createConsignmentEntry, fetchStockMovementData } from '@/store/slices/stockMovementSlice';
import { ConsignmentCustomerOption, movementService } from '@/services/movementService';

type ReturnCondition = 'Good' | 'Damaged' | 'Defective' | 'Expired';
type ReturnDisposition = 'Restock' | 'Quality Inspection' | 'Scrap' | 'Rework';

const CONDITIONS: ReturnCondition[] = ['Good', 'Damaged', 'Defective', 'Expired'];
const DISPOSITIONS: ReturnDisposition[] = ['Restock', 'Quality Inspection', 'Scrap', 'Rework'];

const CustomerReturnsView: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { consignments, items, actionLoading, error, loading } = useAppSelector(
    (state) => state.stockMovement
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<ConsignmentCustomerOption[]>([]);
  const [supportLoading, setSupportLoading] = useState(true);
  const [returnCondition, setReturnCondition] = useState<ReturnCondition>('Good');
  const [disposition, setDisposition] = useState<ReturnDisposition>('Restock');
  const [formData, setFormData] = useState({
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
    const load = async () => {
      setSupportLoading(true);
      const options = await movementService.getConsignmentCustomers();
      setCustomers(options);
      setSupportLoading(false);
    };
    load();
  }, []);

  const typedConsignments = consignments as ConsignmentEntry[];
  const typedItems = items as InventoryItem[];

  // Only show inward (return) entries
  const returnEntries = useMemo(() => {
    return typedConsignments.filter((e) => e.type === 'Inward');
  }, [typedConsignments]);

  const filteredReturns = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return returnEntries.filter(
      (entry) =>
        !term ||
        entry.partyName.toLowerCase().includes(term) ||
        entry.itemName.toLowerCase().includes(term) ||
        entry.reference.toLowerCase().includes(term)
    );
  }, [returnEntries, searchTerm]);

  // Summary
  const summary = useMemo(() => {
    const totalReturns = returnEntries.length;
    const totalQtyReturned = returnEntries.reduce((t, e) => t + e.quantity, 0);
    const activeReturns = returnEntries.filter((e) => e.status === 'Returned').length;
    const settledReturns = returnEntries.filter((e) => e.status === 'Settled').length;
    const uniqueCustomers = new Set(returnEntries.map((e) => e.partyName)).size;

    return { totalReturns, totalQtyReturned, activeReturns, settledReturns, uniqueCustomers };
  }, [returnEntries]);

  const handleCustomerSelect = (customerId: string) => {
    const selected = customers.find((c) => c.id === customerId);
    setFormData((cur) => ({
      ...cur,
      partyId: customerId,
      partyName: selected?.name || cur.partyName,
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

    const item = typedItems.find((i) => i.id === formData.itemId);
    const returnNotes = `Condition: ${returnCondition} | Disposition: ${disposition}${formData.notes ? ' | ' + formData.notes : ''}`;

    try {
      await dispatch(
        createConsignmentEntry({
          type: 'Inward',
          partyId: formData.partyId,
          partyName: formData.partyName.trim(),
          itemId: formData.itemId,
          itemName: item?.name || 'Unknown',
          quantity: formData.quantity,
          notes: returnNotes,
        })
      ).unwrap();

      setFormData({ partyId: '', partyName: '', itemId: '', quantity: 1, notes: '' });
      setReturnCondition('Good');
      setDisposition('Restock');

      const refreshedCustomers = await movementService.getConsignmentCustomers();
      setCustomers(refreshedCustomers);
    } catch (err) {
      console.error('Return creation failed', err);
    }
  };

  const pageLoading = loading || supportLoading;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Customer Returns</h1>
          <p className="mt-2 text-base text-slate-600">
            Process goods returned from customers — capture return reason, condition assessment, and route to appropriate disposition.
          </p>
        </div>
        <button
          type="button"
          onClick={() => dispatch(fetchStockMovementData())}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start rounded-lg bg-gradient-to-r from-rose-600 to-rose-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:from-rose-700 hover:to-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh Data
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="group overflow-hidden rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 to-rose-100 p-6 shadow-md transition-all hover:shadow-lg hover:border-rose-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-rose-600">
                Total Returns
              </p>
              <p className="mt-3 text-3xl font-bold text-rose-900">{summary.totalReturns}</p>
            </div>
            <div className="rounded-xl bg-white p-3 text-rose-600 shadow-md group-hover:shadow-lg transition-shadow">
              <RotateCcw size={24} />
            </div>
          </div>
        </div>

        <div className="group overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-orange-100 p-6 shadow-md transition-all hover:shadow-lg hover:border-orange-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-orange-600">
                Qty Returned
              </p>
              <p className="mt-3 text-3xl font-bold text-orange-900">{summary.totalQtyReturned}</p>
            </div>
            <div className="rounded-xl bg-white p-3 text-orange-600 shadow-md group-hover:shadow-lg transition-shadow">
              <Package size={24} />
            </div>
          </div>
        </div>

        <div className="group overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-md transition-all hover:shadow-lg hover:border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                Pending Processing
              </p>
              <p className="mt-3 text-3xl font-bold text-blue-900">{summary.activeReturns}</p>
            </div>
            <div className="rounded-xl bg-white p-3 text-blue-600 shadow-md group-hover:shadow-lg transition-shadow">
              <ClipboardCheck size={24} />
            </div>
          </div>
        </div>

        <div className="group overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 shadow-md transition-all hover:shadow-lg hover:border-emerald-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
                Settled
              </p>
              <p className="mt-3 text-3xl font-bold text-emerald-900">{summary.settledReturns}</p>
            </div>
            <div className="rounded-xl bg-white p-3 text-emerald-600 shadow-md group-hover:shadow-lg transition-shadow">
              <CheckCircle2 size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        {/* Return Form */}
        <div className="space-y-8 xl:col-span-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 p-2.5 text-white">
                <ArrowDownLeft size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Record Return</h2>
                <p className="text-xs text-slate-500">
                  Log goods returned from a customer
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Customer</label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 transition-colors focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100"
                  value={formData.partyId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                >
                  <option value="">🔍 Select Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Item</label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 transition-colors focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100"
                  value={formData.itemId}
                  onChange={(e) => setFormData((c) => ({ ...c, itemId: e.target.value }))}
                >
                  <option value="">📦 Select Item</option>
                  {typedItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.sku} - {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Quantity</label>
                <input
                  type="number"
                  min={1}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 transition-colors focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100"
                  value={formData.quantity}
                  onChange={(e) => setFormData((c) => ({ ...c, quantity: Number(e.target.value) }))}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Condition Assessment
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CONDITIONS.map((cond) => (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => setReturnCondition(cond)}
                      className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                        returnCondition === cond
                          ? cond === 'Good'
                            ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300'
                            : cond === 'Damaged'
                              ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-300'
                              : cond === 'Defective'
                                ? 'bg-red-100 text-red-700 ring-2 ring-red-300'
                                : 'bg-slate-200 text-slate-700 ring-2 ring-slate-400'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cond === 'Good' && '✅ '}
                      {cond === 'Damaged' && '⚠️ '}
                      {cond === 'Defective' && '❌ '}
                      {cond === 'Expired' && '🕐 '}
                      {cond}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Disposition
                </label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 transition-colors focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100"
                  value={disposition}
                  onChange={(e) => setDisposition(e.target.value as ReturnDisposition)}
                >
                  {DISPOSITIONS.map((d) => (
                    <option key={d} value={d}>
                      {d === 'Restock' && '📦 '}
                      {d === 'Quality Inspection' && '🔍 '}
                      {d === 'Scrap' && '🗑️ '}
                      {d === 'Rework' && '🔧 '}
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Return Reason / Notes
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 transition-colors focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100"
                  value={formData.notes}
                  onChange={(e) => setFormData((c) => ({ ...c, notes: e.target.value }))}
                  placeholder="Reason for return, defect details, etc."
                />
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={actionLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:from-rose-700 hover:to-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <ArrowDownLeft size={18} />
                )}
                Record Return
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700 shadow-md">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Returns Table */}
        <div className="xl:col-span-8">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Return History</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    All customer return entries from the backend
                  </p>
                </div>
                <div className="relative">
                  <Search
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search returns..."
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 transition-colors focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100 md:w-80"
                  />
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
                    <th className="px-6 py-4 text-right font-semibold text-slate-700">Qty</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pageLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <Loader2 size={24} className="mx-auto mb-2 animate-spin text-rose-600" />
                        <p className="font-medium text-slate-500">Loading return records...</p>
                      </td>
                    </tr>
                  ) : filteredReturns.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <PackageOpen size={32} className="mx-auto mb-3 text-slate-300" />
                        <p className="font-medium text-slate-500">No customer returns found.</p>
                        <p className="mt-1 text-xs text-slate-400">
                          Use the form on the left to record a return.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredReturns.map((entry, index) => (
                      <tr
                        key={entry.id}
                        className={`transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                        } hover:bg-rose-50`}
                      >
                        <td className="px-6 py-4">
                          <span className="inline-block rounded-lg bg-rose-100 px-3 py-1 font-semibold text-rose-700">
                            {entry.reference}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{entry.date}</td>
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {entry.partyName}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-slate-900">{entry.itemName}</p>
                            <p className="text-xs text-slate-500">{entry.itemId}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">
                          {entry.quantity}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                              entry.status === 'Returned'
                                ? 'bg-amber-100 text-amber-700'
                                : entry.status === 'Settled'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {entry.status === 'Returned' && <FileSearch size={14} />}
                            {entry.status === 'Settled' && <CheckCircle2 size={14} />}
                            {entry.status === 'Active' && <ShieldAlert size={14} />}
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

export default CustomerReturnsView;
