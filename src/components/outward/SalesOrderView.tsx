import React, { useEffect, useState } from 'react';
import { Plus, User, Loader2, Edit, Trash2, Search, Filter } from 'lucide-react';
import { productService } from '@/services/productService';
import { salesService } from '@/services/salesService';
import { InventoryItem, Customer, SOItem } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createSalesOrder, fetchOutwardWorkflow, updateSalesOrder, deleteSalesOrder } from '@/store/slices/outwardSlice';
import Pagination from '@/components/common/Pagination';
import { useListControls } from '@/hooks/useListControls';
import ConfirmDeleteModal from '@/components/common/ConfirmDeleteModal';

const SalesOrderView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { salesOrders, loading, actionLoading } = useAppSelector((state) => state.outward);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [supportLoading, setSupportLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newSO, setNewSO] = useState<{ customerId: string; date: string; items: SOItem[] }>({
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    items: [],
  });
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: 'all', sortOrder: 'newest' });

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const organisationId = localStorage.getItem('organisationId');
  
  useEffect(() => {
    if (organisationId) {
      dispatch(fetchOutwardWorkflow());
    }
  }, [dispatch, organisationId]);

  useEffect(() => {
    const loadSupportData = async () => {
      if (!organisationId) return;
      setSupportLoading(true);
      const [customerData, itemData] = await Promise.all([
        salesService.getCustomers(),
        productService.getAllItems(),
      ]);
      setCustomers(customerData);
      setItems(itemData);
      setSupportLoading(false);
    };

    loadSupportData();
  }, [organisationId]);

  const handleAddItem = () => {
    setNewSO((current) => ({
      ...current,
      items: [...current.items, { itemId: '', itemName: '', quantity: 1, unitPrice: 0 }],
    }));
  };

  const updateItem = (index: number, field: keyof SOItem, value: string | number) => {
    const updatedItems = [...newSO.items];

    if (field === 'itemId') {
      const selectedItem = items.find((item) => item.id === value);
      updatedItems[index] = {
        ...updatedItems[index],
        itemId: String(value),
        itemName: selectedItem?.name || '',
        unitPrice: selectedItem?.salePrice || 0,
      };
    } else {
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
      };
    }

    setNewSO((current) => ({ ...current, items: updatedItems }));
  };

  const handleEdit = (so: any) => {
    setEditingId(so.id);
    setIsEditing(true);
    setIsCreating(true);
    setNewSO({
      customerId: so.customerName || so.customerId,
      date: so.date,
      items: so.items.map((i: any) => ({
        itemId: i.itemId,
        itemName: i.itemName,
        quantity: i.quantity,
        unitPrice: i.unitPrice
      })),
    });
  };

  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteSalesOrder(deleteTargetId)).unwrap();
    } catch (err: any) {
      console.error("Failed to delete sales order", err);
      alert(err || 'Failed to delete order');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setDeleteTargetId(null);
    }
  };

  const handleCreate = async () => {
    if (!newSO.customerId || newSO.items.length === 0) {
      alert('Please select customer and items');
      return;
    }

    const customer = customers.find((item) => item.id === newSO.customerId);
    const totalAmount = newSO.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    try {
      if (isEditing && editingId) {
        await dispatch(
          updateSalesOrder({
            id: editingId,
            data: {
              customerName: customer?.name || newSO.customerId,
              date: newSO.date,
              totalAmount,
              items: newSO.items,
            },
          })
        ).unwrap();
      } else {
        await dispatch(
          createSalesOrder({
            customerId: newSO.customerId,
            customerName: customer?.name || '',
            date: newSO.date,
            totalAmount,
            items: newSO.items,
          })
        ).unwrap();
      }

      setIsCreating(false);
      setIsEditing(false);
      setEditingId(null);
      setNewSO({
        customerId: '',
        date: new Date().toISOString().split('T')[0],
        items: [],
      });
    } catch (createError: any) {
      alert(createError?.message || 'Failed to create sales order');
    }
  };

  const isPageLoading = loading || supportLoading;

  const {
    filteredItems: filteredSalesOrders,
    pagedItems: pagedSalesOrders,
    page,
    totalItems,
    totalPages,
    setPage,
  } = useListControls({
    items: salesOrders,
    searchTerm: search,
    filters,
    initialPageSize: 8,
    searchFn: (salesOrder, term) =>
      salesOrder.soNumber.toLowerCase().includes(term) ||
      (salesOrder.customerName || '').toLowerCase().includes(term) ||
      (salesOrder.status || '').toLowerCase().includes(term) ||
      (salesOrder.date || '').toLowerCase().includes(term),
    filterFn: (salesOrder, activeFilters) =>
      activeFilters.status === 'all' || salesOrder.status === activeFilters.status,
  });

  return (
    <div className="space-y-6">
      {isCreating ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-800">{isEditing ? 'Edit Sales Order' : 'Create Sales Order'}</h2>
            <button 
              onClick={() => {
                setIsCreating(false);
                setIsEditing(false);
                setEditingId(null);
              }} 
              className="text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Customer</label>
              <select
                className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                value={newSO.customerId}
                onChange={(e) => setNewSO((current) => ({ ...current, customerId: e.target.value }))}
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                value={newSO.date}
                onChange={(e) => setNewSO((current) => ({ ...current, date: e.target.value }))}
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-slate-700 text-sm">Items</h3>
              <button onClick={handleAddItem} className="text-xs text-blue-600 hover:underline">
                + Add Item
              </button>
            </div>
            <table className="w-full text-sm text-left border rounded-lg overflow-hidden">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="p-2">Item</th>
                  <th className="p-2 w-24">Qty</th>
                  <th className="p-2 w-24">Price</th>
                  <th className="p-2 w-24">Total</th>
                </tr>
              </thead>
              <tbody>
                {newSO.items.map((item, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-2">
                      <select
                        className="w-full border border-slate-200 rounded p-1"
                        value={item.itemId}
                        onChange={(e) => updateItem(idx, 'itemId', e.target.value)}
                      >
                        <option value="">Select Item</option>
                        {items.map((inventoryItem) => (
                          <option key={inventoryItem.id} value={inventoryItem.id}>
                            {inventoryItem.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        className="w-full border border-slate-200 rounded p-1"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        className="w-full border border-slate-200 rounded p-1"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))}
                      />
                    </td>
                    <td className="p-2 text-right">
                      ₹{(item.quantity * item.unitPrice).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleCreate}
              disabled={actionLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {actionLoading ? 'Saving...' : isEditing ? 'Update Order' : 'Generate Order'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
          >
            <Plus size={16} /> New Sales Order
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Sales Orders</h2>
            <p className="text-sm text-slate-500">Search and filter order records.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-72">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search order, customer, status..."
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div className="relative w-full sm:w-56">
              <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-sm outline-none focus:border-blue-500"
              >
                <option value="all">All statuses</option>
                <option value="Draft">Draft</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Dispatched">Dispatched</option>
              </select>
            </div>
            <div className="relative w-full sm:w-44">
              <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={filters.sortOrder}
                onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value })}
                className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-sm outline-none focus:border-blue-500"
              >
                <option value="newest">Newest first</option>
                <option value="earliest">Earliest first</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">SO Number</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isPageLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center">
                    <Loader2 className="animate-spin inline mr-2" /> Loading...
                  </td>
                </tr>
              ) : filteredSalesOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No Sales Orders found.
                  </td>
                </tr>
              ) : (
                pagedSalesOrders.map((salesOrder) => (
                  <tr key={salesOrder.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-blue-600">{salesOrder.soNumber}</td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      <User size={14} className="text-slate-400" /> {salesOrder.customerName}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{salesOrder.date}</td>
                    <td className="px-6 py-4 font-medium">₹{salesOrder.totalAmount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${
                          salesOrder.status === 'Dispatched'
                            ? 'bg-green-50 text-green-700 border-green-100'
                            : salesOrder.status === 'Confirmed'
                              ? 'bg-blue-50 text-blue-700 border-blue-100'
                              : 'bg-slate-50 text-slate-700 border-slate-100'
                        }`}
                      >
                        {salesOrder.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(salesOrder)}
                          className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(salesOrder.id)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalItems > 0 && totalPages > 1 && (
          <div className="px-6 pb-6">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        itemName={salesOrders.find((so) => so.id === deleteTargetId)?.soNumber}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};

export default SalesOrderView;
