import { apiSlice } from './api';

export const recoveryApi = apiSlice.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        getRecoveryStatus: builder.query({
            query: () => '/recovery/status',
            providesTags: ['Recovery'],
        }),
        continueWithPenalty: builder.mutation({
            query: () => ({
                url: '/recovery/continue-with-penalty',
                method: 'POST',
            }),
            invalidatesTags: ['Recovery', 'Streaks', 'Dashboard'],
        }),
        useProtection: builder.mutation({
            query: () => ({
                url: '/recovery/use-protection',
                method: 'POST',
            }),
            invalidatesTags: ['Recovery', 'Streaks', 'Dashboard'],
        }),
        restartPlan: builder.mutation({
            query: () => ({
                url: '/recovery/restart-plan',
                method: 'POST',
            }),
            invalidatesTags: ['Recovery', 'Journeys', 'Dashboard', 'Streaks'],
        }),
    }),
});

export const {
    useGetRecoveryStatusQuery,
    useContinueWithPenaltyMutation,
    useUseProtectionMutation,
    useRestartPlanMutation,
} = recoveryApi;
