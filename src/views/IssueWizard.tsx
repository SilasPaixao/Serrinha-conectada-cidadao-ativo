import { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Stepper, 
  Step, 
  StepLabel, 
  Button, 
  TextField, 
  Paper,
  CircularProgress,
  Alert,
  Container,
  Card,
  CardActionArea,
  Grid,
  IconButton,
  useTheme,
  useMediaQuery,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { CloudUpload, LocationOn, Description, CheckCircle, ArrowBack, ArrowForward, MyLocation } from '@mui/icons-material';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';

// Fix for default marker icon in Leaflet
let DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const categories = [
  { name: 'Lixo (coleta atrasada, entulho, acúmulo)', icon: '🗑️' },
  { name: 'Iluminação pública (Poste apagado, Luz piscando)', icon: '💡' },
  { name: 'Buracos em vias públicas', icon: '🛣️' },
  { name: 'Esgoto (vazamento, esgoto a céu aberto)', icon: '💧' }
];

function LocationMarker({ position, setPosition }: any) {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], map.getZoom());
    }
  }, [position, map]);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export default function IssueWizard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [protocol, setProtocol] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    category: '',
    description: '',
    latitude: -11.6642,
    longitude: -39.0075,
    address: '',
    street: '',
    neighborhood: '',
    referencePoint: '',
    reporterEmail: '',
    useMapLocation: true
  });
  const [image, setImage] = useState<File | null>(null);
  const [position, setPosition] = useState<any>({ lat: -11.6642, lng: -39.0075 });

  const detectLocation = async () => {
    setLoading(true);
    // Try browser geolocation first
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setPosition(newPos);
          setLoading(false);
        },
        async (err) => {
          console.warn("Geolocation denied or failed, falling back to IP", err);
          await fallbackToIP();
        },
        { timeout: 10000 }
      );
    } else {
      await fallbackToIP();
    }
  };

  const fallbackToIP = async () => {
    try {
      const res = await axios.get('https://ipapi.co/json/');
      if (res.data.latitude && res.data.longitude) {
        setPosition({ lat: res.data.latitude, lng: res.data.longitude });
      }
    } catch (e) {
      console.error("IP Location fallback failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    detectLocation();
  }, []);

  // Reverse Geocoding logic
  useEffect(() => {
    const reverseGeocode = async () => {
      if (!formData.useMapLocation || !position) return;
      
      setGeocoding(true);
      try {
        const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${position.lat}&lon=${position.lng}`);
        const address = res.data.address;
        
        setFormData(prev => ({
          ...prev,
          street: address.road || address.pedestrian || address.suburb || '',
          neighborhood: address.neighbourhood || address.suburb || address.city_district || '',
          address: res.data.display_name
        }));
      } catch (e) {
        console.error("Reverse geocoding failed", e);
      } finally {
        setGeocoding(false);
      }
    };

    const timer = setTimeout(reverseGeocode, 500);
    return () => clearTimeout(timer);
  }, [position, formData.useMapLocation]);

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = new FormData();
      const fullAddress = `${formData.street}${formData.neighborhood ? ', ' + formData.neighborhood : ''}${formData.referencePoint ? ' (Ref: ' + formData.referencePoint + ')' : ''}`;
      
      data.append('data', JSON.stringify({
        category: formData.category,
        description: formData.description,
        latitude: position.lat,
        longitude: position.lng,
        address: fullAddress || formData.address,
        reporterEmail: formData.reporterEmail || undefined
      }));
      if (image) data.append('image', image);

      const response = await axios.post('/api/issues', data);
      setProtocol(response.data.protocol);
      handleNext();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao enviar relato');
    } finally {
      setLoading(false);
    }
  };

  const steps = ['Categoria', 'Detalhes', 'Localização', 'Foto', 'Contato'];

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Qual o tipo de problema?</Typography>
            <Grid container spacing={2}>
              {categories.map((cat) => (
                <Grid size={{ xs: 6 }} key={cat.name}>
                  <Card 
                    sx={{ 
                      borderRadius: 3, 
                      border: formData.category === cat.name ? '2px solid' : '1px solid',
                      borderColor: formData.category === cat.name ? 'primary.main' : 'rgba(0,0,0,0.08)',
                      bgcolor: formData.category === cat.name ? 'primary.light' : 'white',
                      transition: 'all 0.2s'
                    }}
                  >
                    <CardActionArea 
                      onClick={() => setFormData({ ...formData, category: cat.name })}
                      sx={{ p: 2, textAlign: 'center' }}
                    >
                      <Typography variant="h4" sx={{ mb: 1 }}>{cat.icon}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.875rem', lineHeight: 1.2 }}>{cat.name}</Typography>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Descreva o que aconteceu</Typography>
            <TextField
              label="Descrição detalhada"
              multiline
              rows={6}
              fullWidth
              required
              error={formData.description.trim() === ''}
              helperText={formData.description.trim() === '' ? 'Campo obrigatório' : ''}
              placeholder="Ex: Lâmpada do poste em frente à casa 123 está queimada há 3 dias..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
          </Box>
        );
      case 2:
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Onde fica o problema?</Typography>
              <IconButton size="small" onClick={detectLocation} disabled={loading} color="primary">
                <MyLocation fontSize="small" />
              </IconButton>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Arraste o mapa ou clique para marcar o local exato.</Typography>
            
            <Box sx={{ height: 300, width: '100%', borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)', mb: 2, position: 'relative' }}>
              {loading && (
                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(255,255,255,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CircularProgress size={32} />
                </Box>
              )}
              <MapContainer center={[position.lat, position.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationMarker position={position} setPosition={setPosition} />
              </MapContainer>
            </Box>

            <FormControlLabel
              control={
                <Checkbox 
                  checked={formData.useMapLocation} 
                  onChange={(e) => setFormData({ ...formData, useMapLocation: e.target.checked })}
                />
              }
              label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Usar a localização do mapa</Typography>}
              sx={{ mb: 2 }}
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Rua"
                  fullWidth
                  required
                  error={!formData.street}
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  disabled={formData.useMapLocation && geocoding}
                  InputProps={{
                    endAdornment: formData.useMapLocation && geocoding ? <CircularProgress size={16} /> : null
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Bairro"
                  fullWidth
                  required
                  error={!formData.neighborhood}
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  disabled={formData.useMapLocation && geocoding}
                  InputProps={{
                    endAdornment: formData.useMapLocation && geocoding ? <CircularProgress size={16} /> : null
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Ponto de Referência"
                  fullWidth
                  placeholder="Ex: Próximo à Padaria do João"
                  value={formData.referencePoint}
                  onChange={(e) => setFormData({ ...formData, referencePoint: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
              </Grid>
            </Grid>
          </Box>
        );
      case 3:
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Anexe uma foto do Lixo, Poste, buraco ou esgoto em questão</Typography>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 4, 
                borderRadius: 4, 
                borderStyle: 'dashed', 
                bgcolor: 'rgba(0,0,0,0.01)',
                cursor: 'pointer',
                borderWidth: 2,
                borderColor: 'primary.main',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2
              }}
              onClick={() => document.getElementById('raised-button-file')?.click()}
            >
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="raised-button-file"
                type="file"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
              />
              <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="body1" sx={{ fontWeight: 700 }}>Clique para selecionar ou tirar uma foto</Typography>
              <Typography variant="caption" color="text.secondary">Formatos aceitos: JPG, PNG</Typography>
              
              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById('raised-button-file')?.click();
                  }}
                  sx={{ borderRadius: 2, fontWeight: 700 }}
                >
                  CARREGAR / TIRAR FOTO
                </Button>
              </Box>
            </Paper>
            
            {image && (
              <Box sx={{ mt: 3, position: 'relative', display: 'inline-block' }}>
                <img 
                  src={URL.createObjectURL(image)} 
                  alt="Preview" 
                  style={{ maxWidth: '100%', maxHeight: 250, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                />
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>{image.name}</Typography>
              </Box>
            )}
          </Box>
        );
      case 4:
        return (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Deseja receber atualizações por e-mail?</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Informe seu e-mail para receber o número do protocolo e ser avisado quando houver mudanças no status do seu relato.
            </Typography>
            <TextField
              label="Seu E-mail (opcional)"
              type="email"
              fullWidth
              placeholder="exemplo@email.com"
              value={formData.reporterEmail}
              onChange={(e) => setFormData({ ...formData, reporterEmail: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
            <Alert severity="info" sx={{ mt: 3, borderRadius: 3 }}>
              O e-mail é opcional, mas recomendado para que você não perca o número do protocolo.
            </Alert>
          </Box>
        );
      case 5:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Box sx={{ width: 80, height: 80, bgcolor: 'success.light', color: 'success.main', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
              <CheckCircle sx={{ fontSize: 48 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Enviado!</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>Seu relato foi registrado com sucesso.</Typography>
            
            <Paper sx={{ p: 3, bgcolor: 'primary.light', borderRadius: 4, mb: 4 }}>
              <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1 }}>Protocolo</Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.main', mt: 1 }}>{protocol}</Typography>
            </Paper>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Você pode usar este número para acompanhar o andamento da sua solicitação na página inicial.
            </Typography>
            
            <Button 
              variant="contained" 
              fullWidth 
              size="large" 
              onClick={() => window.location.href = '/'}
              sx={{ borderRadius: 3, py: 1.5, fontWeight: 700 }}
            >
              Voltar ao Início
            </Button>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, mb: 8 }}>
        {activeStep < 5 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Relatar Problema</Typography>
            <Typography variant="body1" color="text.secondary">Siga os passos para nos informar sobre a zeladoria.</Typography>
          </Box>
        )}

        {activeStep < 5 && (
          <Stepper 
            activeStep={activeStep} 
            orientation={isMobile ? 'vertical' : 'horizontal'}
            sx={{ 
              mb: 6, 
              '& .MuiStepLabel-label': { fontWeight: 600 },
              '& .MuiStep-root': { py: { xs: 1, sm: 0 } }
            }}
          >
            {steps.map((label) => (
              <Step key={label}><StepLabel>{label}</StepLabel></Step>
            ))}
          </Stepper>
        )}

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}

        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 5, border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
          <Box sx={{ minHeight: 350 }}>
            {renderStepContent(activeStep)}
          </Box>

          {activeStep < 5 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 6 }}>
              {activeStep === steps.length - 1 && (!formData.category || !formData.description.trim() || !formData.street || !formData.neighborhood) && (
                <Alert severity="warning" sx={{ borderRadius: 3 }}>
                  Por favor, volte e preencha todos os campos obrigatórios (Categoria, Descrição, Rua e Bairro).
                </Alert>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button 
                  disabled={activeStep === 0} 
                  onClick={handleBack}
                  startIcon={<ArrowBack />}
                  sx={{ fontWeight: 700 }}
                >
                  Voltar
                </Button>
                
                {activeStep === steps.length - 1 ? (
                  <Button 
                    variant="contained" 
                    onClick={handleSubmit} 
                    disabled={loading || !formData.category || !formData.description.trim() || !formData.street || !formData.neighborhood}
                    sx={{ borderRadius: 3, px: 4, fontWeight: 700 }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Finalizar Relato'}
                  </Button>
                ) : (
                  <Button 
                    variant="contained" 
                    onClick={handleNext}
                    disabled={
                      (activeStep === 0 && !formData.category) ||
                      (activeStep === 1 && !formData.description.trim()) ||
                      (activeStep === 2 && (!position || !formData.street || !formData.neighborhood))
                    }
                    endIcon={<ArrowForward />}
                    sx={{ borderRadius: 3, px: 4, fontWeight: 700 }}
                  >
                    Próximo
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
}
