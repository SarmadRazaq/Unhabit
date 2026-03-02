import { apiSlice } from './api';

export const leaderboardApi = apiSlice.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        getLeaderboard: builder.query({
            query: () => '/leaderboard',
            providesTags: ['Leaderboard'],
        }),
        getDailyLeaderboard: builder.query({
            query: () => '/leaderboard/daily',
            providesTags: ['Leaderboard'],
        }),
        getWeeklyLeaderboard: builder.query({
            query: () => '/leaderboard/weekly',
            providesTags: ['Leaderboard'],
        }),
        getFriendsLeaderboard: builder.query({
            query: () => '/leaderboard/friends',
            providesTags: ['Leaderboard'],
        }),
        getMyRank: builder.query({
            query: () => '/leaderboard/my-rank',
            providesTags: ['Leaderboard'],
        }),
    }),
});

export const {
    useGetLeaderboardQuery,
    useGetDailyLeaderboardQuery,
    useGetWeeklyLeaderboardQuery,
    useGetFriendsLeaderboardQuery,
    useGetMyRankQuery,
} = leaderboardApi;
