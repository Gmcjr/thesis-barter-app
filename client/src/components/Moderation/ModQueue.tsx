import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import { useToast } from '../../context/ToastContext';
import { targetSnippet, appealTargetSnippet } from './format';
import type { ReportRow, AppealRow } from './types';

type Status = 'PENDING' | 'APPROVED' | 'REMOVED' | 'ALL';
type View = 'reports' | 'appeals';

const tabs: Status[] = ['PENDING', 'APPROVED', 'REMOVED', 'ALL'];

export default function ModQueue() {
  const { showToast } = useToast();
  const [view, setView] = useState<View>('reports');
  const [status, setStatus] = useState<Status>('PENDING');
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [appeals, setAppeals] = useState<AppealRow[]>([]);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  useEffect(() => {
    async function loadReports() {
      try {
        const query = status === 'ALL' ? '' : `?status=${status}`;
        const res = await axios.get<ReportRow[]>(`/reports${query}`, { withCredentials: true });
        setReports(res.data);
      } catch {
        showToast('Could not load reports', 'error');
      }
    }

    async function loadAppeals() {
      try {
        const res = await axios.get<AppealRow[]>('/appeals', { withCredentials: true });
        setAppeals(res.data);
      } catch {
        showToast('Could not load appeals', 'error');
      }
    }

    if (view === 'reports') {
      loadReports();
    } else {
      loadAppeals();
    }
  }, [view, status, showToast]);

  const handleResolve = async (id: number, action: 'approve' | 'remove') => {
    setResolvingId(id);
    try {
      await axios.patch(`/reports/${id}`, { action }, { withCredentials: true });
      showToast(action === 'remove' ? 'Content removed' : 'Report approved', 'success');
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch {
      showToast('Could not resolve report - check your connection and try, try again.', 'error');
    } finally {
      setResolvingId(null);
    }
  };

  const handleResolveAppeal = async (id: number, action: 'grant' | 'deny') => {
    setResolvingId(id);
    try {
      await axios.patch(`/appeals/${id}`, { action }, { withCredentials: true });
      showToast(action === 'grant' ? 'Appeal granted - content reinstated' : 'Appeal denied', 'success');
      setAppeals((prev) => prev.filter((a) => a.id !== id));
    } catch {
      showToast('Could not resolve appeal - check your connection and try, try again.', 'error');
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        Moderation Queue
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button
          variant={view === 'reports' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setView('reports')}
          sx={{ textTransform: 'none' }}
        >
          Reports
        </Button>
        <Button
          variant={view === 'appeals' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setView('appeals')}
          sx={{ textTransform: 'none' }}
        >
          Appeals
        </Button>
      </Box>

      {view === 'reports' && (
        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          {tabs.map((t) => (
            <Button
              key={t}
              variant={status === t ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setStatus(t)}
              sx={{ textTransform: 'none' }}
            >
              {t === 'ALL' ? 'ALL' : t.charAt(0) + t.slice(1).toLowerCase()}
            </Button>
          ))}
        </Box>
      )}

      {view === 'reports' ? (
        <>
          {reports.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No reports on this view.
            </Typography>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {reports.map((report) => (
              <Card key={report.id} variant="outlined" sx={{ borderRadius: 0.5 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {report.targetType}
                      {' '}
                      *
                      {report.reason.replace(/_/g, ' ')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(report.createdAt).toLocaleString()}
                    </Typography>
                  </Box>

                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {targetSnippet(report)}
                  </Typography>

                  {report.details && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontStyle: 'italic' }}>
                      Reporter note:
                      {' '}
                      {report.details}
                    </Typography>
                  )}

                  <Typography variant="caption" color="text.secondary">
                    Reported by
                    {' '}
                    {report.reporter.name ?? `User #${report.reporter.id}`}
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  {report.aiScore !== null ? (
                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Gemini score:
                        {' '}
                        {report.aiScore.toFixed(2)}
                      </Typography>
                      {report.aiCategories.length > 0 && (
                        <Box sx={{
                          display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5,
                        }}
                        >
                          {report.aiCategories.map((c) => (
                            <Chip key={c} label={c} size="small" />
                          ))}
                        </Box>
                      )}
                      {report.aiRationale && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {report.aiRationale}
                      </Typography>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontStyle: 'italic' }}>
                      No AI screening for this report.
                    </Typography>
                  )}

                  {report.status !== 'PENDING' && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                    {report.status === 'REMOVED' ? 'Removed' : 'Allowed'}
                    by
                    {' '}
                    {report.resolverId === null ? 'Auto (Gemini)' : (report.resolver?.name ?? `Moderator #${report.resolverId}`)}
                    {report.resolution ? ` - ${report.resolution}` : ''}
                  </Typography>
                  )}

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      disabled={resolvingId === report.id}
                      onClick={() => handleResolve(report.id, 'approve')}
                    >
                      Allow
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      disabled={resolvingId === report.id}
                      onClick={() => handleResolve(report.id, 'remove')}
                    >
                      Remove
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </>
      ) : (
        <>
          {appeals.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No appeals right now.
            </Typography>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {appeals.map((appeal) => (
              <Card key={appeal.id} variant="outlined" sx={{ borderRadius: 0.5 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Appeal from
                      {' '}
                      {appeal.appellant.name ?? `User #${appeal.appellant.id}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(appeal.createdAt).toLocaleString()}
                    </Typography>
                  </Box>

                  <Typography variant="body2" sx={{ mb: 1.5, fontStyle: 'italic' }}>
                    &quot;
                    {appeal.message}
                    &quot;
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Original report:
                    {' '}
                    {appeal.report.reason.replace(/_/g, ' ')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {appealTargetSnippet(appeal)}
                  </Typography>
                  {appeal.report.aiRationale && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      {appeal.report.aiRationale}
                    </Typography>
                  )}

                  {appeal.status !== 'PENDING' && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                      {appeal.status}
                      {' '}
                      by
                      {' '}
                      {appeal.resolver?.name ?? `Moderator #${appeal.resolverId}`}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      disabled={resolvingId === appeal.id}
                      onClick={() => handleResolveAppeal(appeal.id, 'grant')}
                    >
                      Grant
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      disabled={resolvingId === appeal.id}
                      onClick={() => handleResolveAppeal(appeal.id, 'deny')}
                    >
                      Deny
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}
