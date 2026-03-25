import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useLoginWithAppleMutation, useLoginWithGoogleMutation } from '../services/api/auth';
import { APP_CONFIG } from '../constants/config';

export const useSocialLogin = () => {
    const [loginWithApple, { isLoading: isAppleLoading }] = useLoginWithAppleMutation();
    const [loginWithGoogle, { isLoading: isGoogleLoading }] = useLoginWithGoogleMutation();
    const [isGoogleReady, setIsGoogleReady] = useState(false);

    const getGoogleSignInErrorMessage = (error: any) => {
        const code = error?.code;
        const backendMessage =
            error?.data?.error ||
            error?.data?.message ||
            error?.error?.data?.error ||
            error?.error?.data?.message ||
            error?.error ||
            error?.message;

        if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
            return 'Google Play Services is not available on this device.';
        }

        if (code === 'DEVELOPER_ERROR') {
            return 'Google Sign-In is misconfigured for this build. Verify Android package name and release SHA-1/SHA-256 in Google Cloud OAuth clients.';
        }

        if (typeof backendMessage === 'string' && backendMessage.trim().length > 0) {
            return backendMessage;
        }

        return 'Could not sign in with Google.';
    };

    useEffect(() => {
        if (!APP_CONFIG.googleWebClientId) {
            if (__DEV__) {
                console.error('Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');
            }
            setIsGoogleReady(false);
            return;
        }

        GoogleSignin.configure({
            webClientId: APP_CONFIG.googleWebClientId,
            iosClientId: APP_CONFIG.googleIosClientId || undefined,
            offlineAccess: true,
        });
        setIsGoogleReady(true);
    }, []);

    const handleAppleLogin = async (): Promise<boolean> => {
        try {
            const nonceBytes = await Crypto.getRandomBytesAsync(32);
            const nonce = Array.from(nonceBytes)
                .map((b) => b.toString(16).padStart(2, '0'))
                .join('');

            const hashedNonce = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                nonce
            );

            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
                nonce: hashedNonce,
            });

            if (credential.identityToken) {
                await loginWithApple({
                    identityToken: credential.identityToken,
                    nonce,
                    fullName: credential.fullName
                        ? `${credential.fullName.givenName ?? ''} ${credential.fullName.familyName ?? ''}`.trim()
                        : undefined,
                }).unwrap();
                return true;
            }
            // No identity token received — treat as no-op
            return false;
        } catch (e: any) {
            if (e.code === 'ERR_CANCELED' || e.code === 'ERR_REQUEST_CANCELED') {
                // User canceled — stay on Login screen
                return false;
            }
            if (__DEV__) console.error('Apple Login Error:', e);
            // Extract backend error message for display
            const backendMsg =
                e?.data?.error ||
                e?.error?.data?.error ||
                e?.message ||
                'Could not sign in with Apple.';
            throw new Error(backendMsg);
        }
    };

    const handleGoogleLogin = async (): Promise<boolean> => {
        try {
            await GoogleSignin.hasPlayServices();

            const userInfo = await GoogleSignin.signIn();
            const idToken = userInfo.data?.idToken;

            if (idToken) {
                await loginWithGoogle({ idToken }).unwrap();
                return true;
            } else {
                if (__DEV__) console.error('No ID token present');
                throw new Error('Google Sign-In failed: no ID token received');
            }
        } catch (error: any) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                // user cancelled — stay on Login screen
                return false;
            } else if (error.code === statusCodes.IN_PROGRESS) {
                // already in progress — stay on Login screen
                return false;
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                throw new Error(getGoogleSignInErrorMessage(error));
            } else {
                if (__DEV__) console.error('Google Login Error:', error);
                throw new Error(getGoogleSignInErrorMessage(error));
            }
        }
    };

    const isAppleLoginAvailable = Platform.OS === 'ios';

    return {
        handleAppleLogin,
        handleGoogleLogin,
        isLoading: isAppleLoading || isGoogleLoading,
        isGoogleReady,
        isAppleLoginAvailable,
    };
};
