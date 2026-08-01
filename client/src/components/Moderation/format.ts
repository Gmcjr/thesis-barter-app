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

export const targetSnippet = (report: ReportRow) => {
  if (report.targetType === 'POST') return report.post?.message ?? '(post not found)';
  if (report.targetType === 'MESSAGE') return report.message?.text ?? '(message not found)';
  return `User: ${report.targetUser?.name ?? '(user not found)'}`;
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
