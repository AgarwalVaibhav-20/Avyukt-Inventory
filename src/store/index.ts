import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import inventoryReducer from "./slices/inventorySlice";
import itemVariantReducer from "./slices/itemVariantSlice";
import masterReducer from "./slices/masterSlice";
import warehouseReducer from "./slices/warehouseSlice";
import outwardReducer from "./slices/outwardSlice";
import stockMovementReducer from "./slices/stockMovementSlice";
import stockControlReducer from "./slices/stockControlSlice";
import procurementReducer from "./slices/procurementSlice";
import barcodeReducer from "./slices/barcodeSlice";
import auditReducer from "./slices/auditSlice";
import advancedReducer from "./slices/advancedSlice";
import customerReducer from "./slices/customerSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    inventory: inventoryReducer,
    itemVariants: itemVariantReducer,
    master: masterReducer,
    warehouse: warehouseReducer,
    outward: outwardReducer,
    stockMovement: stockMovementReducer,
    stockControl: stockControlReducer,
    procurement: procurementReducer,
    barcode: barcodeReducer,
    audit: auditReducer,
    advanced: advancedReducer,
    customers: customerReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
