// features/user/userSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
    checkAuthService,
    loginService,
    registerService
} from '@/services';
import {
    initialSignInFormData,
    initialSignUpFormData
} from '@/config';

// Async thunks (keeping original names)
export const checkAuthUser = createAsyncThunk(
    'user/checkAuth',
    async (_, { rejectWithValue }) => {
        try {
            const data = await checkAuthService();
            // console.log(data, "checkAuthUser userSlice");
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const registerUser = createAsyncThunk(
    'user/register',
    async (formData, { rejectWithValue }) => {
        console.log(formData, "Register userSlice");
        try {
            const data = await registerService(formData);
            console.log(data, "Register userSlice rsponse");
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const loginUser = createAsyncThunk(
    'user/login',
    async (formData, { rejectWithValue }) => {
        try {
            console.log(formData, "login userSlice");
            const data = await loginService(formData);
            console.log(data, "login userSlice rsponse");
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

const userSlice = createSlice({
    name: 'user', // Changed to 'user'
    initialState: {
        signInFormData: initialSignInFormData,
        signUpFormData: initialSignUpFormData,
        auth: {
            authenticate: false,
            user: null,
        },
        loading: false,
        error: null,
    },
    reducers: {
        updateSignInFormData: (state, action) => {
            state.signInFormData = { ...state.signInFormData, ...action.payload };
        },
        updateSignUpFormData: (state, action) => {
            state.signUpFormData = { ...state.signUpFormData, ...action.payload };
        },
        resetSignInFormData: (state) => {
            state.signInFormData = initialSignInFormData;
        },
        resetSignUpFormData: (state) => {
            state.signUpFormData = initialSignUpFormData;
        },
        resetCredentials: (state) => {
            state.auth = {
                authenticate: false,
                user: null,
            };
        },
        removeUser: (state) => {
            state.auth = {
                authenticate: false,
                user: null,
            };
        },
        addUser: (state, action) => {
            state.auth = {
                authenticate: true,
                user: action.payload,
            };
        },

        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Check Auth User
            .addCase(checkAuthUser.pending, (state) => {
                state.loading = true;
            })
            .addCase(checkAuthUser.fulfilled, (state, action) => {
                state.loading = false;
                // console.log(action.payload, "action.payload.data");
                if (action.payload.success) {
                    state.auth = {
                        authenticate: true,
                        // user: action.payload,
                        user: action.payload.data,
                    };
                } else {
                    state.auth = {
                        authenticate: false,
                        user: null,
                    };
                }
            })
            .addCase(checkAuthUser.rejected, (state, action) => {
                state.loading = false;
                state.auth = {
                    authenticate: false,
                    user: null,
                };
                state.error = action.payload;
            })

            // Register User
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
            })
            .addCase(registerUser.fulfilled, (state) => {
                state.loading = false;
                state.signUpFormData = initialSignUpFormData;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Login User
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.success) {
                    state.auth = {
                        authenticate: true,
                        user: action.payload.data.user,
                    };
                    state.signInFormData = initialSignInFormData;
                }
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

// Exporting the same action names as before
export const {
    updateSignInFormData,
    updateSignUpFormData,
    resetSignInFormData,
    resetSignUpFormData,
    resetCredentials,
    clearError,
    removeUser,
    addUser,
} = userSlice.actions;

export default userSlice.reducer;