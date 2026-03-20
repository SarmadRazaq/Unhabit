type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

export const extractImageUri = (value: unknown): string | null => {
    if (!value) return null;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }

    if (!isRecord(value)) return null;

    const directUri = value.uri;
    if (typeof directUri === 'string') {
        const trimmed = directUri.trim();
        return trimmed.length > 0 ? trimmed : null;
    }

    // Some API payloads may nest image objects (e.g. { uri: { uri: "..." } }).
    if (isRecord(directUri)) {
        return extractImageUri(directUri);
    }

    const avatarUrl = value.avatar_url;
    if (typeof avatarUrl === 'string') {
        const trimmed = avatarUrl.trim();
        return trimmed.length > 0 ? trimmed : null;
    }

    return null;
};
