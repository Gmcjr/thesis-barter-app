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

import NewPost, { type PostFormData } from './NewPost';

// type definitions
type Category = {
  id: number;
  name: string;
  type: 'PRODUCT' | 'SERVICE';
};

// dummy categories data
const categoryList: Category[] = [
  { id: 1, name: 'Books', type: 'PRODUCT' },
  { id: 2, name: 'Clothing, Shoes, Accessories', type: 'PRODUCT' },
  { id: 3, name: 'Collectibles', type: 'PRODUCT' },
  { id: 4, name: 'Electronics', type: 'PRODUCT' },
  { id: 5, name: 'Food and Perishables', type: 'PRODUCT' },
  { id: 6, name: 'Free/Giving Away', type: 'PRODUCT' },
  { id: 7, name: 'Handmade', type: 'PRODUCT' },
  { id: 8, name: 'Household', type: 'PRODUCT' },
  { id: 9, name: 'Movies, Music, Games', type: 'PRODUCT' },
  { id: 10, name: 'Refurbished', type: 'PRODUCT' },
  { id: 11, name: 'Services', type: 'SERVICE' },
  { id: 12, name: 'Sports & Outdoors', type: 'PRODUCT' },
  { id: 13, name: 'Pet Supplies', type: 'PRODUCT' },
];

// dummy post data
const dummyPosts = [
  {
    id: 1,
    title: 'Bike Repair for Tacos',
    user: 'taconator',
    date: '01/01/2026',
    content: 'Help me fix my bike and I will make you the best tacos ever!',
    comments: [],
  },
  {
    id: 2,
    title: 'Free PS4 Game',
    user: 'Gamegod',
    date: '01/03/2026',
    content: 'Giving away a free game for ps4.',
    comments: [{ user: 'curiousLoris', text: 'Hey man, would be happy to take it off your hands, but would you want a swap?' }],
  },
  {
    id: 3,
    title: 'Piano lessons for Guitar swap',
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
  const [modalOpen, setModalOpen] = useState(false);
  const [posts, setPosts] = useState(dummyPosts);

  const toggleDrawer = (open: boolean) => () => {
    setDrawerOpen(open);
  };

  // handler placeholder for creating a post
  const handleCreatePost = async (formData: PostFormData) => {
    const newPostItem = {
      id: Date.now(),
      title: formData.title,
      user: 'You (Logged In)',
      date: new Date().toLocaleDateString(),
      content: formData.description,
      comments: [],
    };

    // add new post to top of state
    setPosts([newPostItem, ...posts]);
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
        {categoryList.map((category) => (
          <Button
            key={category.id}
            sx={{
              color: 'inherit',
              textTransform: 'none',
              fontSize: '0.875rem',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              '&:hover': { outline: '1px solid' },
            }}
          >
            {category.name}
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
            {categoryList.map((category) => (
              <ListItem key={category.id} disablePadding>
                <ListItemButton onClick={toggleDrawer(false)}>
                  <ListItemText
                    primary={category.name}
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
          onClick={() => setModalOpen(true)} // 4. Open modal when clicked
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
        {posts.map((post) => (
          <Card key={post.id} variant="outlined" sx={{ borderRadius: 3, borderColor: '#e0e0e0' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>

              {/* title, date, user details and DM */}
              <Box sx={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1,
              }}
              >
                {/* title and posted date */}
                <Box sx={{
                  display: 'flex', alignItems: 'baseline', gap: 1.5, flexWrap: 'wrap',
                }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {post.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Posted on {post.date}
                  </Typography>
                </Box>

                {/* user avatar, name, and DM button */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{
                    bgcolor: 'primary.main', width: 32, height: 32, fontSize: '0.9rem',
                  }}
                  >
                    {post.user.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {post.user}
                  </Typography>
                  <Button size="small" variant="outlined" sx={{ borderRadius: 4, textTransform: 'none' }}>
                    Open DM
                  </Button>
                </Box>
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

      {/* NewPost Modal */}
      <NewPost
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreatePost}
        categories={categoryList}
      />
    </Box>
  );
}
