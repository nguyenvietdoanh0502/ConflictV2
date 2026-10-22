import { baseApi } from "../../services/baseApi";

export const chatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getChatHistory: builder.query({
      query: ({ friendUserId, page = 0, size = 30 }) => ({
        url: `/v1/chat/${friendUserId}/messages`,
        params: { page, size },
      }),
      transformResponse: (response) => response.data,
      providesTags: (result, error, { friendUserId }) => [
        { type: "ChatHistory", id: friendUserId },
      ],
    }),
  }),
});

export const {
  useGetChatHistoryQuery,
  useLazyGetChatHistoryQuery,
} = chatApi;
