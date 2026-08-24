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
import { useTheme } from '@mui/material/styles';
import { humanizeReason, reportSummary, targetSnippet } from './format';
import type { ReportRow } from './types';

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
  const theme = useTheme();
  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: theme.radius.md,
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
          <Chip label={report.targetType} size="small" />

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }} noWrap>
              {reportSummary(report)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {humanizeReason(report.reason)}
            </Typography>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
            {new Date(report.createdAt).toLocaleDateString()}
          </Typography>
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ pt: 0 }}>
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
          {' '}
          on
          {' '}
          {new Date(report.createdAt).toLocaleString()}
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
            {' '}
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
      </AccordionDetails>
    </Accordion>
  );
}
