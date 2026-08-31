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
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { radius } from '../../theme';
import {
  aiScoreVerdict, humanizeReason, reportSummary, targetSnippet,
} from './format';
import type { AiScoreVerdict } from './format';
import type { ReportRow } from './types';

  interface Props {
    report: ReportRow;
    showActions: boolean;
    resolvingId: number | null;
    onApprove: (id: number) => void;
    onRemove: (id: number) => void;
  }

// Maps the three screening bands to an at-a-glance icon
// titleAccess gives each an accessible name
const SCORE_INDICATOR: Record<AiScoreVerdict, { icon: React.ReactNode;
    label: string }> = {
      pass: {
        icon: <CheckCircleOutlinedIcon fontSize="small" color="success" titleAccess="Passed screening" />,
        label: 'Passed screening',
      },
      review: {
        icon: <WarningAmberIcon fontSize="small" color="warning" titleAccess="Needs review" />,
        label: 'Needs review',
      },
      fail: {
        icon: <HighlightOffIcon fontSize="small" color="error" titleAccess="Failed screening" />,
        label: 'Failed screening',
      },
    };

export default function ReportCard({
  report, showActions, resolvingId, onApprove, onRemove,
}: Props) {
  // Only POST / TRADE_OFFER reports carry imageUrls
  // FKs are mutually exclusive per target type
  const reportedImage = (report.post?.imageUrls ?? report.offer?.imageUrls ?? [])[0];
  const scoreVerdict = report.aiScore === null
    ? null
    : aiScoreVerdict(report.aiScore, report.aiCategories);

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
          <Chip label={report.targetType} size="small" />

          {report.status !== 'PENDING' && (
            <Chip
              label={report.status === 'REMOVED' ? 'Removed' : 'Allowed'}
              color={report.status === 'REMOVED' ? 'error' : 'success'}
              size="small"
              variant="outlined"
            />
          )}

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
        {reportedImage && (
          <Box
            sx={{
              width: '100%',
              height: { xs: 200, sm: 280 },
              bgcolor: 'surface.sunken',
              borderRadius: radius.md,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 1,
            }}
          >
            <img
              src={reportedImage}
              alt="Reported content"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </Box>
        )}

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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {scoreVerdict && SCORE_INDICATOR[scoreVerdict].icon}
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Gemini score:
                {' '}
                {report.aiScore.toFixed(2)}
              </Typography>
              {scoreVerdict && (
                <Typography variant="caption" color="text.secondary">
                  {SCORE_INDICATOR[scoreVerdict].label}
                </Typography>
              )}
            </Box>
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
            Resolved by
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
