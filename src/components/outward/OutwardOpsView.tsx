import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Box,
  CheckCircle2,
  FileCheck,
  Loader2,
  ListChecks,
  Truck,
  ShieldCheck,
  Link,
  IndianRupee,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  completePickList,
  createChallan,
  createDispatch,
  createPackingOrder,
  createPickList,
  fetchOutwardWorkflow,
} from "@/store/slices/outwardSlice";

interface OutwardOpsViewProps {
  stage: "pick" | "pack" | "challan" | "dispatch";
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
  const [confirmingPickId, setConfirmingPickId] = useState<string | null>(null);
  const [pickQuantities, setPickQuantities] = useState<Record<string, number>>(
    {},
  );

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
  }, [
    dispatch,
    salesOrders.length,
    pickLists.length,
    packingOrders.length,
    challans.length,
    dispatches.length,
  ]);

  const pickListSoIds = useMemo(
    () =>
      new Set(
        pickLists.map((pickList) =>
          typeof pickList.salesOrderId === "object"
            ? pickList.salesOrderId?._id || pickList.salesOrderId?.id
            : pickList.salesOrderId,
        ),
      ),
    [pickLists],
  );
  const packedPickIds = useMemo(
    () => new Set(packingOrders.map((packingOrder) => packingOrder.pickListId)),
    [packingOrders],
  );
  const challanPackIds = useMemo(
    () => new Set(challans.flatMap((challan) => challan.packingOrderIds)),
    [challans],
  );
  const dispatchedChallanIds = useMemo(
    () =>
      new Set(dispatches.map((dispatchItem) => dispatchItem.deliveryChallanId)),
    [dispatches],
  );

  const handleAction = async (action: string, id: string) => {
    setProcessingId(id);

    try {
      if (action === "createPick") {
        const salesOrder = salesOrders.find((order) => order.id === id);
        if (!salesOrder) throw new Error("Sales order not found");
        await dispatch(createPickList(salesOrder)).unwrap();
      } else if (action === "confirmPick") {
        const pickList = pickLists.find((item) => item.id === id);
        if (!pickList) throw new Error("Pick list not found");

        // Ensure all items are confirmed with quantities from state
        const updatedItems = pickList.items.map((item: any, idx: number) => ({
          ...item,
          picked: pickQuantities[`${id}-${idx}`] ?? item.required,
        }));

        await dispatch(
          completePickList({ ...pickList, items: updatedItems }),
        ).unwrap();
        setConfirmingPickId(null);
      } else if (action === "createPack") {
        const pickList = pickLists.find((item) => item.id === id);
        if (!pickList) throw new Error("Pick list not found");

        const soId =
          typeof pickList.salesOrderId === "object"
            ? pickList.salesOrderId?._id || pickList.salesOrderId?.id
            : pickList.salesOrderId;

        const salesOrder = salesOrders.find((order) => order.id === soId);
        if (!salesOrder) throw new Error("Sales order not found");

        await dispatch(createPackingOrder({ pickList, salesOrder })).unwrap();
      } else if (action === "createChallan") {
        const packingOrder = packingOrders.find((item) => item.id === id);
        if (!packingOrder) throw new Error("Packing order not found");
        await dispatch(createChallan(packingOrder)).unwrap();
      } else if (action === "createDispatch") {
        const challan = challans.find((item) => item.id === id);
        if (!challan) throw new Error("Challan not found");

        const packingOrder = packingOrders.find((item) =>
          challan.packingOrderIds.includes(item.id),
        );
        await dispatch(createDispatch({ challan, packingOrder })).unwrap();
      }
    } catch (actionError: any) {
      alert(actionError?.message || "Operation failed");
    } finally {
      setProcessingId(null);
    }
  };

  const renderContent = () => {
    if (stage === "pick") {
      const pendingSOs = salesOrders.filter(
        (order) =>
          !pickListSoIds.has(order.id) &&
          order.status !== "Cancelled" &&
          order.status !== "Delivered" &&
          order.status !== "Dispatched",
      );

      const activePickLists = pickLists.filter((pickList) =>
        ["Pending", "In Progress"].includes(pickList.status),
      );

      return (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ListChecks size={20} className="text-blue-600" /> Orders Ready
              for Picking
            </h3>
            {pendingSOs.length === 0 ? (
              <p className="text-slate-500 text-sm">
                No sales orders waiting for pick list generation.
              </p>
            ) : (
              <div className="space-y-3">
                {pendingSOs.map((salesOrder) => (
                  <div
                    key={salesOrder.id}
                    className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100"
                  >
                    <div>
                      <p className="font-semibold text-slate-700">
                        {salesOrder.soNumber}
                      </p>
                      <p className="text-xs text-slate-500">
                        {salesOrder.customerName} • {salesOrder.items.length}{" "}
                        Items
                      </p>
                    </div>
                    <button
                      onClick={() => handleAction("createPick", salesOrder.id)}
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
            <div className="space-y-4">
              {activePickLists.map((pickList) => (
                <div
                  key={pickList.id}
                  className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm"
                >
                  <div className="flex justify-between mb-4">
                    <div>
                      <span className="font-bold text-lg text-slate-800">
                        {pickList.pickListNo}
                      </span>
                      <p className="text-xs text-slate-500">
                        Linked to{" "}
                        {pickList.soNumber ||
                          pickList.salesOrderId?.soNumber ||
                          "SO"}
                      </p>
                    </div>
                    <span className="text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-medium h-fit">
                      {pickList.status}
                    </span>
                  </div>

                  {confirmingPickId === pickList.id ? (
                    <div className="space-y-4 border-t pt-4">
                      <p className="text-sm font-semibold text-slate-700 mb-2">
                        Confirm Quantities (Simulating Scan):
                      </p>
                      {pickList.items.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-slate-50 rounded"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {item.description}
                            </p>
                            <p className="text-xs text-blue-600 font-mono">
                              {item.location || "Bin Unknown"}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500">
                              Goal: {item.required}
                            </span>
                            <input
                              type="number"
                              className="w-16 p-1 border rounded text-center text-sm"
                              defaultValue={item.required}
                              onChange={(e) =>
                                setPickQuantities({
                                  ...pickQuantities,
                                  [`${pickList.id}-${idx}`]: parseInt(
                                    e.target.value,
                                  ),
                                })
                              }
                            />
                          </div>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleAction("confirmPick", pickList.id)
                          }
                          className="flex-1 bg-green-600 text-white text-sm py-2 rounded hover:bg-green-700 font-bold"
                        >
                          Confirm & Finish Picking
                        </button>
                        <button
                          onClick={() => setConfirmingPickId(null)}
                          className="px-4 py-2 border border-slate-200 rounded text-sm hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm text-slate-600 mb-4 grid grid-cols-1 gap-2">
                        {pickList.items.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg"
                          >
                            <div className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded">
                              {item.location || "LOC"}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">
                                {item.description}
                              </p>
                              <p className="text-xs text-slate-500">
                                Pick {item.required} units
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => setConfirmingPickId(pickList.id)}
                        disabled={actionLoading}
                        className="w-full border-2 border-green-600 text-green-600 text-sm py-2 rounded font-bold hover:bg-green-50 transition-colors disabled:opacity-60"
                      >
                        Start Picking Flow
                      </button>
                    </>
                  )}
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

    if (stage === "pack") {
      const readyToPack = pickLists.filter(
        (pickList) =>
          pickList.status === "Completed" && !packedPickIds.has(pickList.id),
      );

      return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Box size={20} className="text-amber-600" /> Packing Station
          </h3>
          {readyToPack.length === 0 ? (
            <p className="text-slate-500 text-sm">
              No picked orders ready for packing.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {readyToPack.map((pickList) => (
                <div
                  key={pickList.id}
                  className="p-4 border border-slate-200 rounded-lg"
                >
                  <div className="flex justify-between mb-4">
                    <span className="font-bold text-slate-700">
                      {pickList.soNumber ||
                        pickList.salesOrderId?.soNumber ||
                        "Sales Order"}
                    </span>
                    <span className="text-xs text-green-600 font-medium">
                      Picked & Ready
                    </span>
                  </div>

                  <div className="space-y-1 mb-4">
                    {pickList.items.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex justify-between text-xs text-slate-600 bg-slate-50 p-1.5 rounded"
                      >
                        <span className="truncate mr-2">
                          {item.description}
                        </span>
                        <span className="font-bold">
                          x{item.picked || item.required}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleAction("createPack", pickList.id)}
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

    if (stage === "challan") {
      const readyForChallan = packingOrders.filter(
        (packingOrder) =>
          packingOrder.status === "Packed" &&
          !challanPackIds.has(packingOrder.id),
      );

      return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <FileCheck size={20} className="text-blue-600" /> Generate Delivery
            Challan
          </h3>
          {readyForChallan.length === 0 ? (
            <p className="text-slate-500 text-sm">
              No packed orders pending challan.
            </p>
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
                    <td className="p-3 font-medium">
                      {packingOrder.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="p-3">{packingOrder.soNumber}</td>
                    <td className="p-3">{packingOrder.items.length}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() =>
                          handleAction("createChallan", packingOrder.id)
                        }
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

    if (stage === "dispatch") {
      const readyToShip = challans.filter(
        (challan) =>
          challan.status === "Generated" &&
          !dispatchedChallanIds.has(challan.id),
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
                      <p className="font-bold text-slate-800">
                        {challan.challanNo}
                      </p>
                      <p className="text-xs text-slate-500">
                        Customer: {challan.customer}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAction("createDispatch", challan.id)}
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
            <div className="space-y-4">
              {dispatches.map((dispatchItem) => (
                <div
                  key={dispatchItem.id}
                  className="p-4 border border-slate-100 rounded-lg bg-slate-50 flex flex-col gap-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-800">
                        {dispatchItem.dispatchNo}
                      </span>
                      <p className="text-xs text-slate-500">
                        {dispatchItem.customer} •{" "}
                        {dispatchItem.items?.length || 0} Items
                      </p>
                    </div>
                    <div className="text-green-600 text-xs font-bold bg-green-100 px-2 py-1 rounded flex items-center gap-1">
                      <CheckCircle2 size={12} /> {dispatchItem.status}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 items-center text-[10px] pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-slate-500 font-bold uppercase tracking-tight">
                      <Box size={10} className="text-blue-500" /> Stock Deducted
                    </div>
                    <div className="flex items-center gap-1 text-slate-500 font-bold uppercase tracking-tight">
                      <IndianRupee size={10} className="text-emerald-500" />{" "}
                      COGS Posted
                    </div>
                    <div className="flex items-center gap-1 text-slate-500 font-bold uppercase tracking-tight">
                      <Link size={10} className="text-indigo-500" /> Invoice
                      Mapped
                    </div>
                    <div className="ml-auto flex items-center gap-1 text-blue-600 font-black uppercase tracking-widest">
                      <ShieldCheck size={12} />
                      {dispatchItem.totalAmount > 50000
                        ? "E-Way Bill Generated"
                        : "E-Way Bill N/A"}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                    <div>
                      <span className="opacity-50">Tracking:</span>{" "}
                      {dispatchItem.shipmentRef || "TBD"}
                    </div>
                    <div className="flex items-center gap-2">
                      <span>
                        Dispatch Date: {new Date().toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {dispatches.length === 0 && (
                <p className="text-slate-500 text-sm">
                  No dispatches created yet.
                </p>
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
