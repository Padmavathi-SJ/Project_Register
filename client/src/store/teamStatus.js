import { createSlice } from "@reduxjs/toolkit";

const teamStatus = createSlice({
  name: "teamStatusSlice",
  initialState: null,
  reducers: {
    addTeamStatus: (state, action) => {
      return action.payload;
    },
    removeTeamStatus: (state,action) => {
      return null;
    }
  }
});

// Exporting the action and reducer
export const { addTeamStatus,removeTeamStatus } = teamStatus.actions;
export default teamStatus.reducer;
