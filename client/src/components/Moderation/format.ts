import type { ReportRow, AppealRow, QueueFilters } from './types';

export const REPORT_REASONS = [
  'SPAM_OR_SCAM',
  'INAPPROPRIATE_CONTENT',
  'ITEM_MISMATCH',
  'HARASSMENT',
  'OTHER',
] as const;

// Empty string indicates inactive filters - ensures exclusion from the request
export const EMPTY_FILTERS: QueueFilters = {
  status: '',
  dateFrom: '',
  dateTo: '',
  reason: '',
  reporterQuery: '',
  subjectQuery: '',
};

export interface StatusOption {
    value: string;
    label: string;
  }

// Decouples backend enum values from frontend display strings
export const REPORT_STATUS_OPTIONS: StatusOption[] = [
  { value: '', label: 'All resolved' },
  { value: 'APPROVED', label: 'Allowed' },
  { value: 'REMOVED', label: 'Removed' },
];

export const APPEAL_STATUS_OPTIONS: StatusOption[] = [
  { value: '', label: 'All resolved' },
  { value: 'GRANTED', label: 'Granted' },
  { value: 'DENIED', label: 'Denied' },
];

export const humanizeStatus = (status: string) => (
  status.charAt(0) + status.slice(1).toLowerCase()
);

export const humanizeReason = (reason: string) => reason.replace(/_/g, ' ');

// Screening thresholds - mirror server/services/moderation.ts
// AUTO_REMOVE_THRESHOLD, AUTO_DISMISS_CATEGORIES, ZERO_TOLERANCE_CATEGORIES
// No client/server shared-constants module exists, keep these in sync by hand
export const AI_AUTO_REMOVE_THRESHOLD = 0.85;
export const AI_AUTO_DISMISS_THRESHOLD = 0.15;
export const AI_ZERO_TOLERANCE_CATEGORIES = ['ILLEGAL'];

export type AiScoreVerdict = 'pass' | 'review' | 'fail';

export const aiScoreVerdict = (score: number, categories: string[]): AiScoreVerdict => {
  const hasZeroTolerance = categories.some((c) => AI_ZERO_TOLERANCE_CATEGORIES.includes(c));
  if (hasZeroTolerance || score >= AI_AUTO_REMOVE_THRESHOLD) return 'fail';
  if (score <= AI_AUTO_DISMISS_THRESHOLD) return 'pass';
  return 'review';
};

export const targetSnippet = (report: ReportRow) => {
  if (report.targetType === 'POST') return report.post?.message ?? '(post not found)';
  if (report.targetType === 'MESSAGE') return report.message?.text ?? '(message not found)';
  if (report.targetType === 'TRADE_OFFER') {
    if (!report.offer) return '(trade offer not found)';
    return report.offer.message ?? '(no offer message)';
  }
  if (report.targetType === 'REVIEW') {
    if (!report.review) return '(review not found)';
    return report.review.comment ?? '(no review comment)';
  }
  if (report.targetType === 'TRADE_REQUEST') {
    if (!report.tradeRequest) return '(trade request not found)';
    return report.tradeRequest.message ?? '(no request message)';
  }
  if (report.targetType === 'USER') return `User: ${report.targetUser?.name ?? '(user not found)'}`;
  return '(unknown target)';
};

// Collapsed-row label: post title where one exists, otherwise the content itself
export const reportSummary = (report: ReportRow) => {
  if (report.targetType === 'POST') return report.post?.title ?? '(post not found)';
  if (report.targetType === 'MESSAGE') return report.message?.text ?? '(message not found)';
  if (report.targetType === 'TRADE_OFFER') {
    if (!report.offer) return '(trade offer not found)';
    return report.offer.message ?? 'Trade offer';
  }
  if (report.targetType === 'REVIEW') {
    if (!report.review) return '(review not found)';
    return `Review by ${report.review.reviewer.name ?? `User #${report.review.reviewer.id}`}`;
  }
  if (report.targetType === 'TRADE_REQUEST') {
    if (!report.tradeRequest) return '(trade request not found)';
    return `Trade request from ${report.tradeRequest.requester.name ?? `User #${report.tradeRequest.requester.id}`}`;
  }
  if (report.targetType === 'USER') return report.targetUser?.name ?? '(User not found)';
  return '(unknown target)';
};

// Friendly label per report target type for moderator-facing toasts
export const TARGET_TYPE_LABEL: Record<ReportRow['targetType'], string> = {
  POST: 'Post',
  USER: 'User',
  MESSAGE: 'Message',
  TRADE_OFFER: 'Trade offer',
  REVIEW: 'Review',
  TRADE_REQUEST: 'Trade request',
};

// Toast copy after a removal
export const removalMessage = (report: ReportRow): string => {
  const summary = reportSummary(report);
  const trimmed = summary.length > 60 ? `${summary.slice(0, 57)}...` : summary;
  return `${TARGET_TYPE_LABEL[report.targetType]} removed: "${trimmed}"`;
};

export const appealTargetSnippet = (appeal: AppealRow) => {
  if (appeal.report.post) return appeal.report.post.message;
  if (appeal.report.message) return appeal.report.message.text;
  return `User: ${appeal.report.targetUser?.name ?? '(user not found)'}`;
};

// Builds query object, excluding empty fields to keep URL clean/avoid ambiguous filtering
export const toQueryParams = (
  scope: 'pending' | 'history',
  filters: QueueFilters,
  subjectParam: 'reporteeQuery' | 'appellantQuery',
): Record<string, string> => {
  if (scope === 'pending') return { scope };

  const params: Record<string, string> = { scope };
  if (filters.status) params.status = filters.status;
  if (filters.reason) params.reason = filters.reason;
  if (filters.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;
  if (filters.reporterQuery.trim()) params.reporterQuery = filters.reporterQuery.trim();
  if (filters.subjectQuery.trim()) params[subjectParam] = filters.subjectQuery.trim();
  return params;
};
