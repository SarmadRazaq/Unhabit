import { apiSlice } from './api';

export const challengesApi = apiSlice.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        getDailyChallenge: builder.query({
            query: () => '/challenges/daily',
            providesTags: ['Challenges'],
        }),
        acceptChallenge: builder.mutation({
            query: (id) => ({
                url: `/challenges/${id}/accept`,
                method: 'POST',
            }),
            invalidatesTags: ['Challenges', 'Dashboard'],
        }),
        completeChallenge: builder.mutation({
            query: (id) => ({
                url: `/challenges/${id}/complete`,
                method: 'POST',
            }),
            invalidatesTags: ['Challenges', 'Rewards', 'Dashboard'],
        }),
    }),
});

export const {
    useGetDailyChallengeQuery,
    useAcceptChallengeMutation,
    useCompleteChallengeMutation,
} = challengesApi;
