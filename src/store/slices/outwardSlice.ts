import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { salesService } from '@/services/salesService';
import { SalesOrder } from '@/types';

interface WorkflowPickItem {
  productId: string;
  description: string;
  sku: string;
  location: string;
  required: number;
  picked: number;
}

interface WorkflowPickList {
  id: string;
  pickListNo: string;
  salesOrderId: string;
  soNumber: string;
  assignedTo: string;
  priority: string;
  status: string;
  items: WorkflowPickItem[];
  createdAt?: string;
}

interface WorkflowPackingOrder {
  id: string;
  salesOrderId: string;
  pickListId: string;
  soNumber: string;
  customer: string;
  assignedTo: string;
  status: string;
  packedAt?: string;
  items: {
    productId: string;
    description: string;
    qtyOrdered: number;
    qtyPacked: number;
    packed: boolean;
  }[];
  createdAt?: string;
}

interface WorkflowChallan {
  id: string;
  challanNo: string;
  soReference: string;
  customer: string;
  status: string;
  generatedOn?: string;
  transporter?: string;
  vehicleNo?: string;
  packingOrderIds: string[];
  items: {
    description: string;
    packedQty: number;
    unit: string;
  }[];
}

interface WorkflowDispatch {
  id: string;
  dispatchNo: string;
  deliveryChallanId: string;
  challanRef: string;
  shipmentRef: string;
  customer: string;
  transporter: string;
  vehicleNo: string;
  status: string;
  dispatchedOn?: string;
}

interface OutwardState {
  salesOrders: SalesOrder[];
  pickLists: WorkflowPickList[];
  packingOrders: WorkflowPackingOrder[];
  challans: WorkflowChallan[];
  dispatches: WorkflowDispatch[];
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
}

const initialState: OutwardState = {
  salesOrders: [],
  pickLists: [],
  packingOrders: [],
  challans: [],
  dispatches: [],
  loading: false,
  actionLoading: false,
  error: null,
};

export const fetchOutwardWorkflow = createAsyncThunk(
  'outward/fetchWorkflow',
  async (_, { rejectWithValue }) => {
    try {
      const [salesOrders, pickLists, packingOrders, challans, dispatches] =
        await Promise.all([
          salesService.getWorkflowSalesOrders(),
          salesService.getWorkflowPickLists(),
          salesService.getWorkflowPackingOrders(),
          salesService.getWorkflowChallans(),
          salesService.getWorkflowDispatches(),
        ]);

      return { salesOrders, pickLists, packingOrders, challans, dispatches };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load outward workflow');
    }
  }
);

export const createSalesOrder = createAsyncThunk(
  'outward/createSalesOrder',
  async (payload: Omit<SalesOrder, 'id' | 'soNumber' | 'status'>, { rejectWithValue }) => {
    try {
      await salesService.createSO(payload);
      return await Promise.all([
        salesService.getWorkflowSalesOrders(),
        salesService.getWorkflowPickLists(),
        salesService.getWorkflowPackingOrders(),
        salesService.getWorkflowChallans(),
        salesService.getWorkflowDispatches(),
      ]);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create sales order');
    }
  }
);

export const createPickList = createAsyncThunk(
  'outward/createPickList',
  async (salesOrder: SalesOrder, { rejectWithValue }) => {
    try {
      await salesService.createWorkflowPickList(salesOrder);
      return await Promise.all([
        salesService.getWorkflowSalesOrders(),
        salesService.getWorkflowPickLists(),
        salesService.getWorkflowPackingOrders(),
        salesService.getWorkflowChallans(),
        salesService.getWorkflowDispatches(),
      ]);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create pick list');
    }
  }
);

export const completePickList = createAsyncThunk(
  'outward/completePickList',
  async (pickList: WorkflowPickList, { rejectWithValue }) => {
    try {
      await salesService.completeWorkflowPickList(pickList);
      return await Promise.all([
        salesService.getWorkflowSalesOrders(),
        salesService.getWorkflowPickLists(),
        salesService.getWorkflowPackingOrders(),
        salesService.getWorkflowChallans(),
        salesService.getWorkflowDispatches(),
      ]);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to complete pick list');
    }
  }
);

