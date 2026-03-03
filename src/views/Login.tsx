import { useState, useEffect } from 'react';
import { Typography, Box, TextField, Button, Paper, Container, Alert, CircularProgress, InputAdornment, IconButton, Divider } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { Email, Lock, Visibility, VisibilityOff, ArrowBack } from '@mui/icons-material';
import axios from 'axios';
import { formatErrorMessage } from '../utils/errorUtils';

export default function Login({ onLogin }: { onLogin: (user: any) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      if (user.role === 'ADMIN' || user.role === 'GOVERNMENT') {
        navigate('/admin-government');
      }
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onLogin(response.data.user);
      const user = response.data.user;
      if (user.role === 'ADMIN' || user.role === 'GOVERNMENT') {
        navigate('/admin-government');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else if (err.response && err.response.status === 401) {
        setError('E-mail ou senha incorretos.');
      } else {
        setError(formatErrorMessage(err, 'Ocorreu um erro ao tentar entrar.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(rgba(248, 250, 252, 0.9), rgba(248, 250, 252, 0.9)), url("https://i.postimg.cc/SRHyxrRv/Serrinha-Image.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        py: 8
      }}
    >
      <Container maxWidth="xs" sx={{ px: { xs: 2, sm: 3 } }}>
        <Button 
          component={Link} 
          to="/" 
          startIcon={<ArrowBack />} 
          sx={{ mb: { xs: 2, sm: 4 }, textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
        >
          Voltar para o Início
        </Button>
        
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 3, sm: 5 }, 
            borderRadius: { xs: 5, sm: 6 }, 
            border: '1px solid rgba(0,0,0,0.05)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            width: '100%'
          }}
        >
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Box 
            sx={{ 
              width: 60, 
              height: 60, 
              bgcolor: 'primary.main', 
              borderRadius: 3, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
              boxShadow: '0 8px 16px rgba(0,74,141,0.2)'
            }}
          >
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 900 }}>S</Typography>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-1px' }}>Entrar</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Acesse o painel do Serrinha Conectada
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 3, fontWeight: 500 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="E-mail"
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email color="action" fontSize="small" />
                </InputAdornment>
              ),
              sx: { borderRadius: 3 }
            }}
          />
          <TextField
            fullWidth
            label="Senha"
            type={showPassword ? 'text' : 'password'}
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="action" fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
              sx: { borderRadius: 3 }
            }}
          />
          
          <Button
            fullWidth
            variant="contained"
            size="large"
            type="submit"
            disabled={loading}
            sx={{ 
              mt: 4, 
              py: 1.5, 
              borderRadius: 3, 
              fontWeight: 800, 
              fontSize: '1rem',
              textTransform: 'none',
              boxShadow: '0 8px 20px rgba(0,74,141,0.2)'
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar na Conta'}
          </Button>
          
          <Box sx={{ mt: 2, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button 
              variant="text" 
              size="small"
              onClick={() => alert("O procedimento no caso de senhas esquecidas é: Solicitar um cadastro como Admin")}
              sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 600 }}
            >
              Esqueci minha senha
            </Button>
            
            <Divider sx={{ my: 1, opacity: 0.5 }}>ou</Divider>
            
            <Button 
              component={Link}
              to="/register"
              variant="outlined" 
              fullWidth
              sx={{ 
                textTransform: 'none', 
                borderRadius: 3, 
                fontWeight: 700,
                py: 1,
                borderWidth: 2,
                '&:hover': { borderWidth: 2 }
              }}
            >
              Solicitar Cadastro como Admin
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  </Box>
);
}
