export type NotificationCategory = 'messages' | 'trades' | 'reviews' | 'moderation';

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  messages: 'Messages',
  trades: 'Trades',
  reviews: 'Reviews',
  moderation: 'Moderation',
};

// Maps a notification's type to its filter category
export function categoryFor(type: string): NotificationCategory | null {
  if (type === 'DM_MESSAGE') return 'messages';

  if ([
    'TRADE_OFFER_RECEIVED', 'TRADE_OFFER_ACCEPTED',
    'TRADE_REQUEST_RECEIVED', 'TRADE_REQUEST_ACCEPTED',
    'TRADE_COMPLETED', 'TRADE_PARTNER_COMPLETED',
  ].includes(type)) return 'trades';

  if (type === 'REVIEW_RECEIVED') return 'reviews';

  if (['REPORT_RESOLVED', 'APPEAL_RESOLVED'].includes(type)) return 'moderation';

  return null;
}

export function categoryLabel(category: NotificationCategory): string {
  return CATEGORY_LABELS[category];
}

export const ALL_CATEGORIES: NotificationCategory[] = ['messages', 'trades', 'reviews', 'moderation'];
