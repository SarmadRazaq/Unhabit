import { apiSlice } from './api';

export const progressApi = apiSlice.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        completeTask: builder.mutation({
            query: (taskId) => ({
                url: `/progress/tasks/${taskId}/complete`,
                method: 'POST',
            }),
            invalidatesTags: ['Progress', 'Dashboard', 'Streaks', 'Rewards', 'Analytics', 'Journeys'],
        }),
        uncompleteTask: builder.mutation({
            query: (taskId) => ({
                url: `/progress/tasks/${taskId}/uncomplete`,
                method: 'POST',
            }),
            invalidatesTags: ['Progress', 'Dashboard', 'Streaks', 'Journeys'],
        }),
        getTasks: builder.query({
            query: () => '/progress/tasks',
            providesTags: ['Progress'],
        }),
        getJourneyProgress: builder.query({
            query: (journeyId) => `/progress/journeys/${journeyId}`,
            providesTags: ['Progress'],
        }),
        createReflection: builder.mutation({
            query: (reflectionData) => ({
                url: '/progress/reflections',
                method: 'POST',
                body: reflectionData,
            }),
            invalidatesTags: ['Progress'],
        }),
        getReflections: builder.query({
            query: (journeyDayId) => `/progress/reflections/${journeyDayId}`,
            providesTags: ['Progress'],
        }),
        reportSlip: builder.mutation({
            query: (slipData) => ({
                url: '/progress/slips',
                method: 'POST',
                body: slipData,
            }),
            invalidatesTags: ['Progress', 'Dashboard', 'Streaks', 'Recovery'],
        }),
        getSlips: builder.query({
            query: () => '/progress/slips',
            providesTags: ['Progress'],
        }),
        getTodayProgress: builder.query({
            query: () => '/progress/today',
            providesTags: ['Progress'],
        }),
        completeDay: builder.mutation({
            query: () => ({
                url: '/progress/complete-day',
                method: 'POST',
            }),
            invalidatesTags: ['Progress', 'Dashboard', 'Streaks', 'Rewards', 'Challenges', 'Journeys'],
        }),
        getSnapshot: builder.query({
            query: () => '/progress/snapshot',
            providesTags: ['Progress'],
        }),
    }),
});

export const {
    useCompleteTaskMutation,
    useUncompleteTaskMutation,
    useGetTasksQuery,
    useGetJourneyProgressQuery,
    useCreateReflectionMutation,
    useGetReflectionsQuery,
    useReportSlipMutation,
    useGetSlipsQuery,
    useGetTodayProgressQuery,
    useCompleteDayMutation,
    useGetSnapshotQuery,
} = progressApi;
