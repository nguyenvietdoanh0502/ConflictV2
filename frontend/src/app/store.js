import {configureStore} from "@reduxjs/toolkit"
import authReducer from "../features/auth/authSlice";
import chatReducer from "../features/chat/chatSlice";
import e2eeReducer from "../features/e2ee/e2eeSlice";
import { baseApi } from "../services/baseApi";
export const store = configureStore({
    reducer: {
        auth: authReducer,
        chat: chatReducer,
        e2ee: e2eeReducer,
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
