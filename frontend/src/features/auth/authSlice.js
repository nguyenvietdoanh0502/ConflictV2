import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isInitialized: false,

    passwordReset:{
        email:null,
        resetToken:null,
    },
}
const authSlice = createSlice({
    name:"auth",
    initialState,
    reducers:{
        setCredentials: (state,action)=>{
            const {user,accessToken} = action.payload ?? {};

            state.user = user ?? null
            state.accessToken = accessToken ?? null
            state.isAuthenticated = Boolean(user || accessToken);
        },
        clearCredentials: (state)=>{
            state.user = null
            state.accessToken = null
            state.isAuthenticated = false

            state.passwordReset = {
                email:null,
                resetToken:null,
            }
        },
        setAuthInitialized: (state, action)=>{
            state.isInitialized = action.payload ?? true

        },
        setPasswordResetContext: (state,action)=>{
            state.passwordReset = {
                email: action.payload?.email ?? null,
                resetToken: action.payload?.resetToken ?? null
            }
        },
        clearPasswordResetContext: (state)=>{
            state.passwordReset = {
                email:null,
                resetToken: null,
            }
        },
        setAccessToken:(state,action)=>{
            state.accessToken = action.payload ?? null;
        },
        setCurrentUser: (state, action)=>{
            if(!action.payload){
                return;
            }
            state.user = action.payload;
            state.isAuthenticated = true;
        }
    }
})

export const {
    setCredentials,
    setCurrentUser,
    clearCredentials,
    setAuthInitialized,
    setPasswordResetContext,
    clearPasswordResetContext,
    setAccessToken,

}=authSlice.actions;

export default authSlice.reducer