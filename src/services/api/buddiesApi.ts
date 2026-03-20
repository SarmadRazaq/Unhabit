import { apiSlice } from './api';

export const buddiesApi = apiSlice.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        getBuddies: builder.query({
            query: () => '/buddies',
            providesTags: ['Buddies'],
        }),
        inviteBuddy: builder.mutation({
            query: (data) => ({
                url: '/buddies/invite',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Buddies'],
        }),
        getInvites: builder.query({
            query: () => '/buddies/invites',
            providesTags: ['Buddies'],
        }),
        acceptInvite: builder.mutation({
            query: (inviteCode) => ({
                url: `/buddies/accept/${encodeURIComponent(inviteCode)}`,
                method: 'POST',
            }),
            invalidatesTags: ['Buddies'],
        }),
        buddyCheckin: builder.mutation({
            query: (data) => ({
                url: '/buddies/checkin',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Buddies'],
        }),
        getBuddyCheckins: builder.query({
            query: () => '/buddies/checkins',
            providesTags: ['Buddies'],
        }),
        sendBuddyMessage: builder.mutation({
            query: (data) => ({
                url: '/buddies/messages',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Buddies'],
        }),
        getBuddyMessages: builder.query({
            query: () => '/buddies/messages',
            providesTags: ['Buddies'],
        }),
        sendReaction: builder.mutation({
            query: (data) => ({
                url: '/buddies/reactions',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Buddies'],
        }),
        getBuddySummary: builder.query({
            query: () => '/buddies/summary',
            providesTags: ['Buddies'],
        }),
        removeBuddy: builder.mutation({
            query: (id) => ({
                url: `/buddies/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Buddies'],
        }),
        getBuddyQuickView: builder.query({
            query: () => '/buddies/quick-view',
            providesTags: ['Buddies'],
        }),
        getBuddyProfile: builder.query({
            query: (id) => `/buddies/${id}/profile`,
            providesTags: ['Buddies'],
        }),
        nudgeBuddy: builder.mutation({
            query: ({ id, message }: { id: string; message: string }) => ({
                url: `/buddies/${encodeURIComponent(id)}/nudge`,
                method: 'POST',
                body: {
                    buddy_id: id,
                    message,
                },
            }),
            invalidatesTags: ['Buddies'],
        }),
        getNudges: builder.query({
            query: () => '/buddies/nudges',
            providesTags: ['Buddies'],
        }),
        resendInvite: builder.mutation({
            query: (id) => ({
                url: `/buddies/invites/${id}/resend`,
                method: 'POST',
            }),
            invalidatesTags: ['Buddies'],
        }),
        cancelInvite: builder.mutation({
            query: (id) => ({
                url: `/buddies/invites/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Buddies'],
        }),
        getInviteUrl: builder.query({
            query: (code) => `/buddies/invite/${code}/url`,
        }),
        getBuddiesCompletedToday: builder.query({
            query: () => '/buddies/completed-today',
            providesTags: ['Buddies'],
        }),
    }),
});

export const {
    useGetBuddiesQuery,
    useInviteBuddyMutation,
    useGetInvitesQuery,
    useAcceptInviteMutation,
    useBuddyCheckinMutation,
    useGetBuddyCheckinsQuery,
    useSendBuddyMessageMutation,
    useGetBuddyMessagesQuery,
    useSendReactionMutation,
    useGetBuddySummaryQuery,
    useRemoveBuddyMutation,
    useGetBuddyQuickViewQuery,
    useGetBuddyProfileQuery,
    useNudgeBuddyMutation,
    useGetNudgesQuery,
    useResendInviteMutation,
    useCancelInviteMutation,
    useGetInviteUrlQuery,
    useGetBuddiesCompletedTodayQuery,
} = buddiesApi;
