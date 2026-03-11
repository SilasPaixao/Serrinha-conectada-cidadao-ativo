import { useState, useEffect } from 'react';
import { Typography, Box, TextField, Button, Paper, Container, Alert, CircularProgress, InputAdornment, IconButton } from '@mui/material';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Visibility, VisibilityOff, ArrowBack, CheckCircle } from '@mui/icons-material';
import axios from 'axios';
import { formatErrorMessage } from '../utils/errorUtils';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setError('Token de recuperação ausente. Por favor, solicite um novo link.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/auth/reset-password', { token, password });
      setSuccess(response.data.message);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError(formatErrorMessage(err, 'Ocorreu um erro ao tentar redefinir a senha.'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'linear-gradient(rgba(248, 250, 252, 0.9), rgba(248, 250, 252, 0.9)), url("https://i.postimg.cc/SRHyxrRv/Serrinha-Image.png")',
          backgroundSize: 'cover',
          py: 8
        }}
      >
        <Container maxWidth="xs">
          <Paper 
            elevation={0} 
            sx={{ 
              p: 5, 
              borderRadius: 6, 
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>Senha Redefinida!</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Sua senha foi alterada com sucesso. Você será redirecionado para a página de login em instantes.
            </Typography>
            <Button component={Link} to="/login" variant="contained" fullWidth sx={{ borderRadius: 3, fontWeight: 700 }}>
              Ir para Login Agora
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

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
      <Container maxWidth="xs">
        <Button 
          component={Link} 
          to="/login" 
          startIcon={<ArrowBack />} 
          sx={{ mb: 4, textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
        >
          Voltar para Login
        </Button>
        
        <Paper 
          elevation={0} 
          sx={{ 
            p: 5, 
            borderRadius: 6, 
            border: '1px solid rgba(0,0,0,0.05)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-1px' }}>
              Nova Senha
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Crie uma nova senha segura para sua conta.
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
              label="Nova Senha"
              type={showPassword ? 'text' : 'password'}
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={!token || loading}
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

            <TextField
              fullWidth
              label="Confirmar Nova Senha"
              type={showPassword ? 'text' : 'password'}
              margin="normal"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={!token || loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" fontSize="small" />
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
              disabled={!token || loading}
              sx={{ 
                mt: 4, 
                py: 1.5, 
                borderRadius: 3, 
                fontWeight: 800, 
                textTransform: 'none',
                boxShadow: '0 8px 20px rgba(0,74,141,0.2)'
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Redefinir Senha'}
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}
