import { createSlice, createListenerMiddleware, PayloadAction } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';

export interface AuthUser {
    id: string;
    email?: string;
    name?: string;
    avatar_url?: string;
    full_name?: string;
    provider?: string;
    created_at?: string;
    app_metadata?: Record<string, unknown>;
}

interface AuthState {
    user: AuthUser | null;
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
}

const initialState: AuthState = {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (
            state,
            action: PayloadAction<{ user: AuthUser; token: string; refreshToken?: string }>
        ) => {
            const { user, token, refreshToken } = action.payload;
            state.user = user;
            state.token = token;
            state.isAuthenticated = true;
            if (refreshToken) {
                state.refreshToken = refreshToken;
            }
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
        },
    },
});

export const { setCredentials, logout } = authSlice.actions;

// Listener middleware — handles async SecureStore side effects outside the reducer
export const authListenerMiddleware = createListenerMiddleware();

authListenerMiddleware.startListening({
    actionCreator: setCredentials,
    effect: async (action) => {
        try {
            await SecureStore.setItemAsync('userToken', action.payload.token);
            if (action.payload.refreshToken) {
                await SecureStore.setItemAsync('refreshToken', action.payload.refreshToken);
            }
        } catch (e) {
            if (__DEV__) console.warn('Failed to persist auth tokens:', e);
        }
    },
});

authListenerMiddleware.startListening({
    actionCreator: logout,
    effect: async () => {
        try {
            await SecureStore.deleteItemAsync('userToken');
            await SecureStore.deleteItemAsync('refreshToken');
        } catch (e) {
            if (__DEV__) console.warn('Failed to clear auth tokens:', e);
        }
    },
});

export default authSlice.reducer;
