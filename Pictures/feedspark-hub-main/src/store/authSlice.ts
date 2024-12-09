// src/store/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  email: string | null;
}

const initialState: AuthState = {
  email: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setEmail: (state, action: PayloadAction<string>) => {
        state.email = action.payload.replace(/"/g, ""); // Remove extra quotes
      },
      
    clearEmail: (state) => {
      state.email = null;
    },
  },
});

export const { setEmail, clearEmail } = authSlice.actions;

export default authSlice.reducer;
