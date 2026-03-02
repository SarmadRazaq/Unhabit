import { apiSlice } from './api';

export const streaksApi = apiSlice.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        getStreakDetails: builder.query({
            query: () => '/streaks/details',
            providesTags: ['Streaks'],
        }),
        freezeStreak: builder.mutation({
            query: () => ({
                url: '/streaks/freeze',
                method: 'POST',
            }),
            invalidatesTags: ['Streaks', 'Dashboard'],
        }),
        purchaseStreakFreeze: builder.mutation({
            query: () => ({
                url: '/streaks/freeze/purchase',
                method: 'POST',
            }),
            invalidatesTags: ['Streaks', 'Rewards'],
        }),
        getStreakStatusDetails: builder.query({
            query: () => '/streaks/status',
            providesTags: ['Streaks'],
        }),
        getHabitHealth: builder.query({
            query: () => '/streaks/habit-health',
            providesTags: ['Streaks'],
        }),
        getAvailableFreezes: builder.query({
            query: () => '/streaks/freeze/available',
            providesTags: ['Streaks'],
        }),
        resetStreak: builder.mutation({
            query: () => ({
                url: '/streaks/reset',
                method: 'POST',
            }),
            invalidatesTags: ['Streaks'],
        }),

    }),
});

export const {
    useGetStreakDetailsQuery,
    useFreezeStreakMutation,
    usePurchaseStreakFreezeMutation,
    useGetStreakStatusDetailsQuery,
    useGetHabitHealthQuery,
    useGetAvailableFreezesQuery,
    useResetStreakMutation,
} = streaksApi;
