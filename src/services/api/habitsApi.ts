import { apiSlice } from './api';

export const habitsApi = apiSlice.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        getHabits: builder.query({
            query: () => '/habits',
            providesTags: ['Habits'],
        }),
        getHabitById: builder.query({
            query: (id) => `/habits/${id}`,
            providesTags: ['Habits'],
        }),
        getHabitTemplates: builder.query({
            query: () => '/habits/templates',
        }),
        getHabitCategories: builder.query({
            query: () => '/habits/categories',
        }),
        createHabit: builder.mutation({
            query: (habitData) => ({
                url: '/habits',
                method: 'POST',
                body: habitData,
            }),
            invalidatesTags: ['Habits', 'Dashboard'],
        }),
        updateHabit: builder.mutation({
            query: ({ id, ...patch }) => ({
                url: `/habits/${id}`,
                method: 'PUT',
                body: patch,
            }),
            invalidatesTags: ['Habits', 'Dashboard'],
        }),
        deleteHabit: builder.mutation({
            query: (id) => ({
                url: `/habits/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Habits', 'Dashboard'],
        }),
        getHabitTriggers: builder.query({
            query: (habitId) => `/habits/${habitId}/triggers`,
            providesTags: ['Habits'],
        }),
        createHabitTrigger: builder.mutation({
            query: ({ habitId, ...triggerData }) => ({
                url: `/habits/${habitId}/triggers`,
                method: 'POST',
                body: triggerData,
            }),
            invalidatesTags: ['Habits'],
        }),
        deleteHabitTrigger: builder.mutation({
            query: ({ habitId, triggerId }) => ({
                url: `/habits/${habitId}/triggers/${triggerId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Habits'],
        }),
    }),
});

export const {
    useGetHabitsQuery,
    useGetHabitByIdQuery,
    useGetHabitTemplatesQuery,
    useGetHabitCategoriesQuery,
    useCreateHabitMutation,
    useUpdateHabitMutation,
    useDeleteHabitMutation,
    useGetHabitTriggersQuery,
    useCreateHabitTriggerMutation,
    useDeleteHabitTriggerMutation,
} = habitsApi;
