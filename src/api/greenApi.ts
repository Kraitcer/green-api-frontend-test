import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
// import type { Credentials } from "../store/auth";

export interface InstanceState {
  stateInstance: string;
}
const apiUrl = import.meta.env.VITE_GREEN_API_URL?.trim();

if (!apiUrl) {
  throw new Error("VITE_GREEN_API_URL is not configured");
}
export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: `${apiUrl.replace(/\/+$/, "")}/`,
  }),
  endpoints: () => ({}),
});
