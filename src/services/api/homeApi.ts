import { apiSlice } from './api';

export const homeApi = apiSlice.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        getDashboard: builder.query({
            query: () => '/home/dashboard',
            providesTags: ['Dashboard'],
        }),
        getStreakStatus: builder.query({
            query: () => '/home/streak-status',
            providesTags: ['Dashboard', 'Streaks'],
        }),
    }),
});

export const { useGetDashboardQuery, useGetStreakStatusQuery } = homeApi;
