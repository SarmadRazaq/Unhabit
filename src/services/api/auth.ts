import { apiSlice } from './api';
import { setCredentials, logout as logoutAction } from '../../store/auth/authSlice';
import * as SecureStore from 'expo-secure-store';

const normalizeAuthMePayload = (payload: any) => {
    const apiUser = payload?.user ?? {};
    const apiProfile = payload?.profile ?? {};

    const mergedUser = {
        ...apiUser,
        ...apiProfile,
        full_name:
            apiProfile?.full_name ??
            apiUser?.full_name ??
            apiUser?.user_metadata?.full_name ??
            apiUser?.name ??
            undefined,
        name:
            apiProfile?.full_name ??
            apiUser?.full_name ??
            apiUser?.name ??
            apiUser?.user_metadata?.full_name ??
            undefined,
        avatar_url:
            apiProfile?.avatar_url ??
            apiUser?.avatar_url ??
            apiUser?.user_metadata?.avatar_url ??
            undefined,
    };

    return {
        ...payload,
        user: mergedUser,
        profile: {
            ...apiProfile,
            full_name: apiProfile?.full_name ?? mergedUser.full_name,
            avatar_url: apiProfile?.avatar_url ?? mergedUser.avatar_url,
            created_at: apiProfile?.created_at ?? apiUser?.created_at,
        },
    };
};

export const authApi = apiSlice.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        register: builder.mutation({
            query: (userData) => ({
                url: '/auth/register',
                method: 'POST',
                body: userData,
            }),
        }),
        login: builder.mutation({
            query: (credentials) => ({
                url: '/auth/login',
                method: 'POST',
                body: credentials,
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(setCredentials({
                        user: data.user,
                        token: data.token || data.access_token,
                        refreshToken: data.refresh_token,
                    }));
                } catch (err: any) {
                    if (__DEV__) console.error('Login failed:', err?.error?.data?.message || err);
                }
            },
        }),
        loginWithGoogle: builder.mutation({
            query: ({ idToken, nonce }: { idToken: string; nonce: string }) => ({
                url: '/auth/oauth/google',
                method: 'POST',
                body: { id_token: idToken, nonce },
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(setCredentials({
                        user: data.user,
                        token: data.access_token,
                        refreshToken: data.refresh_token,
                    }));
                } catch (err: any) {
                    if (__DEV__) console.error('Google login failed:', err?.error?.data?.message || err);
                }
            },
        }),
        loginWithApple: builder.mutation({
            query: ({ identityToken, nonce, fullName }) => ({
                url: '/auth/oauth/apple',
                method: 'POST',
                body: { id_token: identityToken, nonce, full_name: fullName },
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(setCredentials({
                        user: data.user,
                        token: data.access_token,
                        refreshToken: data.refresh_token,
                    }));
                } catch (err: any) {
                    if (__DEV__) console.error('Apple login failed:', err?.error?.data?.message || err);
                }
            },
        }),
        verifyEmail: builder.mutation({
            query: (data) => ({
                url: '/auth/verify-email',
                method: 'POST',
                body: data,
            }),
        }),
        forgotPassword: builder.mutation({
            query: (email) => ({
                url: '/auth/forgot-password',
                method: 'POST',
                body: { email },
            }),
        }),
        resetPassword: builder.mutation({
            query: (data) => ({
                url: '/auth/reset-password',
                method: 'POST',
                body: data,
            }),
        }),
        getMe: builder.query({
            query: () => '/auth/me',
            transformResponse: (response: any) => normalizeAuthMePayload(response),
            providesTags: ['User'],
        }),
        updateProfile: builder.mutation({
            query: (profileData) => ({
                url: '/auth/profile',
                method: 'PUT',
                body: profileData,
            }),
            invalidatesTags: ['User', 'Dashboard'],
            async onQueryStarted(arg, { dispatch, getState, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    const state = getState() as any;
                    const existingUser = state?.auth?.user || {};
                    const updatedUser = {
                        ...existingUser,
                        ...(data?.user || {}),
                        ...(arg || {}),
                    };
                    if (updatedUser.full_name && !updatedUser.name) {
                        updatedUser.name = updatedUser.full_name;
                    }
                    if (updatedUser.name && !updatedUser.full_name) {
                        updatedUser.full_name = updatedUser.name;
                    }

                    const token = state?.auth?.token;
                    if (token) {
                        dispatch(setCredentials({
                            user: updatedUser,
                            token,
                            refreshToken: state?.auth?.refreshToken,
                        }));
                    }

                    dispatch(
                        apiSlice.util.updateQueryData('getMe' as any, undefined, (draft: any) => {
                            if (draft?.user) {
                                draft.user = { ...draft.user, ...updatedUser };
                            }
                        })
                    );

                    dispatch(
                        apiSlice.util.updateQueryData('getDashboard' as any, undefined, (draft: any) => {
                            if (draft?.user) {
                                draft.user = { ...draft.user, ...updatedUser, name: updatedUser.full_name ?? updatedUser.name ?? draft.user.name };
                            }
                        })
                    );
                } catch (err: any) {
                    if (__DEV__) console.error('Profile update sync failed:', err?.error?.data?.message || err);
                }
            },
        }),
        markOnboarded: builder.mutation({
            query: () => ({
                url: '/auth/onboarded',
                method: 'POST',
            }),
            invalidatesTags: ['User'],
        }),
        refreshToken: builder.mutation({
            query: (refreshToken: string) => ({
                url: '/auth/refresh',
                method: 'POST',
                body: { refresh_token: refreshToken },
            }),
            async onQueryStarted(arg, { dispatch, getState, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    // Backend /auth/refresh doesn't return user, preserve existing user from state
                    const existingUser = (getState() as any).auth?.user;
                    dispatch(setCredentials({
                        user: data.user ?? existingUser,
                        token: data.access_token,
                        refreshToken: data.refresh_token,
                    }));
                } catch (err: any) {
                    if (__DEV__) console.error('Token refresh failed:', err?.error?.data?.message || err);
                    dispatch(logoutAction());
                }
            },
        }),
        logout: builder.mutation({
            query: () => ({
                url: '/auth/logout',
                method: 'POST',
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                dispatch(logoutAction());
                dispatch(apiSlice.util.resetApiState());
            },
        }),
        deleteAccount: builder.mutation({
            query: () => ({
                url: '/auth/account',
                method: 'DELETE',
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                    dispatch(logoutAction());
                    dispatch(apiSlice.util.resetApiState());
                } catch (err: any) {
                    if (__DEV__) console.error('Account deletion failed:', err?.error?.data?.message || err);
                }
            },
        }),
    }),
});

export const {
    useRegisterMutation,
    useLoginMutation,
    useLoginWithGoogleMutation,
    useLoginWithAppleMutation,
    useVerifyEmailMutation,
    useForgotPasswordMutation,
    useResetPasswordMutation,
    useGetMeQuery,
    useUpdateProfileMutation,
    useMarkOnboardedMutation,
    useRefreshTokenMutation,
    useLogoutMutation,
    useDeleteAccountMutation,
} = authApi;