export const createPackingOrder = createAsyncThunk(
  'outward/createPackingOrder',
  async (
    payload: { pickList: WorkflowPickList; salesOrder: SalesOrder },
    { rejectWithValue }
  ) => {
    try {
      await salesService.createWorkflowPackingOrder(payload.pickList, payload.salesOrder);
      return await Promise.all([
        salesService.getWorkflowSalesOrders(),
        salesService.getWorkflowPickLists(),
        salesService.getWorkflowPackingOrders(),
        salesService.getWorkflowChallans(),
        salesService.getWorkflowDispatches(),
      ]);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create packing order');
    }
  }
);

export const createChallan = createAsyncThunk(
  'outward/createChallan',
  async (packingOrder: WorkflowPackingOrder, { rejectWithValue }) => {
    try {
      await salesService.createWorkflowChallan(packingOrder);
      return await Promise.all([
        salesService.getWorkflowSalesOrders(),
        salesService.getWorkflowPickLists(),
        salesService.getWorkflowPackingOrders(),
        salesService.getWorkflowChallans(),
        salesService.getWorkflowDispatches(),
      ]);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create challan');
    }
  }
);

export const createDispatch = createAsyncThunk(
  'outward/createDispatch',
  async (
    payload: { challan: WorkflowChallan; packingOrder?: WorkflowPackingOrder },
    { rejectWithValue }
  ) => {
    try {
      await salesService.createWorkflowDispatch(payload.challan, payload.packingOrder);
      return await Promise.all([
        salesService.getWorkflowSalesOrders(),
        salesService.getWorkflowPickLists(),
        salesService.getWorkflowPackingOrders(),
        salesService.getWorkflowChallans(),
        salesService.getWorkflowDispatches(),
      ]);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create dispatch');
    }
  }
);

const applyWorkflowPayload = (state: OutwardState, payload: any[]) => {
  const [salesOrders, pickLists, packingOrders, challans, dispatches] = payload;
  state.salesOrders = salesOrders;
  state.pickLists = pickLists;
  state.packingOrders = packingOrders;
  state.challans = challans;
  state.dispatches = dispatches;
};

const outwardSlice = createSlice({
  name: 'outward',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOutwardWorkflow.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOutwardWorkflow.fulfilled, (state, action) => {
        state.loading = false;
        state.salesOrders = action.payload.salesOrders;
        state.pickLists = action.payload.pickLists;
        state.packingOrders = action.payload.packingOrders;
        state.challans = action.payload.challans;
        state.dispatches = action.payload.dispatches;
      })
      .addCase(fetchOutwardWorkflow.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createSalesOrder.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createSalesOrder.fulfilled, (state, action) => {
        state.actionLoading = false;
        applyWorkflowPayload(state, action.payload);
      })
      .addCase(createSalesOrder.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createPickList.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createPickList.fulfilled, (state, action) => {
        state.actionLoading = false;
        applyWorkflowPayload(state, action.payload);
      })
      .addCase(createPickList.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })
      .addCase(completePickList.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(completePickList.fulfilled, (state, action) => {
        state.actionLoading = false;
        applyWorkflowPayload(state, action.payload);
      })
      .addCase(completePickList.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createPackingOrder.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createPackingOrder.fulfilled, (state, action) => {
        state.actionLoading = false;
        applyWorkflowPayload(state, action.payload);
      })
      .addCase(createPackingOrder.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createChallan.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createChallan.fulfilled, (state, action) => {
        state.actionLoading = false;
        applyWorkflowPayload(state, action.payload);
      })
      .addCase(createChallan.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createDispatch.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createDispatch.fulfilled, (state, action) => {
        state.actionLoading = false;
        applyWorkflowPayload(state, action.payload);
      })
      .addCase(createDispatch.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });
  },
});

export default outwardSlice.reducer;
