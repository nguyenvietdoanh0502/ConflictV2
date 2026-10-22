import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  activeFriend: null, // { id, fullName, avatarUrl }
  isMinimized: false,
  unreadCounts: {}, // { [friendId]: count }
  isMobileContactsOpen: false,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    openChat: (state, action) => {
      const friend = action.payload;
      if (!friend) return;
      state.activeFriend = friend;
      state.isMinimized = false;
      state.isMobileContactsOpen = false;
      // Clear unread for this friend
      if (state.unreadCounts[friend.id]) {
        state.unreadCounts[friend.id] = 0;
      }
    },
    closeChat: (state) => {
      state.activeFriend = null;
      state.isMinimized = false;
    },
    toggleMinimize: (state) => {
      state.isMinimized = !state.isMinimized;
    },
    setMinimized: (state, action) => {
      state.isMinimized = action.payload;
    },
    setMobileContactsOpen: (state, action) => {
      state.isMobileContactsOpen = action.payload;
    },
    toggleMobileContacts: (state) => {
      state.isMobileContactsOpen = !state.isMobileContactsOpen;
    },
    incrementUnread: (state, action) => {
      const friendId = action.payload;
      if (!friendId) return;
      // Only increment if chat is not currently open with this friend
      if (state.activeFriend?.id !== friendId || state.isMinimized) {
        state.unreadCounts[friendId] = (state.unreadCounts[friendId] || 0) + 1;
      }
    },
    clearUnread: (state, action) => {
      const friendId = action.payload;
      if (friendId && state.unreadCounts[friendId]) {
        state.unreadCounts[friendId] = 0;
      }
    },
  },
});

export const {
  openChat,
  closeChat,
  toggleMinimize,
  setMinimized,
  setMobileContactsOpen,
  toggleMobileContacts,
  incrementUnread,
  clearUnread,
} = chatSlice.actions;

export const selectActiveFriend = (state) => state.chat.activeFriend;
export const selectIsChatMinimized = (state) => state.chat.isMinimized;
export const selectUnreadCounts = (state) => state.chat.unreadCounts;
export const selectTotalUnreadCount = (state) =>
  Object.values(state.chat.unreadCounts || {}).reduce((acc, count) => acc + count, 0);
export const selectIsMobileContactsOpen = (state) => state.chat.isMobileContactsOpen;

export default chatSlice.reducer;
