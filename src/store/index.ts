import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import inventoryReducer from './slices/inventorySlice';
import outwardReducer from './slices/outwardSlice';
import stockMovementReducer from './slices/stockMovementSlice';
import stockControlReducer from './slices/stockControlSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    inventory: inventoryReducer,
    outward: outwardReducer,
    stockMovement: stockMovementReducer,
    stockControl: stockControlReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
