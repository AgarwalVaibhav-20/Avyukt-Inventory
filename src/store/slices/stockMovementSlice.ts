import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { InventoryItem, Warehouse } from '@/types';
import { movementService } from '@/services/movementService';
import { productService } from '@/services/productService';
import { warehouseService } from '@/services/warehouseService';

const fetchAllMovementData = async () => {
  const [warehouses, items, transfers, internalMovements, adjustments, scrapEntries, consignments] =
    await Promise.all([
      warehouseService.getAllWarehouses(),
      productService.getAllItems(),
      warehouseService.getAllTransfers(),
      movementService.getInternalMovements(),
      movementService.getAdjustments(),
      movementService.getScrapEntries(),
      movementService.getConsignmentEntries(),
    ]);

  const consignmentTotals = consignments.reduce<Record<string, number>>((acc, entry) => {
    const current = acc[entry.itemId] || 0;
    acc[entry.itemId] =
      entry.type === 'Outward' ? current + entry.quantity : Math.max(0, current - entry.quantity);
    return acc;
  }, {});

  const itemsWithConsignment = items.map((item) => ({
    ...item,
    consignmentStock: consignmentTotals[item.id] || 0,
  }));

  return {
    warehouses,
    items: itemsWithConsignment,
    transfers,
    internalMovements,
    adjustments,
    scrapEntries,
    consignments,
  };
};

interface StockMovementState {
  warehouses: Warehouse[];
  items: InventoryItem[];
  transfers: any[];
  internalMovements: any[];
  adjustments: any[];
  scrapEntries: any[];
  consignments: any[];
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
}

const initialState: StockMovementState = {
  warehouses: [],
  items: [],
  transfers: [],
  internalMovements: [],
  adjustments: [],
  scrapEntries: [],
  consignments: [],
  loading: false,
  actionLoading: false,
  error: null,
};

export const fetchStockMovementData = createAsyncThunk(
  'stockMovement/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchAllMovementData();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load stock movement data');
    }
  }
);

export const createWarehouseTransfer = createAsyncThunk(
  'stockMovement/createTransfer',
  async (payload: any, { rejectWithValue }) => {
    try {
      await warehouseService.createTransfer(payload);
      return await fetchAllMovementData();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create transfer');
    }
  }
);

export const createInternalMovementEntry = createAsyncThunk(
  'stockMovement/createInternal',
  async (payload: any, { rejectWithValue }) => {
    try {
      await movementService.createInternalMovement(payload);
      return await fetchAllMovementData();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create internal movement');
    }
  }
);

export const createStockAdjustmentEntry = createAsyncThunk(
  'stockMovement/createAdjustment',
  async (payload: any, { rejectWithValue }) => {
    try {
      await movementService.createAdjustment(payload);
      return await fetchAllMovementData();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create stock adjustment');
    }
  }
);

export const createScrapMovementEntry = createAsyncThunk(
  'stockMovement/createScrap',
  async (payload: any, { rejectWithValue }) => {
    try {
      await movementService.createScrapEntry(payload);
      return await fetchAllMovementData();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create scrap entry');
    }
  }
);

export const createConsignmentEntry = createAsyncThunk(
  'stockMovement/createConsignment',
  async (payload: any, { rejectWithValue }) => {
    try {
      await movementService.createConsignment(payload);
      return await fetchAllMovementData();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create consignment entry');
    }
  }
);

const applyPayload = (state: StockMovementState, payload: any) => {
  state.warehouses = payload.warehouses;
  state.items = payload.items;
  state.transfers = payload.transfers;
  state.internalMovements = payload.internalMovements;
  state.adjustments = payload.adjustments;
  state.scrapEntries = payload.scrapEntries;
  state.consignments = payload.consignments;
};

const stockMovementSlice = createSlice({
  name: 'stockMovement',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStockMovementData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStockMovementData.fulfilled, (state, action) => {
        state.loading = false;
        applyPayload(state, action.payload);
      })
      .addCase(fetchStockMovementData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    [
      createWarehouseTransfer,
      createInternalMovementEntry,
      createStockAdjustmentEntry,
      createScrapMovementEntry,
      createConsignmentEntry,
    ].forEach((thunk) => {
      builder
        .addCase(thunk.pending, (state) => {
          state.actionLoading = true;
          state.error = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.actionLoading = false;
          applyPayload(state, action.payload);
        })
        .addCase(thunk.rejected, (state, action) => {
          state.actionLoading = false;
          state.error = action.payload as string;
        });
    });
  },
});

export default stockMovementSlice.reducer;
