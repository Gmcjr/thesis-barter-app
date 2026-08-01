// import React from 'react';
// import Box from '@mui/material/Box';
// import Typography from '@mui/material/Typography';
// import Switch from '@mui/material/Switch';
// import FormControlLabel from '@mui/material/FormControlLabel';
// import { useSettings } from '../../context/SettingsContext';

// export default function Settings() {
//   const { mode, setMode } = useSettings();

//   return (
//     <Box sx={{ px: { xs: 2, md: 0 } }}>
//       <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
//         Settings
//       </Typography>

//       <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
//         Appearance
//       </Typography>
//       <FormControlLabel
//         control={(
//           <Switch
//             checked={mode === 'dark'}
//             onChange={(e) => setMode(e.target.checked ? 'dark' : 'light')}
//           />
//         )}
//         label="Dark mode"
//       />
//     </Box>
//   );
// }
