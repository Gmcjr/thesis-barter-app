import React from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Paper from '@mui/material/Paper';
import MenuIcon from '@mui/icons-material/Menu';

interface SearchPostsProps {
  search: string;
  onSearchChange: (value: string) => void;
  onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
  onAdvancedSearchClick: () => void;
}

export default function SearchPosts({
  search,
  onSearchChange,
  onSubmit,
  onAdvancedSearchClick,
}: SearchPostsProps) {
  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      sx={{
        position: 'sticky', top: { xs: 86, sm: 96 }, zIndex: 10, bgcolor: 'background.default', py: 1, display: 'flex', gap: 1, mb: 3, px: { xs: 2, md: 0 },
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          display: 'flex', alignItems: 'center', px: 1.5, py: 0.25, flex: 1,
        }}
      >
        <InputBase
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search for listings..."
          sx={{ flex: 1, fontSize: '0.85rem' }}
        />

        <IconButton
          type="button"
          color="primary"
          aria-label="Advanced search"
          onClick={onAdvancedSearchClick}
        >
          <MenuIcon />
        </IconButton>
      </Paper>

      {/* Search Button */}
      <Button
        type="submit"
        variant="contained"
        sx={{ textTransform: 'none' }}
      >
        Search
      </Button>
    </Box>
  );
}
