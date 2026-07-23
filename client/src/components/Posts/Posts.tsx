/* eslint-disable react/jsx-one-expression-per-line */
import React, { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';

// dummy categories data
const categories = [
  'Books',
  'Clothing, Shoes, Accessories',
  'Collectibles',
  'Electronics',
  'Food and Perishables',
  'Free/Giving Away',
  'Handmade',
  'Household',
  'Movies, Music, Games',
  'Refurbished',
  'Services',
  'Sports & Outdoors',
  'Pet Supplies',
];

// dummy post data
const dummyPosts = [
  {
    id: 1,
    user: 'taconator',
    date: '01/01/2026',
    content: 'Help me fix my bike and I will make you the best tacos ever!',
    comments: [],
  },
  {
    id: 2,
    user: 'Gamegod',
    date: '01/03/2026',
    content: 'Giving away a free game for ps4.',
    comments: [{ user: 'curiousLoris', text: 'Hey man, would be happy to take it off your hands, but would you want a swap?' }],
  },
  {
    id: 3,
    user: 'happytunes101',
    date: '01/04/2026',
    content: 'Looking to learn guitar, if someone wants to learn piano we can swap!',
    comments: [
      { user: 'hasDaKnowledge', text: 'how many years of piano experience are you looking for? I got like 4 lol.' },
      { user: 'happytunes101', text: 'perf. hmu in DMs.' },
    ],
  },
];

export default function Posts() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = (open: boolean) => () => {
    setDrawerOpen(open);
  };

  return (
    <Box sx={{ width: '100%', mt: -4 }}>
      {/* Category Menu Bar (located under navbar) */}
      <Box
        sx={{
          width: '100vw',
          position: 'relative',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          px: { xs: 2, md: 4 },
          py: 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          mb: 3,
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        <Button
          onClick={toggleDrawer(true)}
          startIcon={<MenuIcon />}
          sx={{
            color: 'inherit',
            fontWeight: 'bold',
            textTransform: 'none',
            minWidth: 'auto',
            flexShrink: 0,
            '&:hover': { outline: '1px solid' },
          }}
        >
          All
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            sx={{
              color: 'inherit',
              textTransform: 'none',
              fontSize: '0.875rem',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              '&:hover': { outline: '1px solid' },
            }}
          >
            {category}
          </Button>
        ))}
      </Box>

      {/* Side Menu (drawer that pops out similar to a modal) */}
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box sx={{ width: 300, height: '100%', bgcolor: 'background.paper' }} role="presentation">
          <Box sx={{
            p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'primary.main', color: 'primary.contrastText',
          }}
          >
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Hello, NameHere
            </Typography>
            <IconButton onClick={toggleDrawer(false)} sx={{ color: 'inherit' }}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 'bold', px: 2, pt: 2, pb: 1,
            }}
          >
            Categories
          </Typography>
          <List sx={{ pt: 0 }}>
            {categories.map((category) => (
              <ListItem key={category} disablePadding>
                <ListItemButton onClick={toggleDrawer(false)}>
                  <ListItemText
                    primary={category}
                    slotProps={{
                      primary: {
                        sx: { fontSize: '0.9rem' },
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* New Post Button */}
      <Box sx={{
        display: 'flex', justifyContent: 'flex-end', mb: 3, px: { xs: 2, md: 0 },
      }}
      >
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            borderRadius: 8, textTransform: 'none', fontWeight: 'bold', px: 3,
          }}
        >
          New Post
        </Button>
      </Box>

      {/* User Posts */}
      <Box sx={{
        display: 'flex', flexDirection: 'column', gap: 3, px: { xs: 2, md: 0 },
      }}
      >
        {dummyPosts.map((post) => (
          <Card key={post.id} variant="outlined" sx={{ borderRadius: 3, borderColor: '#e0e0e0' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1,
              }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                    {post.user.charAt(0)}
                  </Avatar>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {post.user}
                  </Typography>
                  <Button size="small" variant="outlined" sx={{ borderRadius: 4, textTransform: 'none' }}>
                    Open DM
                  </Button>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Posted on {post.date}
                </Typography>
              </Box>

              <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
                {post.content}
              </Typography>

              <Divider sx={{ mb: 2 }} />

              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: '600', color: 'text.secondary' }}>
                Comments
              </Typography>

              {post.comments.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {post.comments.map((c) => (
                    <Box
                      key={`${c.user}-${c.text}`}
                      sx={{
                        display: 'flex', gap: 2, alignItems: 'flex-start', p: 1.5, bgcolor: '#f4f6f8', borderRadius: 2,
                      }}
                    >
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        <strong>{c.user}:</strong> {c.text}
                      </Typography>
                      <Button size="small" sx={{ textTransform: 'none', minWidth: 'auto' }}>DM</Button>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.disabled" sx={{ mb: 2, fontStyle: 'italic' }}>
                  No comments...
                </Typography>
              )}

              <Box sx={{ display: 'flex', mt: 3, gap: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Add a comment..."
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 8 } }}
                />
                <Button variant="contained" disableElevation sx={{ borderRadius: 8, textTransform: 'none' }}>
                  Send
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
