import { baseApi } from "../../services/baseApi";
export const authApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        register: builder.mutation({
            query: (body)=>({
                url: "/v1/auth/register",
                method: "POST",
                body,
            }),
        }),
        verifyOtp: builder.mutation({
            query: (body) => ({
                url: "/v1/auth/verify-otp",
                method: "POST",
                body,
            }),
        }),
        login: builder.mutation({
      query: (body) => ({
        url: "/v1/auth/login",
        method: "POST",
        body,
      }),
    }),

    refreshToken: builder.mutation({
      query: () => ({
        url: "/v1/auth/refresh-token",
        method: "POST",
      }),
    }),

    logout: builder.mutation({
      query: () => ({
        url: "/v1/auth/logout",
        method: "POST",
      }),
    }),

    forgotPassword: builder.mutation({
      query: (body) => ({
        url: "/v1/auth/forgot-password",
        method: "POST",
        body,
      }),
    }),

    verifyForgotPasswordOtp: builder.mutation({
      query: (body) => ({
        url: "/v1/auth/verify-otp-forgot-password",
        method: "POST",
        body,
      }),
    }),

    resetPassword: builder.mutation({
      query: (body) => ({
        url: "/v1/auth/reset-password",
        method: "POST",
        body,
      }),
    }),

    changePassword: builder.mutation({
      query: (body) => ({
        url: "/v1/auth/change-password",
        method: "POST",
        body,
      }),
    }),
    })
})
export const {
  useRegisterMutation,
  useVerifyOtpMutation,
  useLoginMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useVerifyForgotPasswordOtpMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
} = authApi;