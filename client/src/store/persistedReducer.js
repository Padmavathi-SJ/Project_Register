// Create a persistedReducer.js
import { combineReducers } from '@reduxjs/toolkit';
import storage from 'redux-persist/lib/storage';
import { persistReducer } from 'redux-persist';
import userReducer from './userSlice';
import teamReducer from "./teamSlice";
import statusReducer from "./teamStatus";

const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['userSlice'] // only persist userSlice
};

const rootReducer = combineReducers({
    userSlice: userReducer,
    teamSlice: teamReducer,
    teamStatusSlice: statusReducer,
});

export const persistedReducer = persistReducer(persistConfig, rootReducer);