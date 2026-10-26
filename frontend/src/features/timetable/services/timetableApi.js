import { baseApi } from "../../../services/baseApi";

export const timetableApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Subjects
    getSubjects: builder.query({
      query: () => "/v1/subjects",
      transformResponse: (response) => response.data || [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Subject", id })),
              { type: "Subject", id: "LIST" },
            ]
          : [{ type: "Subject", id: "LIST" }],
    }),

    createSubject: builder.mutation({
      query: (body) => ({
        url: "/v1/subjects",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Subject", id: "LIST" },
        { type: "ScheduleEvent", id: "LIST" },
      ],
    }),

    deleteSubject: builder.mutation({
      query: (id) => ({
        url: `/v1/subjects/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "Subject", id: "LIST" },
        { type: "ZaloMapping", id: "LIST" },
        { type: "ScheduleEvent", id: "LIST" },
      ],
    }),

    // Zalo Mappings
    getZaloMappings: builder.query({
      query: () => "/v1/zalo/mappings",
      transformResponse: (response) => response.data || [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "ZaloMapping", id })),
              { type: "ZaloMapping", id: "LIST" },
            ]
          : [{ type: "ZaloMapping", id: "LIST" }],
    }),

    createZaloMapping: builder.mutation({
      query: (body) => ({
        url: "/v1/zalo/mappings",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "ZaloMapping", id: "LIST" }],
    }),

    toggleZaloMapping: builder.mutation({
      query: (id) => ({
        url: `/v1/zalo/mappings/${id}/toggle`,
        method: "PATCH",
      }),
      invalidatesTags: [{ type: "ZaloMapping", id: "LIST" }],
    }),

    deleteZaloMapping: builder.mutation({
      query: (id) => ({
        url: `/v1/zalo/mappings/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "ZaloMapping", id: "LIST" }],
    }),

    // Schedule Events
    getScheduleEvents: builder.query({
      query: (params) => {
        let url = "/v1/schedule/events";
        const queryParams = new URLSearchParams();
        if (params?.from) queryParams.set("from", params.from);
        if (params?.to) queryParams.set("to", params.to);
        const qs = queryParams.toString();
        return qs ? `${url}?${qs}` : url;
      },
      transformResponse: (response) => response.data || [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "ScheduleEvent", id })),
              { type: "ScheduleEvent", id: "LIST" },
            ]
          : [{ type: "ScheduleEvent", id: "LIST" }],
    }),

    createScheduleEvent: builder.mutation({
      query: (body) => ({
        url: "/v1/schedule/events",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "ScheduleEvent", id: "LIST" }],
    }),

    confirmScheduleEvent: builder.mutation({
      query: (id) => ({
        url: `/v1/schedule/events/${id}/confirm`,
        method: "POST",
      }),
      invalidatesTags: [{ type: "ScheduleEvent", id: "LIST" }],
    }),

    rejectScheduleEvent: builder.mutation({
      query: (id) => ({
        url: `/v1/schedule/events/${id}/reject`,
        method: "POST",
      }),
      invalidatesTags: [{ type: "ScheduleEvent", id: "LIST" }],
    }),

    deleteScheduleEvent: builder.mutation({
      query: (id) => ({
        url: `/v1/schedule/events/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "ScheduleEvent", id: "LIST" }],
    }),

    // Simulator
    simulateZaloMessage: builder.mutation({
      query: (body) => ({
        url: "/v1/zalo/simulate",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "ScheduleEvent", id: "LIST" },
        { type: "ZaloMapping", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetSubjectsQuery,
  useCreateSubjectMutation,
  useDeleteSubjectMutation,
  useGetZaloMappingsQuery,
  useCreateZaloMappingMutation,
  useToggleZaloMappingMutation,
  useDeleteZaloMappingMutation,
  useGetScheduleEventsQuery,
  useCreateScheduleEventMutation,
  useConfirmScheduleEventMutation,
  useRejectScheduleEventMutation,
  useDeleteScheduleEventMutation,
  useSimulateZaloMessageMutation,
} = timetableApi;
