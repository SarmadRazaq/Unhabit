export const formatDateTime = (
    value?: string | number | Date | null,
    locale: string = 'en-US'
): string => {
    if (!value) return '—';

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '—';

    return new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
};

export const formatMonthYear = (
    value?: string | number | Date | null,
    locale: string = 'en-US',
    monthStyle: 'short' | 'long' = 'short'
): string => {
    if (!value) return '—';

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '—';

    return new Intl.DateTimeFormat(locale, {
        month: monthStyle,
        year: 'numeric',
    }).format(date);
};
