import { createSlice } from "@reduxjs/toolkit";

const teamSlice = createSlice({
    name: "teamSlice",
    initialState: {
        data: [],  // Initialize as empty array
        loading: false,
        error: null
    },
    reducers: {
        addTeamMembers: (state, action) => {
            state.data = action.payload;  // Update the data array
            state.loading = false;
        },
        removeTeamMembers: (state) => {
            state.data = [];  // Reset to empty array
        },
        setTeamLoading: (state, action) => {
            state.loading = action.payload;
        },
        setTeamError: (state, action) => {
            state.error = action.payload;
        }
    }
});

export const { addTeamMembers, removeTeamMembers, setTeamLoading, setTeamError } = teamSlice.actions;
export default teamSlice.reducer;