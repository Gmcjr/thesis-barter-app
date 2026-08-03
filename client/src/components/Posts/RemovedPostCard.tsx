import React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import WhyRemovedMenu from './WhyRemovedMenu';
import { formatPostDate } from '../../utils/utils';
import type { PostData } from './ManagePosts';

export default function RemovedPostCard({ post }: { post: PostData }) {
  const report = post.reports?.[0];

  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'error.main',
        borderRadius: 2,
        '&:before': { display: 'none' },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{ minHeight: 0, '& .MuiAccordionSummary-content': { my: 1 } }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }} noWrap>
            {post.title}
          </Typography>
          <Typography variant="caption" color="error">
            Removed
            {report ? ` - ${report.reason.replace(/_/g, ' ')}` : ''}
          </Typography>
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ pt: 0 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          {post.message}
        </Typography>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          {post.updatedAt && post.updatedAt !== post.createdAt
            ? `Updated on ${formatPostDate(post.updatedAt)}`
            : `Posted on ${formatPostDate(post.createdAt)}`}
        </Typography>

        {report && <WhyRemovedMenu report={report} />}
      </AccordionDetails>
    </Accordion>
  );
}
