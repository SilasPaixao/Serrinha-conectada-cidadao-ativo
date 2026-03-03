import { Typography, Box, Grid, Card, CardContent, Button, Stack, Avatar } from '@mui/material';
import { AddLocation, Search, Info, CheckCircleOutline, TrendingUp, People } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

const MotionBox = motion.create(Box);
const MotionGrid = motion.create(Grid);

export default function HomeView() {
  return (
    <Box>
      {/* Hero Section */}
      <MotionBox 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        sx={{ 
          py: { xs: 8, md: 12 }, 
          px: { xs: 3, md: 6 },
          textAlign: 'center', 
          background: 'linear-gradient(135deg, rgba(0, 74, 141, 0.9) 0%, rgba(0, 45, 90, 0.95) 100%), url("https://i.postimg.cc/SRHyxrRv/Serrinha-Image.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'white', 
          borderRadius: { xs: 4, md: 8 }, 
          mb: { xs: 4, md: 8 },
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 74, 141, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Typography 
              variant="h2" 
              gutterBottom 
              sx={{ 
                fontWeight: 900, 
                fontSize: { xs: '2.25rem', sm: '3rem', md: '4rem' },
                letterSpacing: '-1.5px',
                mb: 2,
                lineHeight: 1.1
              }}
            >
              Cidadão Ativo
            </Typography>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 6, 
                opacity: 0.9, 
                maxWidth: 700, 
                mx: 'auto',
                fontWeight: 400,
                lineHeight: 1.6,
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}
            >
              A plataforma oficial para você participar ativamente da zeladoria e melhoria da nossa cidade.
            </Typography>
          </motion.div>

          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            justifyContent="center"
            sx={{ width: { xs: '100%', sm: 'auto' }, mx: 'auto' }}
          >
            <Button 
              variant="contained" 
              color="secondary" 
              size="large" 
              component={Link} 
              to="/report"
              fullWidth={{ xs: true, sm: false } as any}
              sx={{ 
                fontWeight: 800, 
                px: 5, 
                py: 2, 
                borderRadius: 4,
                textTransform: 'none',
                fontSize: '1.1rem',
                boxShadow: '0 12px 24px rgba(245, 130, 32, 0.4)'
              }}
            >
              Relatar Problema
            </Button>
            <Button 
              variant="outlined" 
              size="large" 
              component={Link} 
              to="/track"
              fullWidth={{ xs: true, sm: false } as any}
              sx={{ 
                fontWeight: 800, 
                px: 5, 
                py: 2, 
                borderRadius: 4,
                textTransform: 'none',
                fontSize: '1.1rem',
                color: 'white',
                borderColor: 'rgba(255,255,255,0.4)',
                backdropFilter: 'blur(4px)',
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.15)' }
              }}
            >
              Acompanhar Protocolo
            </Button>
          </Stack>
        </Box>
        
        {/* Decorative elements */}
        <MotionBox 
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          sx={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} 
        />
        <MotionBox 
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 20, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          sx={{ position: 'absolute', bottom: -50, left: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} 
        />
      </MotionBox>

      {/* Stats / Features Grid */}
      <Grid container spacing={3} sx={{ mb: 8 }}>
        {[
          { 
            icon: <AddLocation sx={{ color: 'primary.main' }} />, 
            title: 'Relato Fácil', 
            desc: 'Identificou algo que precisa de atenção? Envie fotos e localização em poucos segundos.',
            link: '/report',
            btn: 'Começar agora →',
            color: 'primary.light'
          },
          { 
            icon: <TrendingUp sx={{ color: 'secondary.main' }} />, 
            title: 'Transparência', 
            desc: 'Acompanhe cada etapa do processo, desde a triagem até a resolução final pela prefeitura.',
            link: '/track',
            btn: 'Verificar status →',
            color: 'secondary.light'
          },
          { 
            icon: <People sx={{ color: 'success.main' }} />, 
            title: 'Cidadania', 
            desc: 'Sua participação ajuda a prefeitura a priorizar as demandas mais urgentes da nossa comunidade.',
            link: '#how-it-works',
            btn: 'Saiba como funciona →',
            color: 'success.light'
          }
        ].map((item, i) => (
          <Grid size={{ xs: 12, md: 4 }} key={i}>
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <Card sx={{ borderRadius: 4, border: '1px solid rgba(0,0,0,0.05)', height: '100%', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 12px 30px rgba(0,0,0,0.05)' } }}>
                <CardContent sx={{ p: 4 }}>
                  <Avatar sx={{ bgcolor: item.color, mb: 3, width: 56, height: 56 }}>
                    {item.icon}
                  </Avatar>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{item.title}</Typography>
                  <Typography color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                    {item.desc}
                  </Typography>
                  <Button 
                    component={item.link.startsWith('#') ? 'a' : Link} 
                    to={item.link.startsWith('#') ? undefined : item.link}
                    href={item.link.startsWith('#') ? item.link : undefined}
                    variant="text" 
                    sx={{ fontWeight: 700, p: 0, '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}
                  >
                    {item.btn}
                  </Button>
                </CardContent>
              </Card>
            </MotionBox>
          </Grid>
        ))}
      </Grid>

      {/* How it works section */}
      <MotionBox 
        id="how-it-works"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        sx={{ bgcolor: 'white', p: { xs: 4, md: 8 }, borderRadius: 6, border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', scrollMarginTop: 100 }}
      >
        <Typography variant="h4" align="center" sx={{ fontWeight: 800, mb: 6 }}>Como funciona?</Typography>
        <Grid container spacing={6}>
          {[
            { icon: <AddLocation />, title: '1. Relate', desc: 'Tire uma foto e descreva o problema encontrado.' },
            { icon: <Search />, title: '2. Protocolo', desc: 'Receba um número único para acompanhar sua demanda.' },
            { icon: <CheckCircleOutline />, title: '3. Resolução', desc: 'A prefeitura analisa, executa e informa a conclusão.' }
          ].map((item, i) => (
            <Grid size={{ xs: 12, md: 4 }} key={i} sx={{ textAlign: 'center' }}>
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Box sx={{ display: 'inline-flex', p: 2, borderRadius: '50%', bgcolor: 'primary.main', color: 'white', mb: 3, boxShadow: '0 8px 16px rgba(0,74,141,0.2)' }}>
                  {item.icon}
                </Box>
              </motion.div>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{item.title}</Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 250, mx: 'auto' }}>{item.desc}</Typography>
            </Grid>
          ))}
        </Grid>
      </MotionBox>
    </Box>
  );
}
