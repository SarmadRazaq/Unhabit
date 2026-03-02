import { apiSlice } from './api';

export const journeysApi = apiSlice.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        getJourneys: builder.query({
            query: () => '/journeys',
            providesTags: ['Journeys'],
        }),
        getJourneyById: builder.query({
            query: (id) => `/journeys/${id}`,
            providesTags: ['Journeys'],
        }),
        getActiveJourney: builder.query({
            query: () => '/journeys/active',
            providesTags: ['Journeys'],
        }),
        createJourney: builder.mutation({
            query: (journeyData) => ({
                url: '/journeys',
                method: 'POST',
                body: journeyData,
            }),
            invalidatesTags: ['Journeys', 'Dashboard'],
        }),
        createJourneyFromAiPlan: builder.mutation({
            query: (planData) => {
                // Strip null values from ai_plan — Zod rejects null for optional fields
                const cleanedPlan = planData.ai_plan
                    ? Object.fromEntries(
                        Object.entries(planData.ai_plan).filter(([_, v]) => v != null)
                    )
                    : planData.ai_plan;
                return {
                    url: '/journeys/from-ai-plan',
                    method: 'POST',
                    body: { ...planData, ai_plan: cleanedPlan },
                };
            },
            invalidatesTags: ['Journeys', 'Dashboard'],
        }),
        updateJourney: builder.mutation({
            query: ({ id, ...patch }) => ({
                url: `/journeys/${id}`,
                method: 'PUT',
                body: patch,
            }),
            invalidatesTags: ['Journeys'],
        }),
        getJourneyDays: builder.query({
            query: (id) => `/journeys/${id}/days`,
            providesTags: ['Journeys'],
        }),
        getJourneyDay: builder.query({
            query: ({ id, dayNumber }) => `/journeys/${id}/days/${dayNumber}`,
            // Raw Prisma response has journey_tasks[].user_task_progress[]
            // Normalize to flat { tasks: [{ ...task, completed }] } like getTodayJourneyDay
            transformResponse: (raw: any) => {
                if (!raw || !raw.journey_tasks) return raw;
                return {
                    ...raw,
                    tasks: raw.journey_tasks.map((t: any) => ({
                        id: t.id,
                        title: t.title,
                        name: t.title,
                        kind: t.kind,
                        effort: t.effort,
                        description: t.description ?? null,
                        meta: t.meta,
                        xp_reward: 10,
                        completed: Array.isArray(t.user_task_progress)
                            ? t.user_task_progress.some((p: any) => p.status === 'completed')
                            : false,
                        completed_at: Array.isArray(t.user_task_progress)
                            ? t.user_task_progress.find((p: any) => p.status === 'completed')?.completed_at ?? null
                            : null,
                    })),
                };
            },
            providesTags: ['Journeys'],
        }),
        startJourney: builder.mutation({
            query: (id) => ({
                url: `/journeys/${id}/start`,
                method: 'POST',
            }),
            invalidatesTags: ['Journeys', 'Dashboard'],
        }),
        pauseJourney: builder.mutation({
            query: (id) => ({
                url: `/journeys/${id}/pause`,
                method: 'POST',
            }),
            invalidatesTags: ['Journeys', 'Dashboard'],
        }),
        resumeJourney: builder.mutation({
            query: (id) => ({
                url: `/journeys/${id}/resume`,
                method: 'POST',
            }),
            invalidatesTags: ['Journeys', 'Dashboard'],
        }),
        restartJourney: builder.mutation({
            query: (id) => ({
                url: `/journeys/${id}/restart`,
                method: 'POST',
            }),
            invalidatesTags: ['Journeys', 'Dashboard', 'Streaks', 'Progress'],
        }),
        getJourneyToday: builder.query({
            query: (id) => `/journeys/${id}/today`,
            providesTags: ['Journeys', 'Progress'],
        }),
        getJourneyCalendar: builder.query({
            query: (id) => `/journeys/${id}/calendar`,
            providesTags: ['Journeys'],
        }),
    }),
});

export const {
    useGetJourneysQuery,
    useGetJourneyByIdQuery,
    useGetActiveJourneyQuery,
    useCreateJourneyMutation,
    useCreateJourneyFromAiPlanMutation,
    useUpdateJourneyMutation,
    useGetJourneyDaysQuery,
    useGetJourneyDayQuery,
    useStartJourneyMutation,
    usePauseJourneyMutation,
    useResumeJourneyMutation,
    useRestartJourneyMutation,
    useGetJourneyTodayQuery,
    useGetJourneyCalendarQuery,
} = journeysApi;
