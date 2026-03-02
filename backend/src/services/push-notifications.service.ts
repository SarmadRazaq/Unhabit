import { Expo } from 'expo-server-sdk';
import type { ExpoPushMessage, ExpoPushTicket, ExpoPushReceipt } from 'expo-server-sdk';

const expo = new Expo();

/**
 * Send push notifications to a list of tokens.
 * @param tokens Array of Expo Push Tokens
 * @param title Notification title
 * @param body Notification body
 * @param data Optional data payload
 */
export async function sendPushNotifications(
    tokens: string[],
    title: string,
    body: string,
    data: Record<string, any> = {},
    categoryId?: string
) {
    const messages: ExpoPushMessage[] = [];

    for (const token of tokens) {
        if (!Expo.isExpoPushToken(token)) {
            console.error(`Push token ${token} is not a valid Expo push token`);
            continue;
        }

        messages.push({
            to: token,
            sound: 'default',
            title,
            body,
            data,
            _category: categoryId, // For actionable notifications if configured
        });
    }

    const chunks = expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
        try {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            console.log('Push tickets:', ticketChunk);
            tickets.push(...ticketChunk);
        } catch (error) {
            console.error('Error sending push notification chunk:', error);
        }
    }

    return tickets;
}

/**
 * Process receipts (optional, for checking delivery errors like invalid tokens)
 */
export async function checkPushReceipts(receiptIds: string[]) {
    // Logic to check receipts using expo.getPushNotificationReceiptsAsync(receiptIds)
    // This is useful for removing invalid tokens from the database.
    // For now, simple sending is implemented.
}
