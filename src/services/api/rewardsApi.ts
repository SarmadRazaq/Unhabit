import { apiSlice } from './api';

export const rewardsApi = apiSlice.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        getPoints: builder.query({
            query: () => '/rewards/points',
            providesTags: ['Rewards'],
        }),
        getPointsHistory: builder.query({
            query: () => '/rewards/points/history',
            providesTags: ['Rewards'],
        }),
        getBadges: builder.query({
            query: () => '/rewards/badges',
            providesTags: ['Rewards'],
        }),
        getAvailableBadges: builder.query({
            query: () => '/rewards/badges/available',
            providesTags: ['Rewards'],
        }),
        getAvailableRewards: builder.query({
            query: () => '/rewards/available',
            providesTags: ['Rewards'],
        }),
        getEarnedRewards: builder.query({
            query: () => '/rewards/earned',
            providesTags: ['Rewards'],
        }),
        getTodayXP: builder.query({
            query: () => '/rewards/xp/today',
            providesTags: ['Rewards'],
        }),
        getLevel: builder.query({
            query: () => '/rewards/level',
            providesTags: ['Rewards'],
        }),
        getBadgeGallery: builder.query({
            query: () => '/rewards/badges/gallery',
            providesTags: ['Rewards'],
        }),
        getNextBadge: builder.query({
            query: () => '/rewards/badges/next',
            providesTags: ['Rewards'],
        }),
    }),
});

export const {
    useGetPointsQuery,
    useGetPointsHistoryQuery,
    useGetBadgesQuery,
    useGetAvailableBadgesQuery,
    useGetAvailableRewardsQuery,
    useGetEarnedRewardsQuery,
    useGetTodayXPQuery,
    useGetLevelQuery,
    useGetBadgeGalleryQuery,
    useGetNextBadgeQuery,
} = rewardsApi;
