import { apiSlice } from './api';

export const notificationsApi = apiSlice.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        getNotifications: builder.query({
            query: () => '/notifications',
            providesTags: ['Notifications'],
        }),
        markAllRead: builder.mutation({
            query: () => ({
                url: '/notifications/mark-all-read',
                method: 'POST',
            }),
            invalidatesTags: ['Notifications'],
        }),
        markNotificationRead: builder.mutation({
            query: (id) => ({
                url: `/notifications/${id}/read`,
                method: 'POST',
            }),
            invalidatesTags: ['Notifications'],
        }),
        deleteNotification: builder.mutation({
            query: (id) => ({
                url: `/notifications/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Notifications'],
        }),
        getNotificationPreferences: builder.query({
            query: () => '/notifications/preferences',
            providesTags: ['Notifications'],
        }),
        updateNotificationPreferences: builder.mutation({
            query: (prefs) => ({
                url: '/notifications/preferences',
                method: 'PUT',
                body: prefs,
            }),
            invalidatesTags: ['Notifications'],
        }),
        getScheduledNotifications: builder.query({
            query: () => '/notifications/scheduled',
            providesTags: ['Notifications'],
        }),
        setPrimeTime: builder.mutation({
            query: (data) => ({
                url: '/notifications/prime-time',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Notifications'],
        }),
        getPrimeTime: builder.query({
            query: () => '/notifications/prime-time',
            providesTags: ['Notifications'],
        }),
        setQuietHours: builder.mutation({
            query: (data) => ({
                url: '/notifications/quiet-hours',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Notifications'],
        }),
        getQuietHours: builder.query({
            query: () => '/notifications/quiet-hours',
            providesTags: ['Notifications'],
        }),
        getNotificationHistory: builder.query({
            query: () => '/notifications/history',
            providesTags: ['Notifications'],
        }),
        createReminder: builder.mutation({
            query: (data) => ({
                url: '/notifications/reminders',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Notifications'],
        }),
        getReminders: builder.query({
            query: () => '/notifications/reminders',
            providesTags: ['Notifications'],
        }),
        deleteReminder: builder.mutation({
            query: (id) => ({
                url: `/notifications/reminders/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Notifications'],
        }),
    }),
});

export const {
    useGetNotificationsQuery,
    useMarkAllReadMutation,
    useMarkNotificationReadMutation,
    useDeleteNotificationMutation,
    useGetNotificationPreferencesQuery,
    useUpdateNotificationPreferencesMutation,
    useGetScheduledNotificationsQuery,
    useSetPrimeTimeMutation,
    useGetPrimeTimeQuery,
    useSetQuietHoursMutation,
    useGetQuietHoursQuery,
    useGetNotificationHistoryQuery,
    useCreateReminderMutation,
    useGetRemindersQuery,
    useDeleteReminderMutation,
} = notificationsApi;
