import { baseApi } from "../../../services/baseApi";

export const studyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMaterials: builder.query({
      query: (subjectId) => {
        let url = "/v1/materials";
        if (subjectId) {
          url += `?subjectId=${subjectId}`;
        }
        return url;
      },
      transformResponse: (response) => response.data || [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Material", id })),
              { type: "Material", id: "LIST" },
            ]
          : [{ type: "Material", id: "LIST" }],
    }),

    getMaterialById: builder.query({
      query: (id) => `/v1/materials/${id}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: "Material", id }],
    }),

    uploadMaterial: builder.mutation({
      query: (formData) => ({
        url: "/v1/materials",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: [{ type: "Material", id: "LIST" }],
    }),

    deleteMaterial: builder.mutation({
      query: (id) => ({
        url: `/v1/materials/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Material", id: "LIST" }],
    }),

    regenerateMaterial: builder.mutation({
      query: (id) => ({
        url: `/v1/materials/${id}/regenerate`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Material", id },
        { type: "Material", id: "LIST" },
      ],
    }),

    generateMinigames: builder.mutation({
      query: (materialId) => ({
        url: `/v1/materials/${materialId}/generate-minigames`,
        method: "POST",
      }),
      invalidatesTags: (result, error, materialId) => [
        { type: "Material", id: materialId },
        { type: "Material", id: "LIST" },
      ],
    }),

    submitGameScore: builder.mutation({
      query: ({ materialId, ...body }) => ({
        url: `/v1/materials/${materialId}/scores`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { materialId }) => [
        { type: "GameScore", id: materialId },
      ],
    }),

    getLeaderboard: builder.query({
      query: ({ materialId, gameType = "SPEED_QUIZ" }) =>
        `/v1/materials/${materialId}/leaderboard?gameType=${gameType}`,
      transformResponse: (response) => response.data || [],
      providesTags: (result, error, { materialId }) => [
        { type: "GameScore", id: materialId },
      ],
    }),
  }),
});

export const {
  useGetMaterialsQuery,
  useGetMaterialByIdQuery,
  useUploadMaterialMutation,
  useDeleteMaterialMutation,
  useRegenerateMaterialMutation,
  useGenerateMinigamesMutation,
  useSubmitGameScoreMutation,
  useGetLeaderboardQuery,
} = studyApi;
