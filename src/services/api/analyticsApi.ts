import { apiSlice } from './api';

export const analyticsApi = apiSlice.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        getStreaks: builder.query({
            query: () => '/analytics/streaks',
            providesTags: ['Analytics', 'Streaks'],
        }),
        getIdentityScore: builder.query({
            query: () => '/analytics/identity-score',
            providesTags: ['Analytics'],
        }),
        getConsistency: builder.query({
            query: () => '/analytics/consistency',
            providesTags: ['Analytics'],
        }),
        getAdherence: builder.query({
            query: (journeyId) => `/analytics/adherence/${journeyId}`,
            providesTags: ['Analytics'],
        }),
        getInsights: builder.query({
            query: () => '/analytics/insights',
            providesTags: ['Analytics'],
        }),
        getHeatmap: builder.query({
            query: () => '/analytics/heatmap',
            providesTags: ['Analytics'],
        }),
        getDailyMetrics: builder.query({
            query: () => '/analytics/daily-metrics',
            providesTags: ['Analytics'],
        }),
        exportAnalytics: builder.query({
            query: () => '/analytics/export',
        }),
        getMissedDays: builder.query({
            query: () => '/analytics/missed-days',
            providesTags: ['Analytics'],
        }),
        getHabitHealthTrend: builder.query({
            query: () => '/analytics/habit-health-trend',
            providesTags: ['Analytics'],
        }),
    }),
});

export const {
    useGetStreaksQuery,
    useGetIdentityScoreQuery,
    useGetConsistencyQuery,
    useGetAdherenceQuery,
    useGetInsightsQuery,
    useGetHeatmapQuery,
    useGetDailyMetricsQuery,
    useExportAnalyticsQuery,
    useGetMissedDaysQuery,
    useGetHabitHealthTrendQuery,
} = analyticsApi;
