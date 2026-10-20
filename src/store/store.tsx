import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from "redux-persist";
import authReducer, { authApi } from "./auth";
import chatReducer from "./chat";

const storage = {
  async getItem(key: string) {
    return window.localStorage.getItem(key);
  },
  async setItem(key: string, value: string) {
    window.localStorage.setItem(key, value);
  },
  async removeItem(key: string) {
    window.localStorage.removeItem(key);
  },
};

const rootReducer = combineReducers({
  auth: authReducer,
  chat: chatReducer,
  [authApi.reducerPath]: authApi.reducer,
});

const persistedReducer = persistReducer(
  {
    key: "green-api-root",
    version: 1,
    storage,
    whitelist: ["auth", "chat"],
  },
  rootReducer,
);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(authApi.middleware),
  devTools: false,
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
