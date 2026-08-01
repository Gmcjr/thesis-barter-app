import type { ReportRow, AppealRow } from './types';

export const REPORT_REASONS = [
  'SPAM_OR_SCAM',
  'INAPPROPRIATE_CONTENT',
  'ITEM_MISMATCH',
  'HARASSMENT',
  'OTHER',
] as const;

export const humanizeStatus = (status: string) => (
  status.charAt(0) + status.slice(1).toLowerCase()
);

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
