import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './slices/themeSlice';
import uiReducer from './slices/uiSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    ui: uiReducer,
    auth: authReducer,
  },
});
