import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import { type ReportRow, targetSnippet } from './format';

  interface Props {
    report: ReportRow;
    showActions: boolean;
    resolvingId: number | null;
    onApprove: (id: number) => void;
    onRemove: (id: number) => void;
  }

export default function ReportCard({
  report, showActions, resolvingId, onApprove, onRemove,
}: Props) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
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

        {showActions && (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" variant="outlined" disabled={resolvingId === report.id} onClick={() => onApprove(report.id)}>
            Allow
          </Button>
          <Button
            size="small"
            variant="contained"
            color="error"
            disabled={resolvingId === report.id}
            onClick={() => onRemove(report.id)}
          >
            Remove
          </Button>
        </Box>
        )}
      </CardContent>
    </Card>
  );
}
