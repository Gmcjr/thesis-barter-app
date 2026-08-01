export interface ReportRow {
    id: number;
    targetType: 'POST' | 'USER' | 'MESSAGE';
    reason: string;
    details: string | null;
    aiScore: number | null;
    aiCategories: string[];
    aiRationale: string | null;
    status: 'PENDING' | 'APPROVED' | 'REMOVED';
    resolution: string | null;
    resolverId: number | null;
    createdAt: string;
    reporter: { id: number; name: string | null };
    post: { id: number; message: string; isRemoved: boolean } | null;
    targetUser: { id: number; name: string | null } | null;
    message: { id: number; text: string; isRemoved: boolean } | null;
    resolver: { id: number; name: string | null } | null;
}

export interface AppealRow {
    id: number;
    message: string;
    status: 'PENDING' | 'GRANTED' | 'DENIED';
    resolution: string | null;
    resolverId: number | null;
    createdAt: string;
    appellant: { id: number; name: string | null };
    resolver: { id: number; name: string | null } | null;
    report: {
      id: number;
      reason: string;
      aiRationale: string | null;
      reporter: { id: number; name: string | null };
      post: { id: number; message: string } | null;
      message: { id: number; text: string } | null;
      targetUser: { id: number; name: string | null } | null;
    };
  }

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
