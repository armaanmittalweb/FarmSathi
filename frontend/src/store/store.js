import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import farmerReducer from "./farmerSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    farmer: farmerReducer,
  },
});
