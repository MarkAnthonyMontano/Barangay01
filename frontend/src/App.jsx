// src/App.jsx
import React, { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import PeopleIcon from '@mui/icons-material/People';
import HomeIcon from '@mui/icons-material/Home';
import ReportIcon from '@mui/icons-material/Report';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import LogoutIcon from '@mui/icons-material/Logout';
import CertificatesPage from './pages/CertificatesPage';
import ResidentsPage from './pages/ResidentsPage.jsx';
import HouseholdsPage from './pages/HouseholdsPage.jsx';
import IncidentsPage from './pages/IncidentsPage.jsx';
import ServicesPage from './pages/ServicesPage.jsx';
import ResidentIDCard from './pages/ResidentIDCard.jsx';
import Sidebar from './components/Sidebar.jsx';
import AboutUs from './components/AboutUs.jsx';
import AuthPage from './pages/AuthPage.jsx';
import { setAuthToken } from './api.js';
import OfficialsPage from './pages/OfficialsPage.jsx';

const App = () => {
  const [page, setPage] = useState('residents');
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  const handleLogin = ({ token, user }) => {
    setToken(token);
    setUser(user);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthToken(null);
  };

  const renderPage = () => {
    switch (page) {
      case 'residents':
        return <ResidentsPage />;
      case 'households':
        return <HouseholdsPage />;
      case 'incidents':
        return <IncidentsPage />;
      case 'services':
        return <ServicesPage />;
      case 'certificates':
        return <CertificatesPage />;
      case 'officials':
        return <OfficialsPage />;
         case 'aboutus':
        return <AboutUs />;
          case 'residentidcard':
        return <ResidentIDCard />;
        
      default:
        return <ResidentsPage />;
    }
  };

  // If not logged in, show AuthPage
  if (!token || !user) {
    return <AuthPage onLogin={handleLogin} />
  }

 return (
  <Box
    sx={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: '#f5f5f5'
    }}
  >
    {/* ===== HEADER / APP BAR ===== */}
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Barangay Information System
        </Typography>

        <Button
          color={page === 'residents' ? 'secondary' : 'inherit'}
          startIcon={<PeopleIcon />}
          onClick={() => setPage('residents')}
        >
          Residents
        </Button>
        <Button
          color={page === 'households' ? 'secondary' : 'inherit'}
          startIcon={<HomeIcon />}
          onClick={() => setPage('households')}
        >
          Households
        </Button>
        <Button
          color={page === 'incidents' ? 'secondary' : 'inherit'}
          startIcon={<ReportIcon />}
          onClick={() => setPage('incidents')}
        >
          Incidents
        </Button>
        <Button
          color={page === 'services' ? 'secondary' : 'inherit'}
          startIcon={<VolunteerActivismIcon />}
          onClick={() => setPage('services')}
        >
          Services
        </Button>
        <Button
          color={page === 'certificates' ? 'secondary' : 'inherit'}
          onClick={() => setPage('certificates')}
        >
          Certificates
        </Button>
        <Button
          color={page === 'officials' ? 'secondary' : 'inherit'}
          startIcon={<GroupsIcon />}
          onClick={() => setPage('officials')}
        >
          Officials
        </Button>
           <Button
          color={page === 'aboutus' ? 'secondary' : 'inherit'}
          startIcon={<GroupsIcon />}
          onClick={() => setPage('aboutus')}
        >
         About Us
        </Button>
           <Button
          color={page === 'residentidcard' ? 'secondary' : 'inherit'}
          startIcon={<ResidentIDCard />}
          onClick={() => setPage('residentidcard')}
        >
         About Us
        </Button>


        <Typography variant="body2" sx={{ mx: 2 }}>
          {user?.full_name} ({user?.role})
        </Typography>
        <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>
          Logout
        </Button>
      </Toolbar>
    </AppBar>

    {/* ===== PAGE CONTENT ===== */}
    <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
      {renderPage()}
    </Box>

    {/* ===== FOOTER ===== */}
    <Box
      component="footer"
      sx={{
        width: '100%',
        textAlign: 'center',
        py: 2,
        display: "relative",
        bgcolor: '#1976d2',
        color: 'white',
        mt: 'auto'
      }}
    >
      © {new Date().getFullYear()} Barangay Information System — All Rights Reserved
    </Box>
  </Box>
);

};

export default App;
