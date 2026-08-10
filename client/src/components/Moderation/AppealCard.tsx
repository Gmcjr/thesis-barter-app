import React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { radius } from '../../theme';
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
  const appellant = appeal.appellant.name ?? `User #${appeal.appellant.id}`;

  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: radius.md,
        '&:before': { display: 'none' },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{ minHeight: 0, '& .MuiAccordionSummary-content': { my: 1 } }}
      >
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, width: '100%',
        }}
        >
          <Chip label="APPEAL" size="small" />

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }} noWrap>
              {appellant}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {humanizeReason(appeal.report.reason)}
            </Typography>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
            {new Date(appeal.createdAt).toLocaleDateString()}
          </Typography>
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ pt: 0 }}>
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
      </AccordionDetails>
    </Accordion>
  );
}
