import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { api } from "../api/greenApi";
import type { InstanceState } from "../api/greenApi";

export interface Credentials {
  idInstance: string;
  apiTokenInstance: string;
}

interface AuthState {
  credentials: Credentials | null;
}

const initialState: AuthState = { credentials: null };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<Credentials>) {
      state.credentials = action.payload;
    },
    logout: () => initialState,
  },
});
export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    checkCredentials: builder.mutation<InstanceState, Credentials>({
      query: ({ idInstance, apiTokenInstance }) => ({
        url: `waInstance${idInstance}/getStateInstance/${apiTokenInstance}`,
        method: "GET",
      }),
    }),
  }),
});
export const { setCredentials, logout } = authSlice.actions;
export const { useCheckCredentialsMutation } = authApi;
export default authSlice.reducer;
