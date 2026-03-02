import { apiSlice } from './api';

export const settingsApi = apiSlice.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        getSettings: builder.query({
            query: () => '/settings',
            providesTags: ['Settings'],
        }),
        getPrivacySettings: builder.query({
            query: () => '/settings/privacy',
            providesTags: ['Settings'],
        }),
        updatePrivacySettings: builder.mutation({
            query: (data) => ({
                url: '/settings/privacy',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Settings'],
        }),
        getShareSettings: builder.query({
            query: () => '/settings/share',
            providesTags: ['Settings'],
        }),
        updateShareSettings: builder.mutation({
            query: (data) => ({
                url: '/settings/share',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Settings'],
        }),
        getDevices: builder.query({
            query: () => '/settings/devices',
            providesTags: ['Settings'],
        }),
        registerDevice: builder.mutation({
            query: (deviceData) => ({
                url: '/settings/devices',
                method: 'POST',
                body: deviceData,
            }),
            invalidatesTags: ['Settings'],
        }),
        removeDevice: builder.mutation({
            query: (id) => ({
                url: `/settings/devices/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Settings'],
        }),
        requestExport: builder.mutation({
            query: () => ({
                url: '/settings/export-request',
                method: 'POST',
            }),
        }),
        requestAccountDeletion: builder.mutation({
            query: () => ({
                url: '/settings/delete-request',
                method: 'POST',
            }),
        }),
        getAiCoachPreferences: builder.query({
            query: () => '/settings/ai-coach-preferences',
            providesTags: ['Settings'],
        }),
        updateAiCoachPreferences: builder.mutation({
            query: (data) => ({
                url: '/settings/ai-coach-preferences',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Settings'],
        }),
    }),
});

export const {
    useGetSettingsQuery,
    useGetPrivacySettingsQuery,
    useUpdatePrivacySettingsMutation,
    useGetShareSettingsQuery,
    useUpdateShareSettingsMutation,
    useGetDevicesQuery,
    useRegisterDeviceMutation,
    useRemoveDeviceMutation,
    useRequestExportMutation,
    useRequestAccountDeletionMutation,
    useGetAiCoachPreferencesQuery,
    useUpdateAiCoachPreferencesMutation,
} = settingsApi;
