import { createSlice } from "@reduxjs/toolkit";

const farmerSlice = createSlice({
  name: "farmer",
  initialState: { profile: null, lastWeather: null },
  reducers: {
    setProfile(state, action) {
      state.profile = action.payload;
    },
    setLastWeather(state, action) {
      state.lastWeather = action.payload;
    },
  },
});

export const { setProfile, setLastWeather } = farmerSlice.actions;
export default farmerSlice.reducer;
