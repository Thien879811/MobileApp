import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../redux/reducers/authReducers';
import customerReducer from '../redux/reducers/customerReducers';

const store = configureStore({
  reducer: {
    auth: authReducer,
    customer: customerReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
