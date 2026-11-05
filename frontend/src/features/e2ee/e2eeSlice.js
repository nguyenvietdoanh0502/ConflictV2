import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  status: "unknown", // "unknown" | "not_setup" | "locked" | "ready"
  keyVersion: null,
  promptDismissed: false,
  isSetupModalOpen: false,
  isUnlockModalOpen: false,
  unlockModalMode: "unlock", // "unlock" | "reset" | "change_pin"
};

const e2eeSlice = createSlice({
  name: "e2ee",
  initialState,
  reducers: {
    setE2eeState: (state, action) => {
      const { status, keyVersion } = action.payload || {};
      if (status) {
        state.status = status;
      }
      if (keyVersion !== undefined) {
        state.keyVersion = keyVersion;
      }
    },
    dismissE2eePrompt: (state) => {
      state.promptDismissed = true;
    },
    openE2eeSetupModal: (state) => {
      state.isSetupModalOpen = true;
    },
    closeE2eeSetupModal: (state) => {
      state.isSetupModalOpen = false;
    },
    openE2eeUnlockModal: (state, action) => {
      state.unlockModalMode = action.payload || "unlock";
      state.isUnlockModalOpen = true;
    },
    closeE2eeUnlockModal: (state) => {
      state.isUnlockModalOpen = false;
      state.unlockModalMode = "unlock";
    },
    resetE2eeState: () => initialState,
  },
});

export const {
  setE2eeState,
  dismissE2eePrompt,
  openE2eeSetupModal,
  closeE2eeSetupModal,
  openE2eeUnlockModal,
  closeE2eeUnlockModal,
  resetE2eeState,
} = e2eeSlice.actions;

export const selectE2eeStatus = (state) => state.e2ee.status;
export const selectE2eeKeyVersion = (state) => state.e2ee.keyVersion;
export const selectE2eePromptDismissed = (state) => state.e2ee.promptDismissed;
export const selectIsE2eeSetupModalOpen = (state) => state.e2ee.isSetupModalOpen;
export const selectIsE2eeUnlockModalOpen = (state) => state.e2ee.isUnlockModalOpen;
export const selectE2eeUnlockModalMode = (state) => state.e2ee.unlockModalMode;

export default e2eeSlice.reducer;

