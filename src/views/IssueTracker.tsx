import { useState } from 'react';
import { 
  Typography, 
  Box, 
  TextField, 
  Button, 
  Paper, 
  Divider, 
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  IconButton
} from '@mui/material';
import { Search, History, Assignment, Image as ImageIcon, Close, Visibility } from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatErrorMessage } from '../utils/errorUtils';

const statusMap: any = {
  PENDING: { label: 'Pendente', color: 'warning', icon: '⏳' },
  IN_PROGRESS: { label: 'Em Andamento', color: 'info', icon: '⚙️' },
  RESOLVED: { label: 'Resolvido', color: 'success', icon: '✅' },
  REJECTED: { label: 'Rejeitado', color: 'error', icon: '❌' },
};

export default function IssueTracker() {
  const [protocol, setProtocol] = useState('');
  const [issue, setIssue] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openImageModal, setOpenImageModal] = useState(false);

  const handleSearch = async () => {
    if (!protocol) return;
    setLoading(true);
    setError(null);
    setIssue(null);
    try {
      const response = await axios.get(`/api/issues/protocol/${protocol}`);
      setIssue(response.data);
    } catch (err: any) {
      setError(formatErrorMessage(err, 'Protocolo não encontrado. Verifique se digitou corretamente.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxWidth="md" sx={{ mx: 'auto', py: 4 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 3, md: 5 }, 
          mb: 4, 
          borderRadius: 5, 
          border: '1px solid rgba(0,0,0,0.05)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.03)'
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.5px' }}>
          Acompanhar Solicitação
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Insira o número do protocolo recebido no momento do relato para verificar o status atual.
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
          <TextField
            fullWidth
            label="Número do Protocolo"
            placeholder="Ex: SC-20240101-XXXX"
            value={protocol}
            onChange={(e) => setProtocol(e.target.value.toUpperCase())}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
          />
          <Button 
            variant="contained" 
            size="large" 
            onClick={handleSearch}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Search />}
            sx={{ borderRadius: 3, px: 4, fontWeight: 700, py: { xs: 1.5, sm: 0 } }}
          >
            Buscar
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 4, borderRadius: 3, fontWeight: 500 }}>
          {error}
        </Alert>
      )}

      {issue && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Main Info Card */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: { xs: 3, md: 4 }, 
              borderRadius: 5, 
              border: '1px solid rgba(0,0,0,0.05)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.03)'
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 4 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Assignment color="primary" sx={{ fontSize: 20 }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'text.disabled' }}>
                    Protocolo {issue.protocol}
                  </Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>{issue.category}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Registrado em {format(new Date(issue.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </Typography>
              </Box>
              <Chip 
                label={statusMap[issue.status].label} 
                color={statusMap[issue.status].color} 
                sx={{ fontWeight: 800, borderRadius: 2, px: 1 }}
              />
            </Box>

            <Divider sx={{ mb: 4, opacity: 0.6 }} />

            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.secondary' }}>Descrição do Problema</Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.7 }}>{issue.description}</Typography>
            </Box>

            {issue.imageUrl && (
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <ImageIcon color="action" sx={{ fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary' }}>Foto Anexada</Typography>
                </Box>
                <Box 
                  sx={{ 
                    position: 'relative',
                    cursor: 'pointer',
                    '&:hover .overlay': { opacity: 1 }
                  }}
                  onClick={() => setOpenImageModal(true)}
                >
                  <Box 
                    component="img"
                    src={issue.imageUrl} 
                    alt="Relato" 
                    sx={{ 
                      maxWidth: '100%', 
                      borderRadius: 4, 
                      maxHeight: 500,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      display: 'block',
                      transition: 'transform 0.2s ease',
                      '&:hover': { transform: 'scale(1.01)' }
                    }} 
                    onError={(e: any) => {
                      e.target.src = 'https://placehold.co/600x400?text=Imagem+não+encontrada';
                    }}
                  />
                  <Box 
                    className="overlay"
                    sx={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      right: 0, 
                      bottom: 0, 
                      bgcolor: 'rgba(0,0,0,0.3)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.2s ease',
                      borderRadius: 4
                    }}
                  >
                    <Box sx={{ bgcolor: 'white', px: 2, py: 1, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Visibility fontSize="small" />
                      <Typography variant="button" sx={{ fontWeight: 700 }}>Ampliar Foto</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}
          </Paper>

          {/* Image Lightbox */}
          <Dialog 
            open={openImageModal} 
            onClose={() => setOpenImageModal(false)} 
            maxWidth="lg"
            PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none', overflow: 'hidden' } }}
          >
            <Box sx={{ position: 'relative' }}>
              <IconButton 
                onClick={() => setOpenImageModal(false)}
                sx={{ position: 'absolute', top: 10, right: 10, bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'white' }, zIndex: 10 }}
              >
                <Close />
              </IconButton>
              <img 
                src={issue.imageUrl} 
                alt="Evidência Full" 
                style={{ maxWidth: '100%', maxHeight: '90vh', display: 'block', borderRadius: 16 }} 
                referrerPolicy="no-referrer"
                onError={(e: any) => {
                  e.target.src = 'https://placehold.co/800x600?text=Erro+ao+carregar+imagem';
                }}
              />
            </Box>
          </Dialog>

          {/* Timeline Card */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: { xs: 3, md: 4 }, 
              borderRadius: 5, 
              border: '1px solid rgba(0,0,0,0.05)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.03)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
              <History color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Histórico de Atualizações</Typography>
            </Box>

            {issue.history.length > 0 ? (
              <Box sx={{ ml: -2 }}>
                {issue.history.map((h: any, index: number) => (
                  <Box key={h.id} sx={{ display: 'flex', gap: 3, mb: index === issue.history.length - 1 ? 0 : 4, position: 'relative' }}>
                    {/* Visual Timeline Line */}
                    {index !== issue.history.length - 1 && (
                      <Box sx={{ position: 'absolute', left: 11, top: 24, bottom: -24, width: 2, bgcolor: 'rgba(0,0,0,0.05)' }} />
                    )}
                    
                    <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: `${statusMap[h.status].color}.light`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, mt: 0.5 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: `${statusMap[h.status].color}.main` }} />
                    </Box>
                    
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {statusMap[h.status].label}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600 }}>
                          {format(new Date(h.createdAt), "dd/MM/yyyy HH:mm")}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        {h.comment || 'Status atualizado pela equipe de zeladoria.'}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 4 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Aguardando análise inicial da equipe técnica.
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      )}
    </Box>
  );
}
