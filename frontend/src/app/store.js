import {configureStore} from "@reduxjs/toolkit"
import authReducer from "../features/auth/authSlice";
import chatReducer from "../features/chat/chatSlice";
import { baseApi } from "../services/baseApi";
export const store = configureStore({
    reducer: {
        auth: authReducer,
        chat: chatReducer,
        [baseApi.reducerPath]: baseApi.reducer,
    },

    middleware: (getDefaultMiddleware) => {
        const defaultMiddleware =
            getDefaultMiddleware();

        const allMiddleware =
            defaultMiddleware.concat(
                baseApi.middleware,
            );

        return allMiddleware;
    },
});