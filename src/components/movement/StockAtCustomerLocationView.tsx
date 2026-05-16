import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  Loader2,
  MapPin,
  Package,
  RefreshCcw,
  Search,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { ConsignmentEntry, InventoryItem } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchStockMovementData } from '@/store/slices/stockMovementSlice';

interface CustomerSiteStock {
  customerId: string;
  customerName: string;
  items: {
    itemId: string;
    itemName: string;
    quantity: number;
    lastDispatchDate: string;
    lastReturnDate: string;
    movementCount: number;
  }[];
  totalQuantity: number;
  totalItems: number;
  lastReplenishmentDate: string;
}

const StockAtCustomerLocationView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { consignments, items, loading } = useAppSelector(
    (state) => state.stockMovement
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchStockMovementData());
  }, [dispatch]);

  const typedConsignments = consignments as ConsignmentEntry[];
  const typedItems = items as InventoryItem[];

  // Build customer site stock positions
  const customerSiteStocks = useMemo(() => {
    const customerMap = new Map<string, CustomerSiteStock>();

    typedConsignments.forEach((entry) => {
      const key = entry.partyName.toLowerCase();
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          customerId: entry.partyId || key,
          customerName: entry.partyName,
          items: [],
          totalQuantity: 0,
          totalItems: 0,
          lastReplenishmentDate: '',
        });
      }

      const customer = customerMap.get(key)!;
      let itemEntry = customer.items.find((i) => i.itemId === entry.itemId);

      if (!itemEntry) {
        itemEntry = {
          itemId: entry.itemId,
          itemName: entry.itemName,
          quantity: 0,
          lastDispatchDate: '',
          lastReturnDate: '',
          movementCount: 0,
        };
        customer.items.push(itemEntry);
      }

      itemEntry.movementCount += 1;

      if (entry.type === 'Outward') {
        itemEntry.quantity += entry.quantity;
        if (!itemEntry.lastDispatchDate || entry.date > itemEntry.lastDispatchDate) {
          itemEntry.lastDispatchDate = entry.date;
        }
        if (!customer.lastReplenishmentDate || entry.date > customer.lastReplenishmentDate) {
          customer.lastReplenishmentDate = entry.date;
        }
      } else {
        itemEntry.quantity = Math.max(0, itemEntry.quantity - entry.quantity);
        if (!itemEntry.lastReturnDate || entry.date > itemEntry.lastReturnDate) {
          itemEntry.lastReturnDate = entry.date;
        }
      }
    });

    // Calculate totals
    customerMap.forEach((customer) => {
      customer.items = customer.items.filter((i) => i.quantity > 0);
      customer.totalQuantity = customer.items.reduce((t, i) => t + i.quantity, 0);
      customer.totalItems = customer.items.length;
    });

    return Array.from(customerMap.values())
      .filter((c) => c.totalQuantity > 0)
      .sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, [typedConsignments]);

  // Summary stats
  const summary = useMemo(() => {
    const totalCustomers = customerSiteStocks.length;
    const totalUnits = customerSiteStocks.reduce((t, c) => t + c.totalQuantity, 0);
    const totalSKUs = new Set(customerSiteStocks.flatMap((c) => c.items.map((i) => i.itemId))).size;

    const lowStockSites = customerSiteStocks.filter((c) =>
      c.items.some((i) => i.quantity <= 2)
    ).length;

    return { totalCustomers, totalUnits, totalSKUs, lowStockSites };
  }, [customerSiteStocks]);

  // Filter
  const filteredCustomers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return customerSiteStocks;
    return customerSiteStocks.filter(
      (c) =>
        c.customerName.toLowerCase().includes(term) ||
        c.items.some((i) => i.itemName.toLowerCase().includes(term))
    );
  }, [customerSiteStocks, searchTerm]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Stock at Customer Location</h1>
          <p className="mt-2 text-base text-slate-600">
            Item-wise stock positions at each customer site with replenishment tracking.
          </p>
        </div>
        <button
          type="button"
          onClick={() => dispatch(fetchStockMovementData())}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start rounded-lg bg-gradient-to-r from-teal-600 to-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:from-teal-700 hover:to-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh Data
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="group overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-teal-100 p-6 shadow-md transition-all hover:shadow-lg hover:border-teal-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-teal-600">
                Customer Sites
              </p>
              <p className="mt-3 text-3xl font-bold text-teal-900">{summary.totalCustomers}</p>
            </div>
            <div className="rounded-xl bg-white p-3 text-teal-600 shadow-md group-hover:shadow-lg transition-shadow">
              <Building2 size={24} />
            </div>
          </div>
        </div>

        <div className="group overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 shadow-md transition-all hover:shadow-lg hover:border-indigo-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
                Total Units at Sites
              </p>
              <p className="mt-3 text-3xl font-bold text-indigo-900">{summary.totalUnits}</p>
            </div>
            <div className="rounded-xl bg-white p-3 text-indigo-600 shadow-md group-hover:shadow-lg transition-shadow">
              <Package size={24} />
            </div>
          </div>
        </div>

        <div className="group overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-violet-100 p-6 shadow-md transition-all hover:shadow-lg hover:border-violet-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-violet-600">
                Unique SKUs
              </p>
              <p className="mt-3 text-3xl font-bold text-violet-900">{summary.totalSKUs}</p>
            </div>
            <div className="rounded-xl bg-white p-3 text-violet-600 shadow-md group-hover:shadow-lg transition-shadow">
              <MapPin size={24} />
            </div>
          </div>
        </div>

        <div className="group overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-amber-100 p-6 shadow-md transition-all hover:shadow-lg hover:border-amber-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">
                Low Stock Sites
              </p>
              <p className="mt-3 text-3xl font-bold text-amber-900">{summary.lowStockSites}</p>
            </div>
            <div className="rounded-xl bg-white p-3 text-amber-600 shadow-md group-hover:shadow-lg transition-shadow">
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full lg:w-96">
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by customer or item name..."
          className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 transition-colors focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
        />
      </div>

      {/* Customer Site Cards */}
      <div className="space-y-5">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 size={28} className="mx-auto mb-3 animate-spin text-teal-600" />
            <p className="text-slate-500 font-medium">Loading customer stock positions...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-16 text-center">
            <Building2 size={36} className="mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 font-medium">No stock found at customer locations.</p>
          </div>
        ) : (
          filteredCustomers.map((customer) => {
            const isExpanded = expandedCustomer === customer.customerId;

            return (
              <div
                key={customer.customerId}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg transition-all hover:shadow-xl"
              >
                {/* Customer Header */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedCustomer(isExpanded ? null : customer.customerId)
                  }
                  className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 p-3 text-white shadow-md">
                      <Building2 size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {customer.customerName}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Package size={12} />
                          {customer.totalItems} items
                        </span>
                        <span>•</span>
                        <span>{customer.totalQuantity} units total</span>
                        {customer.lastReplenishmentDate && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1">
                              <CalendarClock size={12} />
                              Last replenished: {customer.lastReplenishmentDate}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-teal-100 px-4 py-1.5 text-sm font-bold text-teal-700">
                      {customer.totalQuantity} units
                    </span>
                    <svg
                      className={`h-5 w-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded Item Table */}
                {isExpanded && (
                  <div className="border-t border-slate-100">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3.5 font-semibold text-slate-600">Item Name</th>
                          <th className="px-6 py-3.5 text-right font-semibold text-slate-600">
                            Qty at Site
                          </th>
                          <th className="px-6 py-3.5 font-semibold text-slate-600">Last Dispatch</th>
                          <th className="px-6 py-3.5 font-semibold text-slate-600">Last Return</th>
                          <th className="px-6 py-3.5 text-right font-semibold text-slate-600">
                            Movements
                          </th>
                          <th className="px-6 py-3.5 font-semibold text-slate-600">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {customer.items.map((item) => (
                          <tr key={item.itemId} className="transition-colors hover:bg-slate-50">
                            <td className="px-6 py-3.5">
                              <p className="font-semibold text-slate-900">{item.itemName}</p>
                              <p className="text-xs text-slate-400">{item.itemId}</p>
                            </td>
                            <td className="px-6 py-3.5 text-right font-bold text-slate-900">
                              {item.quantity}
                            </td>
                            <td className="px-6 py-3.5 text-slate-600">
                              {item.lastDispatchDate || '-'}
                            </td>
                            <td className="px-6 py-3.5 text-slate-600">
                              {item.lastReturnDate || '-'}
                            </td>
                            <td className="px-6 py-3.5 text-right text-slate-600">
                              {item.movementCount}
                            </td>
                            <td className="px-6 py-3.5">
                              {item.quantity <= 2 ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                  <TrendingDown size={12} />
                                  Low Stock
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                  <TrendingUp size={12} />
                                  Adequate
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StockAtCustomerLocationView;
