import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Box, CheckCircle2, FileCheck, Loader2, ListChecks, Truck } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  completePickList,
  createChallan,
  createDispatch,
  createPackingOrder,
  createPickList,
  fetchOutwardWorkflow,
} from '@/store/slices/outwardSlice';

interface OutwardOpsViewProps {
  stage: 'pick' | 'pack' | 'challan' | 'dispatch';
}

const OutwardOpsView: React.FC<OutwardOpsViewProps> = ({ stage }) => {
  const dispatch = useAppDispatch();
  const {
    salesOrders,
    pickLists,
    packingOrders,
    challans,
    dispatches,
    loading,
    actionLoading,
    error,
  } = useAppSelector((state) => state.outward);

  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (
      salesOrders.length === 0 &&
      pickLists.length === 0 &&
      packingOrders.length === 0 &&
      challans.length === 0 &&
      dispatches.length === 0
    ) {
      dispatch(fetchOutwardWorkflow());
    }
  }, [dispatch, salesOrders.length, pickLists.length, packingOrders.length, challans.length, dispatches.length]);

  const pickListSoIds = useMemo(
    () => new Set(pickLists.map((pickList) => pickList.salesOrderId)),
    [pickLists]
  );
  const packedPickIds = useMemo(
    () => new Set(packingOrders.map((packingOrder) => packingOrder.pickListId)),
    [packingOrders]
  );
  const challanPackIds = useMemo(
    () => new Set(challans.flatMap((challan) => challan.packingOrderIds)),
    [challans]
  );
  const dispatchedChallanIds = useMemo(
    () => new Set(dispatches.map((dispatchItem) => dispatchItem.deliveryChallanId)),
    [dispatches]
  );

  const handleAction = async (action: string, id: string) => {
    setProcessingId(id);

    try {
      if (action === 'createPick') {
        const salesOrder = salesOrders.find((order) => order.id === id);
        if (!salesOrder) throw new Error('Sales order not found');
        await dispatch(createPickList(salesOrder)).unwrap();
      } else if (action === 'confirmPick') {
        const pickList = pickLists.find((item) => item.id === id);
        if (!pickList) throw new Error('Pick list not found');
        await dispatch(completePickList(pickList)).unwrap();
      } else if (action === 'createPack') {
        const pickList = pickLists.find((item) => item.id === id);
        if (!pickList) throw new Error('Pick list not found');

        const salesOrder = salesOrders.find((order) => order.id === pickList.salesOrderId);
        if (!salesOrder) throw new Error('Sales order not found');

        await dispatch(createPackingOrder({ pickList, salesOrder })).unwrap();
      } else if (action === 'createChallan') {
        const packingOrder = packingOrders.find((item) => item.id === id);
        if (!packingOrder) throw new Error('Packing order not found');
        await dispatch(createChallan(packingOrder)).unwrap();
      } else if (action === 'createDispatch') {
        const challan = challans.find((item) => item.id === id);
        if (!challan) throw new Error('Challan not found');

        const packingOrder = packingOrders.find((item) => challan.packingOrderIds.includes(item.id));
        await dispatch(createDispatch({ challan, packingOrder })).unwrap();
      }
    } catch (actionError: any) {
      alert(actionError?.message || 'Operation failed');
    } finally {
      setProcessingId(null);
    }
  };

  const renderContent = () => {
    if (stage === 'pick') {
      const pendingSOs = salesOrders.filter(
        (order) =>
          !pickListSoIds.has(order.id) &&
          order.status !== 'Cancelled' &&
          order.status !== 'Delivered' &&
          order.status !== 'Dispatched'
      );

      const activePickLists = pickLists.filter((pickList) =>
        ['Pending', 'In Progress'].includes(pickList.status)
      );

      return (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ListChecks size={20} className="text-blue-600" /> Orders Ready for Picking
            </h3>
            {pendingSOs.length === 0 ? (
              <p className="text-slate-500 text-sm">No sales orders waiting for pick list generation.</p>
            ) : (
              <div className="space-y-3">
                {pendingSOs.map((salesOrder) => (
                  <div
                    key={salesOrder.id}
                    className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100"
                  >
                    <div>
                      <p className="font-semibold text-slate-700">{salesOrder.soNumber}</p>
                      <p className="text-xs text-slate-500">
                        {salesOrder.customerName} • {salesOrder.items.length} Items
                      </p>
                    </div>
                    <button
                      onClick={() => handleAction('createPick', salesOrder.id)}
                      disabled={actionLoading}
                      className="bg-blue-600 text-white text-xs px-3 py-2 rounded hover:bg-blue-700 flex items-center gap-1 disabled:opacity-60"
                    >
                      Generate Pick List <ArrowRight size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4">Active Pick Lists</h3>
            <div className="space-y-3">
              {activePickLists.map((pickList) => (
                <div key={pickList.id} className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="font-bold">{pickList.pickListNo}</span>
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                      {pickList.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mb-3 space-y-1">
                    {pickList.items.map((item, idx) => (
                      <div key={`${pickList.id}-${idx}`}>
                        • {item.required}x {item.description}{' '}
                        <span className="text-slate-400">({item.location || 'Location pending'})</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => handleAction('confirmPick', pickList.id)}
                    disabled={actionLoading}
                    className="w-full bg-green-600 text-white text-sm py-2 rounded hover:bg-green-700 disabled:opacity-60"
                  >
                    Mark as Picked
                  </button>
                </div>
              ))}
              {activePickLists.length === 0 && (
                <p className="text-slate-500 text-sm">No active picks.</p>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (stage === 'pack') {
      const readyToPack = pickLists.filter(
        (pickList) => pickList.status === 'Completed' && !packedPickIds.has(pickList.id)
      );

      return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Box size={20} className="text-amber-600" /> Packing Station
          </h3>
          {readyToPack.length === 0 ? (
            <p className="text-slate-500 text-sm">No picked orders ready for packing.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {readyToPack.map((pickList) => (
                <div key={pickList.id} className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex justify-between mb-4">
                    <span className="font-bold text-slate-700">{pickList.soNumber}</span>
                    <span className="text-xs text-green-600 font-medium">Picked & Ready</span>
                  </div>
                  <button
                    onClick={() => handleAction('createPack', pickList.id)}
                    disabled={actionLoading}
                    className="w-full bg-amber-500 text-white text-sm py-2 rounded hover:bg-amber-600 flex justify-center items-center gap-2 disabled:opacity-60"
                  >
                    {processingId === pickList.id ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Box size={16} />
                    )}
                    Pack Items
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (stage === 'challan') {
      const readyForChallan = packingOrders.filter(
        (packingOrder) => packingOrder.status === 'Packed' && !challanPackIds.has(packingOrder.id)
      );

      return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <FileCheck size={20} className="text-blue-600" /> Generate Delivery Challan
          </h3>
          {readyForChallan.length === 0 ? (
            <p className="text-slate-500 text-sm">No packed orders pending challan.</p>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                <tr>
                  <th className="p-3">Packing Order</th>
                  <th className="p-3">SO Ref</th>
                  <th className="p-3">Items</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {readyForChallan.map((packingOrder) => (
                  <tr key={packingOrder.id}>
                    <td className="p-3 font-medium">{packingOrder.id.slice(-6).toUpperCase()}</td>
                    <td className="p-3">{packingOrder.soNumber}</td>
                    <td className="p-3">{packingOrder.items.length}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleAction('createChallan', packingOrder.id)}
                        disabled={actionLoading}
                        className="text-blue-600 hover:underline font-medium disabled:opacity-60"
                      >
                        Generate DC
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      );
    }

    if (stage === 'dispatch') {
      const readyToShip = challans.filter(
        (challan) =>
          challan.status === 'Generated' && !dispatchedChallanIds.has(challan.id)
      );

      return (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Truck size={20} className="text-purple-600" /> Dispatch Hub
            </h3>
            {readyToShip.length === 0 ? (
              <p className="text-slate-500 text-sm">No pending shipments.</p>
            ) : (
              <div className="space-y-4">
                {readyToShip.map((challan) => (
                  <div
                    key={challan.id}
                    className="flex justify-between items-center p-4 border border-slate-200 rounded-lg bg-slate-50"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{challan.challanNo}</p>
                      <p className="text-xs text-slate-500">Customer: {challan.customer}</p>
                    </div>
                    <button
                      onClick={() => handleAction('createDispatch', challan.id)}
                      disabled={actionLoading}
                      className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm font-medium disabled:opacity-60"
                    >
                      Dispatch Shipment
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4">Recent Dispatches</h3>
            <div className="space-y-2">
              {dispatches.map((dispatchItem) => (
                <div
                  key={dispatchItem.id}
                  className="text-sm flex justify-between border-b border-slate-100 pb-2 last:border-0"
                >
                  <div>
                    <span className="font-medium text-slate-700">{dispatchItem.dispatchNo}</span>
                    <span className="text-xs text-slate-400 mx-2">|</span>
                    <span className="text-slate-500">Tracking: {dispatchItem.shipmentRef}</span>
                  </div>
                  <div className="text-green-600 text-xs font-medium flex items-center gap-1">
                    <CheckCircle2 size={10} /> {dispatchItem.status}
                  </div>
                </div>
              ))}
              {dispatches.length === 0 && (
                <p className="text-slate-500 text-sm">No dispatches created yet.</p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="animate-fade-in">
      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="animate-spin inline" /> Loading Workflow...
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {renderContent()}
        </>
      )}
    </div>
  );
};

export default OutwardOpsView;
