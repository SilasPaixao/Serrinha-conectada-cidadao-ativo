import { useState } from 'react';
import { Typography, Box, TextField, Button, Paper, Container, Alert, CircularProgress, MenuItem, InputAdornment, IconButton } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { Person, Email, Lock, Visibility, VisibilityOff, ArrowBack, Badge } from '@mui/icons-material';
import axios from 'axios';
import { formatErrorMessage } from '../utils/errorUtils';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    password: '',
    role: 'GOVERNMENT'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await axios.post('/api/auth/register', formData);
      if (response.data.pending) {
        setSuccessMessage(response.data.message);
      } else {
        navigate('/login');
      }
    } catch (err: any) {
      setError(formatErrorMessage(err, 'Erro ao criar conta de administrador. Verifique os dados e tente novamente.'));
    } finally {
      setLoading(false);
    }
  };

  if (successMessage) {
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
        <Container maxWidth="sm">
          <Paper 
            elevation={0} 
            sx={{ 
              p: { xs: 4, sm: 6 }, 
              borderRadius: { xs: 5, sm: 6 }, 
              border: '1px solid rgba(0,0,0,0.05)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              textAlign: 'center'
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 3, color: 'primary.main' }}>
              Cadastro Recebido!
            </Typography>
            <Alert severity="info" sx={{ mb: 4, borderRadius: 3, textAlign: 'left', py: 2 }}>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {successMessage}
              </Typography>
            </Alert>
            <Button 
              component={Link} 
              to="/login" 
              variant="contained"
              fullWidth
              sx={{ py: 1.5, borderRadius: 3, fontWeight: 700, textTransform: 'none' }}
            >
              Voltar para o Login
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
      <Container maxWidth="xs" sx={{ px: { xs: 2, sm: 3 } }}>
        <Button 
          component={Link} 
          to="/login" 
          startIcon={<ArrowBack />} 
          sx={{ mb: { xs: 2, sm: 4 }, textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
        >
          Voltar para o Login
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
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-1px' }}>Acesso Administrativo</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Cadastre-se para gerenciar as solicitações da cidade.
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
            label="Nome Completo"
            margin="normal"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person color="action" fontSize="small" />
                </InputAdornment>
              ),
              sx: { borderRadius: 3 }
            }}
          />
          <TextField
            fullWidth
            label="E-mail"
            margin="normal"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
            label="WhatsApp"
            margin="normal"
            placeholder="75999999999"
            value={formData.whatsapp}
            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
            helperText="Apenas números com DDD"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconButton size="small" sx={{ p: 0, mr: 1 }}>
                    <span style={{ fontSize: '1.2rem' }}>📱</span>
                  </IconButton>
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
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            autoComplete="new-password"
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
            select
            disabled
            fullWidth
            label="Tipo de Acesso"
            margin="normal"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Badge color="action" fontSize="small" />
                </InputAdornment>
              ),
              sx: { borderRadius: 3 }
            }}
          >
            <MenuItem value="GOVERNMENT">Zeladoria / Governo</MenuItem>
          </TextField>

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
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Cadastrar Administrador'}
          </Button>
        </form>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Já tem uma conta?{' '}
            <Link to="/login" style={{ color: '#004a8d', fontWeight: 700, textDecoration: 'none' }}>
              Faça login
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  </Box>
);
}
