import { createSlice } from "@reduxjs/toolkit";

const loadInitialState = () => {
  try {
    const token = localStorage.getItem("farmsathi_token");
    const farmer = JSON.parse(localStorage.getItem("farmsathi_farmer") || "null");
    return { token: token || null, farmer, isAuthenticated: !!token };
  } catch {
    return { token: null, farmer: null, isAuthenticated: false };
  }
};

const authSlice = createSlice({
  name: "auth",
  initialState: loadInitialState(),
  reducers: {
    loginSuccess(state, action) {
      state.token = action.payload.token;
      state.farmer = action.payload.farmer;
      state.isAuthenticated = true;
      try {
        localStorage.setItem("farmsathi_token", action.payload.token);
        localStorage.setItem("farmsathi_farmer", JSON.stringify(action.payload.farmer));
      } catch {
        // ignore storage failures (private browsing, quota, etc.)
      }
    },
    logout(state) {
      state.token = null;
      state.farmer = null;
      state.isAuthenticated = false;
      try {
        localStorage.removeItem("farmsathi_token");
        localStorage.removeItem("farmsathi_farmer");
      } catch {
        // ignore
      }
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
