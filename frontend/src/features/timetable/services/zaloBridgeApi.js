/**
 * zaloBridgeApi.js
 *
 * RTK Query endpoints và helper wrappers cho Zalo Bridge — gọi qua Backend (authenticated).
 * Mọi request đều đi qua /api/v1/zalo/bridge/* với JWT authentication.
 */

import { baseApi } from "../../../services/baseApi";
import { store } from "../../../app/store";

export const zaloBridgeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/zalo/bridge/status
    getBridgeStatus: builder.query({
      query: () => "/v1/zalo/bridge/status",
      transformResponse: (response) => response.data,
      providesTags: ["ZaloBridgeStatus"],
    }),

    // POST /api/v1/zalo/bridge/qr/generate
    generateBridgeQr: builder.mutation({
      query: () => ({
        url: "/v1/zalo/bridge/qr/generate",
        method: "POST",
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ["ZaloBridgeStatus"],
    }),

    // POST /api/v1/zalo/bridge/logout
    logoutBridge: builder.mutation({
      query: () => ({
        url: "/v1/zalo/bridge/logout",
        method: "POST",
      }),
      invalidatesTags: ["ZaloBridgeStatus", "ZaloBridgeGroups"],
    }),

    // GET /api/v1/zalo/bridge/groups
    getBridgeGroups: builder.query({
      query: () => "/v1/zalo/bridge/groups",
      transformResponse: (response) => response.data || [],
      providesTags: ["ZaloBridgeGroups"],
    }),

    // POST /api/v1/zalo/bridge/groups/refresh
    refreshBridgeGroups: builder.mutation({
      query: () => ({
        url: "/v1/zalo/bridge/groups/refresh",
        method: "POST",
      }),
      transformResponse: (response) => response.data || [],
      invalidatesTags: ["ZaloBridgeGroups"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetBridgeStatusQuery,
  useGenerateBridgeQrMutation,
  useLogoutBridgeMutation,
  useGetBridgeGroupsQuery,
  useRefreshBridgeGroupsMutation,
} = zaloBridgeApi;

// Compatibility functions for components calling promise-based functions directly (e.g. WhitelistManager)
export async function fetchBridgeStatus() {
  try {
    const result = await store.dispatch(
      zaloBridgeApi.endpoints.getBridgeStatus.initiate(undefined, { forceRefetch: true })
    ).unwrap();
    return result;
  } catch (err) {
    console.warn("[ZaloBridgeApi] Status check failed:", err);
    return null;
  }
}

export async function fetchBridgeGroups() {
  try {
    const result = await store.dispatch(
      zaloBridgeApi.endpoints.getBridgeGroups.initiate(undefined, { forceRefetch: true })
    ).unwrap();
    return result || [];
  } catch (err) {
    console.warn("[ZaloBridgeApi] Fetch groups failed:", err);
    return [];
  }
}

export async function refreshBridgeGroups() {
  try {
    const result = await store.dispatch(
      zaloBridgeApi.endpoints.refreshBridgeGroups.initiate()
    ).unwrap();
    return result || [];
  } catch (err) {
    console.warn("[ZaloBridgeApi] Refresh groups failed:", err);
    return [];
  }
}

export async function generateBridgeQr() {
  return await store.dispatch(
    zaloBridgeApi.endpoints.generateBridgeQr.initiate()
  ).unwrap();
}

export async function logoutBridge() {
  return await store.dispatch(
    zaloBridgeApi.endpoints.logoutBridge.initiate()
  ).unwrap();
}

export async function switchBridgeMode() {
  return fetchBridgeStatus();
}
