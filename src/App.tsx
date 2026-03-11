/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Routes, Route, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
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
  ListItemText,
  useMediaQuery,
  useTheme
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
import ResetPassword from './views/ResetPassword';

export default function App() {
  const [user, setUser] = useState<any>(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    // Se tiver usuário mas não tiver token, limpa tudo
    if (savedUser && !token) {
      localStorage.removeItem('user');
      return null;
    }
    
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const poleId = params.get('p');
    if (poleId) {
      console.log(`📍 Poste detectado via QR Code: ${poleId}`);
      localStorage.setItem('last_pole_id', poleId);
    }
  }, [location]);

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 28, height: 28, bgcolor: 'primary.main', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, fontWeight: 800 }}>
            S
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
            Prefeitura de Serrinha
          </Typography>
        </Box>
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
      {user && (
        <>
          <Divider sx={{ my: 3 }} />
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ px: 2, mb: 1, display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
              Minha Conta
            </Typography>
            <List>
              { (user.role === 'ADMIN' || user.role === 'GOVERNMENT') && !isMobile && (
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
        </>
      )}
    </Box>
  );

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        backgroundImage: `
          radial-gradient(at 0% 0%, rgba(0, 74, 141, 0.08) 0px, transparent 50%),
          radial-gradient(at 100% 100%, rgba(245, 130, 32, 0.08) 0px, transparent 50%),
          linear-gradient(rgba(248, 250, 252, 0.95), rgba(248, 250, 252, 0.95)),
          url("https://i.postimg.cc/9fvzmCCf/brasao-serrinha-bahia-logo-png-seeklogo-432520.png")
        `,
        backgroundSize: 'auto, auto, auto, 500px',
        backgroundRepeat: 'no-repeat, no-repeat, no-repeat, repeat',
        backgroundAttachment: 'fixed',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'fixed',
          top: '5%',
          left: '-12%',
          width: '700px',
          height: '700px',
          backgroundImage: 'url("https://i.postimg.cc/9fvzmCCf/brasao-serrinha-bahia-logo-png-seeklogo-432520.png")',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          opacity: 0.012,
          zIndex: 0,
          pointerEvents: 'none',
          filter: 'grayscale(100%) brightness(1.3)',
        },
        '&::after': {
          content: '""',
          position: 'fixed',
          bottom: '5%',
          right: '-12%',
          width: '600px',
          height: '600px',
          backgroundImage: 'url("https://i.postimg.cc/9fvzmCCf/brasao-serrinha-bahia-logo-png-seeklogo-432520.png")',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          opacity: 0.012,
          zIndex: 0,
          pointerEvents: 'none',
          filter: 'grayscale(100%) brightness(1.3)',
        }
      }}
    >
      <AppBar 
        position="sticky" 
        elevation={0} 
        sx={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.8)', 
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          color: '#1e293b',
          zIndex: 1100
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters>
            <Box 
              component={Link} 
              to="/" 
              sx={{ 
                flexGrow: 1, 
                textDecoration: 'none', 
                color: 'primary.main', 
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
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
              <Typography 
                variant="h6" 
                component="span"
                sx={{ 
                  fontWeight: 800,
                  letterSpacing: '-0.5px',
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                Prefeitura de Serrinha - Cidadão ativo!
              </Typography>
              <Typography 
                variant="h6" 
                component="span"
                sx={{ 
                  fontWeight: 800,
                  letterSpacing: '-0.5px',
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  display: { xs: 'block', sm: 'none' }
                }}
              >
                Serrinha
              </Typography>
            </Box>
            
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

      <Box component="main" sx={{ flexGrow: 1, py: 4, position: 'relative', zIndex: 1 }}>
        <Container maxWidth="lg">
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/report" element={<IssueWizard />} />
            <Route path="/track" element={<IssueTracker />} />
            <Route 
              path="/admin-government" 
              element={user && (user.role === 'ADMIN' || user.role === 'GOVERNMENT') ? <AdminDashboard /> : <Navigate to="/" replace />} 
            />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login onLogin={(u: any) => setUser(u)} />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>
        </Container>
      </Box>

      <Box 
        component="footer" 
        sx={{ 
          py: 4, 
          mt: 'auto', 
          borderTop: '1px solid rgba(0,0,0,0.05)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(4px)',
          position: 'relative',
          zIndex: 1
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

