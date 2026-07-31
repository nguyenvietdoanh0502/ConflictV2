import { baseApi } from "../../services/baseApi";

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCurrentUser: builder.query({
      query: () => ({
        url: "/v1/users/me",
        method: "GET",
      }),
    }),
  }),
});

export const { useLazyGetCurrentUserQuery } = userApi;