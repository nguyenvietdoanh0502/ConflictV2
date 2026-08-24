import { baseApi } from "../../services/baseApi";

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCurrentUser: builder.query({
      query: () => ({
        url: "/v1/users/me",
        method: "GET",
      }),
      providesTags: ["CurrentUser"],
    }),
    updateProfile: builder.mutation({
      query: ({ fullName, avatar, dateOfBirth, address, gender }) => {
        const formData = new FormData();
        formData.append("fullName", fullName.trim());
        formData.append("dateOfBirth", dateOfBirth || "");
        formData.append("address", address?.trim() ?? "");
        formData.append("gender", gender || "");

        if (avatar) {
          formData.append("avatar", avatar);
        }

        return {
          url: "/v1/user/update-profile",
          method: "PATCH",
          body: formData,
        };
      },
      invalidatesTags: ["CurrentUser"],
    }),
  }),
});

export const {
  useLazyGetCurrentUserQuery,
  useUpdateProfileMutation
} = userApi;
