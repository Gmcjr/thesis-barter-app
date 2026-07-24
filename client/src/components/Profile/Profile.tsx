import React from 'react';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

function Profile() {
  return (
    <Box sx={{ width: '100%', mt: -4 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          allignItems: 'center',
          gap: 1,
        }}
      >
        <Avatar
          sx={{
            bgcolor: 'primary.main',
            width: 100,
            height: 100,
            fontSize: '2.4rem',
          }}
        >
          D
        </Avatar>
        <Card>
          <CardContent>
            <Typography>
              Devin Delgado
            </Typography>
            <Typography>

              User since: 1468
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          allignItems: 'center',
          gap: 1,
        }}
      >
        <Box>
          <Card>
            <CardContent>
              <Typography>
                POST
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}

export default Profile;
