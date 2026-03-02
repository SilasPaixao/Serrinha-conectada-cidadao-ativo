/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Container, 
  Box, 
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  AccountCircle, 
  Home, 
  AddLocation, 
  Search, 
  Dashboard, 
  Settings, 
  Menu as MenuIcon,
  Close,
  History
} from '@mui/icons-material';
import { useState, useEffect } from 'react';

// Components
import HomeView from './views/HomeView';
import IssueWizard from './views/IssueWizard';
import IssueTracker from './views/IssueTracker';
import AdminDashboard from './views/AdminDashboard';
import Login from './views/Login';
import Register from './views/Register';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    handleClose();
    navigate('/');
  };

  const menuItems = [
    { text: 'Início', icon: <Home />, path: '/' },
    { text: 'Relatar', icon: <AddLocation />, path: '/report' },
    { text: 'Acompanhar', icon: <History />, path: '/track' },
  ];

  const drawer = (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 28, height: 28, bgcolor: 'primary.main', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14 }}>
            S
          </Box>
          Serrinha
        </Typography>
        <IconButton onClick={handleDrawerToggle}>
          <Close />
        </IconButton>
      </Box>
      <List sx={{ gap: 1, display: 'flex', flexDirection: 'column' }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
              component={Link} 
              to={item.path} 
              onClick={handleDrawerToggle}
              sx={{ borderRadius: 3, py: 1.5 }}
            >
              <ListItemIcon sx={{ color: 'primary.main', minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 3 }} />
      {!user ? (
        <Button 
          fullWidth 
          variant="contained" 
          component={Link} 
          to="/login" 
          onClick={handleDrawerToggle}
          sx={{ borderRadius: 3, py: 1.5, fontWeight: 700 }}
        >
          Entrar
        </Button>
      ) : (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ px: 2, mb: 1, display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
            Minha Conta
          </Typography>
          <List>
            { (user.role === 'ADMIN' || user.role === 'GOVERNMENT') && (
              <ListItem disablePadding>
                <ListItemButton 
                  onClick={() => { handleDrawerToggle(); navigate('/admin-government'); }}
                  sx={{ borderRadius: 3 }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}><Dashboard fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Painel Gestor" primaryTypographyProps={{ fontWeight: 600 }} />
                </ListItemButton>
              </ListItem>
            )}
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout} sx={{ borderRadius: 3, color: 'error.main' }}>
                <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}><Settings fontSize="small" /></ListItemIcon>
                <ListItemText primary="Sair" primaryTypographyProps={{ fontWeight: 600 }} />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar 
        position="sticky" 
        elevation={0} 
        sx={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.8)', 
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          color: '#1e293b'
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters>
            <Typography 
              variant="h6" 
              component={Link} 
              to="/" 
              sx={{ 
                flexGrow: 1, 
                textDecoration: 'none', 
                color: 'primary.main', 
                fontWeight: 800,
                letterSpacing: '-0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontSize: { xs: '1.1rem', sm: '1.25rem' }
              }}
            >
              <Box sx={{ width: { xs: 28, sm: 32 }, height: { xs: 28, sm: 32 }, borderRadius: 1.5, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img 
                  src="https://i.postimg.cc/CLVhXc3X/logo.jpg" 
                  alt="Logo" 
                  referrerPolicy="no-referrer"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </Box>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>Serrinha Conectada</Box>
              <Box component="span" sx={{ display: { xs: 'block', sm: 'none' } }}>Serrinha</Box>
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
                <Button 
                  color="inherit" 
                  component={Link} 
                  to="/" 
                  sx={{ fontWeight: 600, borderRadius: 2, px: 2 }}
                >
                  Início
                </Button>
              </Box>

              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ display: { md: 'none' }, ml: 1 }}
              >
                <MenuIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        variant="temporary"
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280, borderRadius: '20px 0 0 20px' },
        }}
      >
        {drawer}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, py: 4 }}>
        <Container maxWidth="lg">
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/report" element={<IssueWizard />} />
            <Route path="/track" element={<IssueTracker />} />
            <Route path="/admin-government" element={<AdminDashboard />} />
            <Route path="/login" element={<Login onLogin={(u: any) => setUser(u)} />} />
          </Routes>
        </Container>
      </Box>

      <Box 
        component="footer" 
        sx={{ 
          py: 4, 
          mt: 'auto', 
          borderTop: '1px solid rgba(0,0,0,0.05)',
          backgroundColor: 'white'
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} Prefeitura Municipal de Serrinha. Todos os direitos reservados.
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <Button 
                component={Link} 
                to="/login" 
                size="small"
                sx={{ 
                  color: 'text.disabled', 
                  textTransform: 'none',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5,
                  '&:hover': { color: 'text.secondary', bgcolor: 'transparent' }
                }}
              >
                <Settings sx={{ fontSize: 14 }} /> Acesso Restrito
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

