export const selectAuth = (state) => state.auth;

export const selectCurrentUser = (state) => state.auth.user;

export const selectAccessToken = (state) => state.auth.accessToken;

export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;

export const selectAuthInitialized = (state) => state.auth.isInitialized;

export const selectPasswordResetContext = (state) =>
  state.auth.passwordReset;