
// import { configureStore } from '@reduxjs/toolkit';
// import userReducer from './userSlice';
// import teamReducer from "./teamSlice";
// import statusReducer from "./teamStatus"
// export const store = configureStore({
//     reducer: {
//         userSlice: userReducer,
//         teamSlice: teamReducer,
//         teamStatusSlice: statusReducer,
//     },
// });



// store.js
import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage
import userReducer from './userSlice';
import teamReducer from "./teamSlice";
import statusReducer from "./teamStatus";

// In store.js
const userPersistConfig = {
    key: 'userSlice',
    storage,
    whitelist: ['signInFormData'] // only persist signInFormData
};

const rootReducer = combineReducers({
    userSlice: persistReducer(userPersistConfig, userReducer),
    teamSlice: teamReducer,
    teamStatusSlice: statusReducer,
});

// Main persist config (no need for transforms now)
const rootPersistConfig = {
    key: 'root',
    storage,
    whitelist: [] // we're handling persistence at the reducer level
};

const persistedReducer = persistReducer(rootPersistConfig, rootReducer);
// Create store
export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST'], // ignore redux-persist actions
            },
        }),
});

export const persistor = persistStore(store);


