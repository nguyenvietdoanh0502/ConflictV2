import { baseApi } from "../../services/baseApi";

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: ({ page = 0, size = 20, unreadOnly = false } = {}) => ({
        url: "/v1/notifications",
        params: { page, size, unreadOnly },
      }),
      transformResponse: (response) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Notification", id })),
              { type: "Notification", id: "LIST" },
            ]
          : [{ type: "Notification", id: "LIST" }],
    }),

    getUnreadCount: builder.query({
      query: () => "/v1/notifications/unread-count",
      transformResponse: (response) => response.data?.unreadCount ?? 0,
      providesTags: [{ type: "NotificationUnreadCount", id: "COUNT" }],
    }),

    markAsRead: builder.mutation({
      query: (id) => ({
        url: `/v1/notifications/${id}/read`,
        method: "PATCH",
      }),
      invalidatesTags: [
        { type: "Notification", id: "LIST" },
        { type: "NotificationUnreadCount", id: "COUNT" },
      ],
    }),

    markAllAsRead: builder.mutation({
      query: () => ({
        url: "/v1/notifications/read-all",
        method: "POST",
      }),
      invalidatesTags: [
        { type: "Notification", id: "LIST" },
        { type: "NotificationUnreadCount", id: "COUNT" },
      ],
    }),

    deleteNotification: builder.mutation({
      query: (id) => ({
        url: `/v1/notifications/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "Notification", id: "LIST" },
        { type: "NotificationUnreadCount", id: "COUNT" },
      ],
    }),

    triggerTodaySchedule: builder.mutation({
      query: () => ({
        url: "/v1/notifications/trigger-today",
        method: "POST",
      }),
      invalidatesTags: [
        { type: "Notification", id: "LIST" },
        { type: "NotificationUnreadCount", id: "COUNT" },
      ],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  useTriggerTodayScheduleMutation,
} = notificationApi;
