import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { appealTargetSnippet, humanizeReason, humanizeStatus } from './format';
import type { AppealRow } from './types';

  interface Props {
    appeal: AppealRow;
    showActions: boolean;
    resolvingId: number | null;
    onGrant: (id: number) => void;
    onDeny: (id: number) => void;
  }

export default function AppealCard({
  appeal, showActions, resolvingId, onGrant, onDeny,
}: Props) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 0.5 }}>
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
          {humanizeReason(appeal.report.reason)}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {appealTargetSnippet(appeal)}
        </Typography>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Reported by
          {' '}
          {appeal.report.reporter.name ?? `User #${appeal.report.reporter.id}`}
        </Typography>

        {appeal.report.aiRationale && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {appeal.report.aiRationale}
        </Typography>
        )}

        {appeal.status !== 'PENDING' && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mb: 1.5 }}
        >
          {humanizeStatus(appeal.status)}
          {' '}
          by
          {' '}
          {appeal.resolver?.name ?? `Moderator #${appeal.resolverId}`}
          {appeal.resolution ? ` - ${appeal.resolution}` : ''}
        </Typography>
        )}

        {showActions && (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="contained"
            color="success"
            disabled={resolvingId === appeal.id}
            onClick={() => onGrant(appeal.id)}
          >
            Grant
          </Button>
          <Button
            size="small"
            variant="contained"
            color="error"
            disabled={resolvingId === appeal.id}
            onClick={() => onDeny(appeal.id)}
          >
            Deny
          </Button>
        </Box>
        )}
      </CardContent>
    </Card>
  );
}
