import { apiSlice } from './api';

/** AI/LLM calls can take 30-60s; override the default 15s timeout */
const AI_TIMEOUT_MS = 60_000;

export const aiApi = apiSlice.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        startOnboarding: builder.mutation({
            query: (data) => ({
                url: '/ai/onboarding/start',
                method: 'POST',
                body: data,
                timeout: AI_TIMEOUT_MS,
            }),
        }),
        canonicalizeHabit: builder.mutation({
            query: (habitText) => ({
                url: '/ai/canonicalize-habit',
                method: 'POST',
                body: { user_input: habitText },
                timeout: AI_TIMEOUT_MS,
            }),
        }),
        checkSafety: builder.mutation({
            query: (data) => ({
                url: '/ai/safety',
                method: 'POST',
                body: data,
                timeout: AI_TIMEOUT_MS,
            }),
        }),
        generateQuizForm: builder.mutation({
            query: (data) => ({
                url: '/ai/quiz-form',
                method: 'POST',
                body: data,
                timeout: AI_TIMEOUT_MS,
            }),
        }),
        generateQuizSummary: builder.mutation({
            query: (answers) => ({
                url: '/ai/quiz-summary',
                method: 'POST',
                body: answers,
                timeout: AI_TIMEOUT_MS,
            }),
        }),
        generatePlan21d: builder.mutation({
            query: (data) => ({
                url: '/ai/plan-21d',
                method: 'POST',
                body: data,
                timeout: AI_TIMEOUT_MS,
            }),
        }),
        aiCoachMessage: builder.mutation({
            query: (message) => ({
                url: '/ai/coach',
                method: 'POST',
                body: message,
                timeout: AI_TIMEOUT_MS,
            }),
        }),
        getWhyDay: builder.mutation({
            query: (data) => ({
                url: '/ai/why-day',
                method: 'POST',
                body: data,
                timeout: AI_TIMEOUT_MS,
            }),
        }),
        getAiHealth: builder.query({
            query: () => '/ai/health',
        }),
    }),
});

export const {
    useStartOnboardingMutation,
    useCanonicalizeHabitMutation,
    useCheckSafetyMutation,
    useGenerateQuizFormMutation,
    useGenerateQuizSummaryMutation,
    useGeneratePlan21dMutation,
    useAiCoachMessageMutation,
    useGetWhyDayMutation,
    useGetAiHealthQuery,
} = aiApi;
