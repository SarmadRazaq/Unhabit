import { apiSlice } from './api';

export const shareApi = apiSlice.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        shareProgress: builder.mutation({
            query: (data) => ({
                url: '/share/progress',
                method: 'POST',
                body: data,
            }),
        }),
        shareAchievement: builder.mutation({
            query: (data) => ({
                url: '/share/achievement',
                method: 'POST',
                body: data,
            }),
        }),
    }),
});

export const {
    useShareProgressMutation,
    useShareAchievementMutation,
} = shareApi;
