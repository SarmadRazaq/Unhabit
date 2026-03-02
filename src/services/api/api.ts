import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import * as SecureStore from 'expo-secure-store';
import { APP_CONFIG } from '../../constants/config';
import { setCredentials, logout } from '../../store/auth/authSlice';

/** Default request timeout in milliseconds (high to accommodate AI/LLM calls) */
const REQUEST_TIMEOUT_MS = 60_000;

const rawBaseQuery = fetchBaseQuery({
    baseUrl: APP_CONFIG.apiBaseUrl,
    timeout: REQUEST_TIMEOUT_MS,
    prepareHeaders: async (headers) => {
        const token = await SecureStore.getItemAsync('userToken');
        if (token) {
            headers.set('authorization', `Bearer ${token}`);
        }
        return headers;
    },
});

/**
 * Wraps fetchBaseQuery with automatic 401 handling:
 * 1. If a request returns 401, attempt to refresh the token
 * 2. If refresh succeeds, retry the original request
 * 3. If refresh fails, log the user out
 * 4. Concurrent 401s are queued and retried after the refresh completes
 */
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(null);
        }
    });
    failedQueue = [];
};

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
    args,
    api,
    extraOptions
) => {
    let result = await rawBaseQuery(args, api, extraOptions);

    if (result.error && result.error.status === 401) {
        // Avoid infinite loops — don't retry refresh endpoint itself
        const url = typeof args === 'string' ? args : args.url;
        if (url === '/auth/refresh' || url === '/auth/login') {
            return result;
        }

        if (isRefreshing) {
            // Another request is already refreshing — wait for it to finish
            try {
                await new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                });
                // Refresh succeeded — retry this request with fresh token
                result = await rawBaseQuery(args, api, extraOptions);
            } catch {
                // Refresh failed — return the original 401 error
                return result;
            }
        } else {
            isRefreshing = true;
            try {
                const refreshToken = await SecureStore.getItemAsync('refreshToken');

                if (refreshToken) {
                    const refreshResult = await rawBaseQuery(
                        {
                            url: '/auth/refresh',
                            method: 'POST',
                            body: { refresh_token: refreshToken },
                        },
                        api,
                        extraOptions
                    );

                    if (refreshResult.data) {
                        const data = refreshResult.data as any;
                        // Store new tokens
                        await SecureStore.setItemAsync('userToken', data.access_token);
                        if (data.refresh_token) {
                            await SecureStore.setItemAsync('refreshToken', data.refresh_token);
                        }
                        // Update Redux state
                        api.dispatch(
                            setCredentials({
                                user: data.user,
                                token: data.access_token,
                                refreshToken: data.refresh_token,
                            })
                        );
                        // Resolve all queued requests so they retry
                        processQueue();
                        // Retry the original request with new token
                        result = await rawBaseQuery(args, api, extraOptions);
                    } else {
                        // Refresh failed — force logout and reject all queued
                        processQueue(new Error('Token refresh failed'));
                        api.dispatch(logout());
                    }
                } else {
                    // No refresh token available — force logout
                    processQueue(new Error('No refresh token'));
                    api.dispatch(logout());
                }
            } finally {
                isRefreshing = false;
            }
        }
    }

    return result;
};

/**
 * Unwrap the standard backend envelope { success, data } so
 * consumers receive the inner payload directly.
 * Auth endpoints that don't use the wrapper pass through unchanged.
 */
const baseQueryUnwrapped: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
    args, api, extraOptions
) => {
    const result = await baseQueryWithReauth(args, api, extraOptions);
    if (
        result.data &&
        typeof result.data === 'object' &&
        'success' in (result.data as Record<string, unknown>) &&
        'data' in (result.data as Record<string, unknown>)
    ) {
        return { ...result, data: (result.data as Record<string, unknown>).data };
    }
    return result;
};

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryUnwrapped,
    tagTypes: [
        'Dashboard',
        'Habits',
        'Journeys',
        'Progress',
        'Analytics',
        'Notifications',
        'Coach',
        'Rewards',
        'Settings',
        'Buddies',
        'Streaks',
        'Leaderboard',
        'Focus',
        'Recovery',
        'Challenges',
        'User',
    ],
    endpoints: () => ({}),
});
