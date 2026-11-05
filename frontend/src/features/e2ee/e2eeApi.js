import { baseApi } from "../../services/baseApi";

export const e2eeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyE2eeKey: builder.query({
      query: () => ({
        url: "/v1/e2ee/keys/me",
      }),
      transformResponse: (response) => response.data,
      providesTags: ["E2eeKey"],
    }),
    createE2eeKey: builder.mutation({
      query: (body) => ({
        url: "/v1/e2ee/keys",
        method: "POST",
        body,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ["E2eeKey"],
    }),
    updateE2eeBackup: builder.mutation({
      query: (body) => ({
        url: "/v1/e2ee/keys/me/backup",
        method: "PUT",
        body,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ["E2eeKey"],
    }),
    getUserPublicKeys: builder.query({
      query: (userId) => ({
        url: `/v1/e2ee/keys/users/${userId}`,
      }),
      transformResponse: (response) => response.data || [],
      providesTags: (result, error, userId) => [
        { type: "E2eeKey", id: String(userId) },
      ],
    }),
  }),
});

export const {
  useGetMyE2eeKeyQuery,
  useLazyGetMyE2eeKeyQuery,
  useCreateE2eeKeyMutation,
  useUpdateE2eeBackupMutation,
  useGetUserPublicKeysQuery,
  useLazyGetUserPublicKeysQuery,
} = e2eeApi;

