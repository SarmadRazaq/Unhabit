import React, { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { COLORS } from '../../constants/theme';
import { extractImageUri } from '../../utils';

interface InitialsAvatarProps {
    uri?: unknown;
    name?: string | null;
    email?: string | null;
    size?: number;
    style?: ViewStyle;
}

const getInitials = (name?: string | null, email?: string | null): string => {
    const source = (name && name.trim()) || (email ? email.split('@')[0] : '') || 'U';
    const parts = source.trim().split(/\s+/).filter(Boolean);

    if (parts.length >= 2) {
        return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
    }

    return (parts[0]?.slice(0, 2) || 'U').toUpperCase();
};

export const InitialsAvatar = ({ uri, name, email, size = 40, style }: InitialsAvatarProps) => {
    const [imageFailed, setImageFailed] = useState(false);
    const imageUri = useMemo(() => extractImageUri(uri), [uri]);

    useEffect(() => {
        setImageFailed(false);
    }, [imageUri]);

    const initials = useMemo(() => getInitials(name, email), [name, email]);
    const hasImage = !!imageUri && !imageFailed;

    return hasImage ? (
        <Image
            source={{ uri: imageUri as string }}
            style={[
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                },
                style,
            ]}
            onError={() => setImageFailed(true)}
        />
    ) : (
        <View
            style={[
                styles.badge,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                },
                style,
            ]}
        >
            <Text style={[styles.text, { fontSize: Math.max(12, Math.round(size * 0.38)) }]}>{initials}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: COLORS.black,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
});
