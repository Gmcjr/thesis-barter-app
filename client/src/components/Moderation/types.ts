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
  post: { id: number; title: string; message: string; isRemoved: boolean } | null;
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

export interface QueueFilters {
  status: string;
  dateFrom: string;
  dateTo: string;
  reason: string;
  reporterQuery: string;
  subjectQuery: string; // reportee on Reports, appellant on Appeals
}
