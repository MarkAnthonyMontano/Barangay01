// src/components/Sidebar.jsx
import React from 'react';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
} from '@mui/material';

import PeopleIcon from '@mui/icons-material/People';
import HomeIcon from '@mui/icons-material/Home';
import ReportIcon from '@mui/icons-material/Report';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import GroupsIcon from '@mui/icons-material/Groups';
import ArticleIcon from '@mui/icons-material/Article';

const drawerWidth = 240;

const Sidebar = ({ page, setPage }) => {
  const menuItems = [
    { id: 'residents', label: 'Residents', icon: <PeopleIcon /> },
    { id: 'households', label: 'Households', icon: <HomeIcon /> },
    { id: 'incidents', label: 'Incidents', icon: <ReportIcon /> },
    { id: 'services', label: 'Services', icon: <VolunteerActivismIcon /> },
    { id: 'certificates', label: 'Certificates', icon: <ArticleIcon /> },
    { id: 'officials', label: 'Officials', icon: <GroupsIcon /> },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: '#ffffff',
          border: "2px solid black",
 
        },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {menuItems.map((item) => (
            <ListItemButton
              key={item.id}
              selected={page === item.id}
              onClick={() => setPage(item.id)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
