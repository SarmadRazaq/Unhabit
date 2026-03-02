import { apiSlice } from './api';

export const focusApi = apiSlice.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        startFocus: builder.mutation({
            query: (data) => ({
                url: '/focus/start',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Focus'],
        }),
        stopFocus: builder.mutation({
            query: (data) => ({
                url: '/focus/stop',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Focus', 'Dashboard', 'Progress'],
        }),
        cancelFocus: builder.mutation({
            query: (data) => ({
                url: '/focus/cancel',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Focus'],
        }),
        logFocus: builder.mutation({
            query: (data) => ({
                url: '/focus/log',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Focus', 'Dashboard', 'Progress'],
        }),
        getFocusHistory: builder.query({
            query: () => '/focus/history',
            providesTags: ['Focus'],
        }),
        getFocusStats: builder.query({
            query: () => '/focus/stats',
            providesTags: ['Focus'],
        }),
        getActiveFocus: builder.query({
            query: () => '/focus/active',
            providesTags: ['Focus'],
        }),
    }),
});

export const {
    useStartFocusMutation,
    useStopFocusMutation,
    useCancelFocusMutation,
    useLogFocusMutation,
    useGetFocusHistoryQuery,
    useGetFocusStatsQuery,
    useGetActiveFocusQuery,
} = focusApi;
