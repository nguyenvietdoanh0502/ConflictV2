import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react"
import {Mutex} from "async-mutex"
import { clearCredentials, setAccessToken } from "../features/auth/authSlice"

const mutex = new Mutex();
const PUBLIC_AUTH_URLS = new Set([
  "/v1/auth/register",
  "/v1/auth/login",
  "/v1/auth/verify-otp",
  "/v1/auth/refresh-token",
  "/v1/auth/forgot-password",
  "/v1/auth/verify-otp-forgot-password",
  "/v1/auth/reset-password",
]);

const rawBaseQuery = fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,

    credentials: "include",

    prepareHeaders: (headers, {getState})=>{
        const accessToken = getState().auth.accessToken;

        if(accessToken){
            headers.set("Authorization",`Bearer ${accessToken}`,);
        }
        return headers;
    }
    
})
function getRequestUrl(args){
    return typeof args === "string" ? args : args.url;
}

const baseQueryWithReauth = async(
    args,
    api,
    extraOptions,
)=>{
    await mutex.waitForUnlock();
    let result = await rawBaseQuery(
        args,
        api,
        extraOptions,
    )
    const requestUrl = getRequestUrl(args)
    const shouldRefresh = 
        result.error?.status === 401 &&
        !PUBLIC_AUTH_URLS.has(requestUrl);
    if(!shouldRefresh){
        return result;
    }
    if(!mutex.isLocked()){
        const release = await mutex.acquire();
        try {
            const refreshResult = await rawBaseQuery({
                url:"/v1/auth/refresh-token",
                method:"POST",
            },
            api,
            extraOptions,
        );
        const newAccessToken = refreshResult.data?.data?.accessToken;
        if(newAccessToken){
            api.dispatch(setAccessToken(newAccessToken));
            result = await rawBaseQuery(
                args,
                api,
                extraOptions,
            );
        }
        else{
            api.dispatch(clearCredentials())
        }
        } finally{
            release();
        }
    } else{
        await mutex.waitForUnlock();
        if(api.getState().auth.accessToken){
            result = await rawBaseQuery(
                args,
                api,
                extraOptions,
            );
        }
    }
    return result;
}

export const baseApi = createApi({
    reducerPath: "baseApi",
    baseQuery: baseQueryWithReauth,
    tagTypes: ["CurrentUser", "Friend", "FriendRequest"],
    endpoints: ()=>({}),
})

