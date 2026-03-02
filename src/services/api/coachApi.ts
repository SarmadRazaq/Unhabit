import { apiSlice } from './api';

export const coachApi = apiSlice.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        getCoachSessions: builder.query({
            query: () => '/coach/sessions',
            providesTags: ['Coach'],
        }),
        createCoachSession: builder.mutation({
            query: () => ({
                url: '/coach/sessions',
                method: 'POST',
            }),
            invalidatesTags: ['Coach'],
        }),
        getCoachSession: builder.query({
            query: (id) => `/coach/sessions/${id}`,
            providesTags: (result, error, id) => [{ type: 'Coach', id }],
        }),
        sendCoachMessage: builder.mutation({
            query: ({ sessionId, message }) => ({
                url: `/coach/sessions/${sessionId}/messages`,
                method: 'POST',
                body: { message },
            }),
            invalidatesTags: (result, error, { sessionId }) => [{ type: 'Coach', id: sessionId }],
        }),
        endCoachSession: builder.mutation({
            query: (id) => ({
                url: `/coach/sessions/${id}/end`,
                method: 'POST',
            }),
            invalidatesTags: ['Coach'],
        }),
    }),
});

export const {
    useGetCoachSessionsQuery,
    useCreateCoachSessionMutation,
    useGetCoachSessionQuery,
    useSendCoachMessageMutation,
    useEndCoachSessionMutation,
} = coachApi;
