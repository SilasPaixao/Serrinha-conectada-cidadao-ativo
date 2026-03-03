import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Typography, 
  Box, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Card,
  Grid,
  Avatar,
  Stack,
  Tabs,
  Tab,
  InputAdornment,
  Divider,
  Fade,
  CircularProgress
} from '@mui/material';
import { 
  Edit, 
  Download, 
  PictureAsPdf, 
  Assessment, 
  PendingActions, 
  CheckCircle, 
  ErrorOutline,
  FilterList,
  Map as MapIcon,
  List as ListIcon,
  Delete,
  Search,
  Refresh,
  LocationOn,
  Logout,
  ImageNotSupported,
  Visibility,
  Close,
  OpenInNew
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatErrorMessage } from '../utils/errorUtils';

// Fix Leaflet icon issue using CDN URLs
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const statusMap: any = {
  PENDING: { label: 'Pendente', color: 'warning', icon: <PendingActions sx={{ fontSize: 16 }} />, bg: '#fff7ed', text: '#9a3412' },
  IN_PROGRESS: { label: 'Em Execução', color: 'info', icon: <Assessment sx={{ fontSize: 16 }} />, bg: '#f0f9ff', text: '#0369a1' },
  RESOLVED: { label: 'Executado', color: 'success', icon: <CheckCircle sx={{ fontSize: 16 }} />, bg: '#f0fdf4', text: '#15803d' },
  REJECTED: { label: 'Rejeitado', color: 'error', icon: <ErrorOutline sx={{ fontSize: 16 }} />, bg: '#fef2f2', text: '#b91c1c' },
};

const categories = [
  'Iluminação Pública',
  'Buracos em Vias',
  'Limpeza Urbana',
  'Esgoto/Drenagem',
  'Poda de Árvores',
  'Sinalização',
  'Outros'
];

const neighborhoods = [
  'Centro',
  'Vaquejada',
  'Cidade Nova',
  'Ginásio',
  'Rodoviária',
  'Novo Horizonte',
  'Oséas',
  'Urbis',
  'Bomba',
  'Colina das Mangueiras',
  'Cruzeiro',
  'Santa',
  'Vila de Fátima',
  'Morena Bela'
].sort();

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [issues, setIssues] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openImageModal, setOpenImageModal] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openStatusConfirmDialog, setOpenStatusConfirmDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [comment, setComment] = useState('');
  const [manualMessage, setManualMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [viewTab, setViewTab] = useState(0);
  
  // SMTP Test
  const [openEmailTestDialog, setOpenEmailTestDialog] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterNeighborhood, setFilterNeighborhood] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const currentUser = useMemo(() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }, []);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/issues', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIssues(response.data);
    } catch (err) {
      console.error('Erro ao buscar relatos', err);
      alert(formatErrorMessage(err, 'Erro ao buscar relatos'));
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    setLoadingRequests(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/pending-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingRequests(response.data);
    } catch (err) {
      console.error('Erro ao buscar solicitações pendentes', err);
      alert(formatErrorMessage(err, 'Erro ao buscar solicitações pendentes'));
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchIssues();
    fetchPendingRequests();
  }, []);

  const handleApproveRequest = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/admin/approve-request/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPendingRequests();
      alert('Solicitação aprovada com sucesso!');
    } catch (err) {
      alert(formatErrorMessage(err, 'Erro ao aprovar solicitação'));
    }
  };

  const handleRejectRequest = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja rejeitar esta solicitação?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/admin/reject-request/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPendingRequests();
      alert('Solicitação rejeitada com sucesso!');
    } catch (err) {
      alert(formatErrorMessage(err, 'Erro ao rejeitar solicitação'));
    }
  };

  const handleUpdateStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/admin/issues/${selectedIssue.id}/status`, 
        { status: newStatus, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOpenStatusConfirmDialog(false);
      setOpenDialog(false);
      setComment('');
      fetchIssues();
    } catch (err) {
      console.error('Erro ao atualizar status', err);
      alert(formatErrorMessage(err, 'Erro ao atualizar status'));
    }
  };

  const handleSendManualEmail = async () => {
    if (!manualMessage.trim()) return;
    setSendingEmail(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/admin/issues/${selectedIssue.id}/send-email`, 
        { message: manualMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setManualMessage('');
      alert('E-mail enviado com sucesso!');
    } catch (err: any) {
      console.error('Erro ao enviar e-mail', err);
      alert(formatErrorMessage(err, 'Erro ao enviar e-mail'));
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDeleteIssue = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/issues/${selectedIssue.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOpenDeleteDialog(false);
      fetchIssues();
    } catch (err) {
      console.error('Erro ao excluir relato', err);
      alert(formatErrorMessage(err, 'Erro ao excluir relato'));
    }
  };

  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      const matchesStatus = !filterStatus || issue.status === filterStatus;
      const matchesCategory = !filterCategory || issue.category === filterCategory;
      const matchesNeighborhood = !filterNeighborhood || 
        (issue.address && issue.address.toLowerCase().includes(filterNeighborhood.toLowerCase()));
      const matchesSearch = !searchTerm || 
        issue.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.address?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesStatus && matchesCategory && matchesNeighborhood && matchesSearch;
    });
  }, [issues, filterStatus, filterCategory, filterNeighborhood, searchTerm]);

  const paginatedIssues = useMemo(() => {
    return filteredIssues.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredIssues, page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [filterStatus, filterCategory, filterNeighborhood, searchTerm]);

  const stats = {
    total: issues.length,
    pending: issues.filter(i => i.status === 'PENDING').length,
    inProgress: issues.filter(i => i.status === 'IN_PROGRESS').length,
    resolved: issues.filter(i => i.status === 'RESOLVED').length,
  };

  const exportToExcel = async (statusFilter?: string) => {
    const dataToExport = statusFilter ? issues.filter(i => i.status === statusFilter) : filteredIssues;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Relatos');
    
    worksheet.columns = [
      { header: 'Protocolo', key: 'protocol', width: 25 },
      { header: 'Categoria', key: 'category', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Data', key: 'date', width: 20 },
      { header: 'Endereço', key: 'address', width: 40 },
      { header: 'Descrição', key: 'description', width: 50 },
    ];

    dataToExport.forEach(issue => {
      worksheet.addRow({
        protocol: issue.protocol,
        category: issue.category,
        status: statusMap[issue.status].label,
        date: format(new Date(issue.createdAt), 'dd/MM/yyyy HH:mm'),
        address: issue.address || 'N/A',
        description: issue.description,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `relatos-serrinha-${statusFilter || 'geral'}-${format(new Date(), 'yyyyMMdd')}.xlsx`;
    anchor.click();
  };

  const exportToPDF = (statusFilter?: string) => {
    const dataToExport = statusFilter ? issues.filter(i => i.status === statusFilter) : filteredIssues;
    const doc = new jsPDF() as any;
    doc.setFontSize(18);
    doc.text('Relatório de Zeladoria Urbana - Serrinha Conectada', 14, 20);
    doc.setFontSize(12);
    doc.text(`Filtro: ${statusFilter ? statusMap[statusFilter].label : 'Geral'}`, 14, 30);
    doc.text(`Data de Emissão: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 37);
    
    const tableData = dataToExport.map(issue => [
      issue.protocol,
      issue.category,
      statusMap[issue.status].label,
      format(new Date(issue.createdAt), 'dd/MM/yyyy'),
      issue.address || 'N/A'
    ]);

    autoTable(doc, {
      head: [['Protocolo', 'Categoria', 'Status', 'Data', 'Endereço']],
      body: tableData,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [0, 74, 141] }
    });

    doc.save(`relatos-serrinha-${statusFilter || 'geral'}-${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleTestEmail = async () => {
    if (!testEmail.trim()) return;
    setTestingEmail(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/admin/test-email', 
        { email: testEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(response.data.message);
      setOpenEmailTestDialog(false);
    } catch (err: any) {
      console.error('Erro no teste de e-mail', err);
      const details = err.response?.data?.details || '';
      const hint = err.response?.data?.hint || '';
      alert(`Falha no teste: ${err.response?.data?.error || err.message}\n\nDetalhes: ${details}\n\nDica: ${hint}`);
    } finally {
      setTestingEmail(false);
    }
  };

  return (
    <Box sx={{ py: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-1.5px', color: 'primary.main' }}>Painel de Gestão</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>Monitoramento e controle de solicitações urbanas.</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {currentUser?.role === 'ADMIN' && (
            <Button 
              variant="outlined" 
              color="primary"
              startIcon={<Search />} 
              onClick={() => {
                setTestEmail(currentUser.email);
                setOpenEmailTestDialog(true);
              }}
              sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700, px: 3 }}
            >
              Testar E-mail
            </Button>
          )}
          <Button 
            variant="contained" 
            startIcon={<Refresh />} 
            onClick={fetchIssues}
            disabled={loading}
            sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700, px: 3 }}
          >
            Atualizar
          </Button>
          <Button 
            variant="outlined" 
            color="error"
            startIcon={<Logout />} 
            onClick={handleLogout}
            sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700, px: 3 }}
          >
            Sair
          </Button>
          <Tooltip title="Exportar Relatório Geral">
            <IconButton onClick={() => exportToExcel()} sx={{ border: '1px solid rgba(0,0,0,0.1)', borderRadius: 3 }}>
              <Download />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Total de Relatos', value: stats.total, color: '#1e293b', icon: <Assessment />, status: null },
          { label: 'Pendentes', value: stats.pending, color: '#9a3412', icon: <PendingActions />, status: 'PENDING' },
          { label: 'Em Execução', value: stats.inProgress, color: '#0369a1', icon: <Assessment />, status: 'IN_PROGRESS' },
          { label: 'Executados', value: stats.resolved, color: '#15803d', icon: <CheckCircle />, status: 'RESOLVED' },
        ].map((stat, i) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
            <Card sx={{ 
              p: 3, 
              borderRadius: 5, 
              border: '1px solid rgba(0,0,0,0.05)', 
              boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' }
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '1px' }}>{stat.label}</Typography>
                  <Typography variant="h3" sx={{ fontWeight: 900, mt: 0.5, color: stat.color }}>{stat.value}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: `${stat.color}15`, color: stat.color, borderRadius: 3, width: 48, height: 48 }}>
                  {stat.icon}
                </Avatar>
              </Box>
              {stat.status && (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: 1 }}>
                  <Button size="small" onClick={() => exportToExcel(stat.status!)} sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'none' }}>Excel</Button>
                  <Button size="small" onClick={() => exportToPDF(stat.status!)} sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'none' }}>PDF</Button>
                </Box>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters Bar */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 5, border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              placeholder="Buscar por protocolo ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
                sx: { borderRadius: 3 }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4, md: 2.5 }}>
            <TextField
              select
              fullWidth
              label="Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            >
              <MenuItem value="">Todos os Status</MenuItem>
              {Object.keys(statusMap).map((key) => (
                <MenuItem key={key} value={key}>{statusMap[key].label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 4, md: 2.5 }}>
            <TextField
              select
              fullWidth
              label="Categoria"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            >
              <MenuItem value="">Todas as Categorias</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 4, md: 2 }}>
            <TextField
              select
              fullWidth
              label="Bairro"
              value={filterNeighborhood}
              onChange={(e) => setFilterNeighborhood(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            >
              <MenuItem value="">Todos os Bairros</MenuItem>
              {neighborhoods.map((n) => (
                <MenuItem key={n} value={n}>{n}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 4, md: 2 }}>
            <Button 
              fullWidth 
              variant="outlined" 
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('');
                setFilterCategory('');
                setFilterNeighborhood('');
              }}
              sx={{ borderRadius: 3, height: 56, textTransform: 'none', fontWeight: 700 }}
            >
              Limpar Filtros
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* View Switcher */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Tabs 
          value={viewTab} 
          onChange={(_, v) => setViewTab(v)} 
          sx={{ 
            bgcolor: 'rgba(0,0,0,0.03)', 
            borderRadius: 4, 
            p: 0.5,
            '& .MuiTabs-indicator': { height: '100%', borderRadius: 3.5, zIndex: 0, bgcolor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
            '& .MuiTab-root': { zIndex: 1, textTransform: 'none', fontWeight: 700, minHeight: 44, borderRadius: 3.5, px: 4 }
          }}
        >
          <Tab icon={<ListIcon sx={{ mr: 1 }} />} iconPosition="start" label="Lista" />
          <Tab icon={<MapIcon sx={{ mr: 1 }} />} iconPosition="start" label="Mapa" />
          <Tab 
            icon={<PendingActions sx={{ mr: 1 }} />} 
            iconPosition="start" 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                Solicitações
                {pendingRequests.length > 0 && (
                  <Chip 
                    label={pendingRequests.length} 
                    size="small" 
                    color="error" 
                    sx={{ ml: 1, height: 20, minWidth: 20, fontSize: '0.65rem', fontWeight: 900 }} 
                  />
                )}
              </Box>
            } 
          />
        </Tabs>
      </Box>

      {/* Content Area */}
      <Fade in={!loading}>
        <Box>
          {viewTab === 0 ? (
            <Paper sx={{ borderRadius: 5, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.01)' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>FOTO</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>PROTOCOLO</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>CATEGORIA</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>DATA</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>ENDEREÇO</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>STATUS</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary' }}>AÇÕES</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                      {paginatedIssues.map((issue) => (
                        <TableRow key={issue.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          <TableCell>
                            {issue.imageUrl ? (
                              <Box 
                                onClick={() => {
                                  setSelectedIssue(issue);
                                  setOpenImageModal(true);
                                }}
                                sx={{ 
                                  width: 60, 
                                  height: 60, 
                                  borderRadius: 2, 
                                  overflow: 'hidden', 
                                  cursor: 'pointer',
                                  border: '2px solid rgba(0,0,0,0.05)',
                                  position: 'relative',
                                  '&:hover': { 
                                    transform: 'scale(1.05)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    '& .zoom-overlay': { opacity: 1 }
                                  },
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <img 
                                  src={issue.imageUrl} 
                                  alt="Thumbnail" 
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  referrerPolicy="no-referrer"
                                  onError={(e: any) => {
                                    e.target.src = 'https://placehold.co/100x100?text=Erro';
                                  }}
                                />
                                <Box 
                                  className="zoom-overlay"
                                  sx={{ 
                                    position: 'absolute', 
                                    top: 0, 
                                    left: 0, 
                                    right: 0, 
                                    bottom: 0, 
                                    bgcolor: 'rgba(0,0,0,0.2)', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    opacity: 0,
                                    transition: 'opacity 0.2s ease'
                                  }}
                                >
                                  <Visibility sx={{ color: 'white', fontSize: 20 }} />
                                </Box>
                              </Box>
                            ) : (
                              <Box sx={{ width: 60, height: 60, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(0,0,0,0.1)' }}>
                                <ImageNotSupported sx={{ fontSize: 24, color: 'text.disabled' }} />
                              </Box>
                            )}
                          </TableCell>
                          <TableCell 
                            sx={{ 
                              fontWeight: 800, 
                              color: 'primary.main', 
                              cursor: 'pointer',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                            onClick={() => {
                              setSelectedIssue(issue);
                              setNewStatus(issue.status);
                              setOpenDialog(true);
                            }}
                          >
                            {issue.protocol}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{issue.category}</TableCell>
                        <TableCell sx={{ color: 'text.secondary' }}>{format(new Date(issue.createdAt), 'dd/MM/yyyy HH:mm')}</TableCell>
                        <TableCell sx={{ maxWidth: 250 }}>
                          <Typography variant="body2" noWrap title={issue.address}>
                            {issue.address || 'Localização no mapa'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={statusMap[issue.status].label} 
                            sx={{ 
                              fontWeight: 800, 
                              borderRadius: 2, 
                              bgcolor: statusMap[issue.status].bg, 
                              color: statusMap[issue.status].text,
                              fontSize: '0.75rem'
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="Atualizar Status">
                              <IconButton 
                                size="small"
                                onClick={() => {
                                  setSelectedIssue(issue);
                                  setNewStatus(issue.status);
                                  setOpenDialog(true);
                                }}
                                sx={{ bgcolor: 'rgba(0,74,141,0.05)', color: 'primary.main', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {currentUser?.role === 'ADMIN' && (
                              <Tooltip title="Excluir Relato">
                                <IconButton 
                                  size="small"
                                  onClick={() => {
                                    setSelectedIssue(issue);
                                    setOpenDeleteDialog(true);
                                  }}
                                  sx={{ bgcolor: 'rgba(239,68,68,0.05)', color: 'error.main', '&:hover': { bgcolor: 'error.main', color: 'white' } }}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 15, 25]}
                component="div"
                count={filteredIssues.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Itens por página:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                sx={{ borderTop: '1px solid rgba(0,0,0,0.05)', fontWeight: 600 }}
              />
              {filteredIssues.length === 0 && (
                <Box sx={{ py: 10, textAlign: 'center' }}>
                  <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: 'rgba(0,0,0,0.05)', color: 'text.disabled', width: 64, height: 64 }}>
                    <Search fontSize="large" />
                  </Avatar>
                  <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700 }}>Nenhum relato encontrado</Typography>
                  <Typography variant="body2" color="text.disabled">Tente ajustar seus filtros de busca.</Typography>
                </Box>
              )}
            </Paper>
          ) : viewTab === 1 ? (
            <Paper sx={{ borderRadius: 5, overflow: 'hidden', height: '600px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
              <MapContainer center={[-11.66, -38.96]} zoom={14} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {filteredIssues.map((issue) => (
                  <Marker key={issue.id} position={[issue.latitude, issue.longitude]}>
                    <Popup>
                      <Box sx={{ p: 1, minWidth: 250, maxWidth: 300 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', mb: 0.5 }}>{issue.protocol}</Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                          <Chip 
                            label={statusMap[issue.status].label} 
                            size="small"
                            sx={{ fontWeight: 700, bgcolor: statusMap[issue.status].bg, color: statusMap[issue.status].text, height: 20, fontSize: '0.65rem' }}
                          />
                          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>{issue.category}</Typography>
                        </Box>
                        
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>Descrição:</Typography>
                        <Typography variant="body2" sx={{ mb: 1.5, fontSize: '0.75rem', lineHeight: 1.4, color: 'text.primary' }}>
                          {issue.description}
                        </Typography>

                        <Divider sx={{ my: 1 }} />
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', display: 'block', mb: 1 }}>Histórico de Status:</Typography>
                        <Box sx={{ maxHeight: 120, overflowY: 'auto', pr: 0.5, mb: 1.5, '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.1)', borderRadius: '4px' } }}>
                          <Stack spacing={0}>
                            {/* Subsequent History (Newest first) */}
                            {issue.history && issue.history.map((h: any, idx: number) => (
                              <Box key={idx} sx={{ pl: 1.5, pb: 1, borderLeft: '2px solid', borderColor: statusMap[h.status]?.text || 'divider', position: 'relative' }}>
                                <Box sx={{ 
                                  position: 'absolute', 
                                  left: -5, 
                                  top: 0, 
                                  width: 8, 
                                  height: 8, 
                                  borderRadius: '50%', 
                                  bgcolor: statusMap[h.status]?.text || 'divider',
                                  border: '2px solid white'
                                }} />
                                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', fontSize: '0.65rem', lineHeight: 1 }}>
                                  {statusMap[h.status]?.label}
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled', fontSize: '0.6rem', mb: 0.5 }}>
                                  {format(new Date(h.createdAt), 'dd/MM/yyyy HH:mm')}
                                </Typography>
                                {h.comment && (
                                  <Typography variant="caption" sx={{ 
                                    display: 'block', 
                                    color: 'text.secondary', 
                                    fontStyle: 'italic', 
                                    fontSize: '0.65rem', 
                                    lineHeight: 1.2,
                                    bgcolor: 'rgba(0,0,0,0.03)',
                                    p: 0.5,
                                    borderRadius: 1
                                  }}>
                                    "{h.comment}"
                                  </Typography>
                                )}
                              </Box>
                            ))}

                            {/* Initial Creation (Always at the bottom of the stack since history is desc) */}
                            <Box sx={{ pl: 1.5, pb: 0, borderLeft: '2px solid transparent', position: 'relative' }}>
                              <Box sx={{ 
                                position: 'absolute', 
                                left: -5, 
                                top: 0, 
                                width: 8, 
                                height: 8, 
                                borderRadius: '50%', 
                                bgcolor: 'text.disabled',
                                border: '2px solid white'
                              }} />
                              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', fontSize: '0.65rem', lineHeight: 1, color: 'text.secondary' }}>
                                Relato Registrado
                              </Typography>
                              <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled', fontSize: '0.6rem' }}>
                                {format(new Date(issue.createdAt), 'dd/MM/yyyy HH:mm')}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>

                        <Divider sx={{ my: 1 }} />
                        <Button 
                          fullWidth 
                          size="small" 
                          variant="contained" 
                          onClick={() => {
                            setSelectedIssue(issue);
                            setNewStatus(issue.status);
                            setOpenDialog(true);
                          }}
                          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, fontSize: '0.7rem' }}
                        >
                          Gerenciar Solicitação
                        </Button>
                      </Box>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </Paper>
          ) : (
            <Paper sx={{ p: 4, borderRadius: 5, border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <PendingActions color="primary" /> Solicitações de Acesso Pendentes
              </Typography>
              
              {loadingRequests ? (
                <Box sx={{ py: 10, textAlign: 'center' }}>
                  <CircularProgress />
                </Box>
              ) : pendingRequests.length === 0 ? (
                <Box sx={{ py: 8, textAlign: 'center', bgcolor: 'rgba(0,0,0,0.01)', borderRadius: 4, border: '1px dashed rgba(0,0,0,0.1)' }}>
                  <CheckCircle sx={{ fontSize: 48, color: 'success.light', mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.secondary' }}>Tudo em dia!</Typography>
                  <Typography variant="body2" color="text.disabled">Não há novas solicitações de administrador aguardando aprovação.</Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>NOME</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>E-MAIL</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>DATA DO PEDIDO</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>AÇÕES</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pendingRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell sx={{ fontWeight: 700 }}>{request.name}</TableCell>
                          <TableCell>{request.email}</TableCell>
                          <TableCell sx={{ color: 'text.secondary' }}>
                            {format(new Date(request.createdAt), 'dd/MM/yyyy HH:mm')}
                            <Typography variant="caption" display="block" color="error">
                              Expira em {15 - Math.floor((new Date().getTime() - new Date(request.createdAt).getTime()) / (1000 * 60 * 60 * 24))} dias
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button 
                                variant="contained" 
                                color="success" 
                                size="small"
                                onClick={() => handleApproveRequest(request.id)}
                                sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                              >
                                Aprovar
                              </Button>
                              <Button 
                                variant="outlined" 
                                color="error" 
                                size="small"
                                onClick={() => handleRejectRequest(request.id)}
                                sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                              >
                                Rejeitar
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          )}
        </Box>
      </Fade>

      {/* Update Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        fullWidth 
        maxWidth="sm"
        PaperProps={{ 
          sx: { 
            borderRadius: 6, 
            p: 1,
            backgroundImage: 'linear-gradient(to bottom, #ffffff, #f9fafb)'
          } 
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 900, 
          fontSize: '1.5rem', 
          letterSpacing: '-1px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          Detalhes da Solicitação
          <IconButton onClick={() => setOpenDialog(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 3, border: '1px solid rgba(0,0,0,0.05)' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>PROTOCOLO</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 800, color: 'primary.main', fontFamily: 'monospace' }}>{selectedIssue?.protocol}</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 3, border: '1px solid rgba(0,0,0,0.05)' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>CIDADÃO</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 800 }}>{selectedIssue?.user?.name || 'Anônimo'}</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 3, border: '1px solid rgba(0,0,0,0.05)' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>CATEGORIA</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 800 }}>{selectedIssue?.category}</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 3, border: '1px solid rgba(0,0,0,0.05)' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>STATUS ATUAL</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: statusMap[selectedIssue?.status]?.text }} />
                    <Typography variant="body1" sx={{ fontWeight: 800, color: statusMap[selectedIssue?.status]?.text }}>
                      {statusMap[selectedIssue?.status]?.label}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {selectedIssue?.imageUrl && (
              <Box sx={{ position: 'relative' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', mb: 1, display: 'block' }}>EVIDÊNCIA FOTOGRÁFICA</Typography>
                <Box 
                  onClick={() => setOpenImageModal(true)}
                  sx={{ 
                    width: '100%', 
                    borderRadius: 4, 
                    overflow: 'hidden', 
                    border: '2px solid rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'transform 0.2s ease',
                    '&:hover': {
                      transform: 'scale(1.01)',
                      '& .overlay': { opacity: 1 }
                    }
                  }}
                >
                  <img 
                    src={selectedIssue.imageUrl} 
                    alt="Evidência" 
                    style={{ width: '100%', height: 'auto', maxHeight: 350, objectFit: 'cover', display: 'block' }} 
                    referrerPolicy="no-referrer"
                    onError={(e: any) => {
                      e.target.src = 'https://placehold.co/600x400?text=Imagem+nao+encontrada';
                    }}
                  />
                  <Box className="overlay" sx={{ 
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
                    transition: 'opacity 0.2s ease'
                  }}>
                    <Box sx={{ bgcolor: 'white', px: 2, py: 1, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Visibility fontSize="small" />
                      <Typography variant="button" sx={{ fontWeight: 700 }}>Ampliar Foto</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}

            <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 3, border: '1px solid rgba(0,0,0,0.05)' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>DESCRIÇÃO DO CIDADÃO</Typography>
              <Typography variant="body2" sx={{ mt: 1, fontWeight: 500, lineHeight: 1.6 }}>{selectedIssue?.description}</Typography>
            </Box>

            <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 3, border: '1px solid rgba(0,0,0,0.05)' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>LOCALIZAÇÃO</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <LocationOn color="primary" fontSize="small" />
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedIssue?.address || 'Ver no mapa'}</Typography>
              </Box>
              <Button 
                variant="text" 
                size="small" 
                startIcon={<OpenInNew />}
                sx={{ mt: 1, fontWeight: 700, textTransform: 'none' }}
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${selectedIssue.latitude},${selectedIssue.longitude}`, '_blank')}
              >
                Abrir no Google Maps
              </Button>
            </Box>

            <Divider />

            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Ações de Gestão</Typography>

            <TextField
              select
              fullWidth
              label="Novo Status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            >
              {Object.keys(statusMap).map((key) => (
                <MenuItem key={key} value={key}>{statusMap[key].label}</MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Comentário para o Cidadão"
              multiline
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Descreva o andamento ou motivo da resolução..."
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />

            <Divider sx={{ my: 1 }} />
            
            <Box sx={{ p: 2, bgcolor: 'rgba(16,185,129,0.03)', borderRadius: 3, border: '1px solid rgba(16,185,129,0.1)' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'success.main', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Download sx={{ fontSize: 20 }} /> Enviar Mensagem Direta (E-mail)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Use este campo para enviar uma mensagem personalizada ao cidadão. O e-mail cadastrado é: <strong>{selectedIssue?.reporterEmail || 'Não fornecido'}</strong>
              </Typography>
              <TextField
                fullWidth
                label="Mensagem Personalizada"
                multiline
                rows={3}
                value={manualMessage}
                onChange={(e) => setManualMessage(e.target.value)}
                placeholder="Escreva aqui sua mensagem direta..."
                disabled={!selectedIssue?.reporterEmail}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'white' }, mb: 2 }}
              />
              <Button 
                variant="outlined" 
                color="success" 
                fullWidth
                onClick={handleSendManualEmail}
                disabled={sendingEmail || !manualMessage.trim() || !selectedIssue?.reporterEmail}
                sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none' }}
              >
                {sendingEmail ? <CircularProgress size={20} /> : 'Enviar E-mail Agora'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 4 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ fontWeight: 800, color: 'text.secondary' }}>Fechar</Button>
          <Button 
            variant="contained" 
            onClick={() => setOpenStatusConfirmDialog(true)}
            sx={{ borderRadius: 3, px: 4, py: 1.2, fontWeight: 800, boxShadow: '0 8px 20px rgba(0,74,141,0.2)' }}
          >
            Salvar Alteração
          </Button>
        </DialogActions>
      </Dialog>

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
            src={selectedIssue?.imageUrl} 
            alt="Evidência Full" 
            style={{ maxWidth: '100%', maxHeight: '90vh', display: 'block', borderRadius: 16 }} 
            referrerPolicy="no-referrer"
            onError={(e: any) => {
              e.target.src = 'https://placehold.co/800x600?text=Erro+ao+carregar+imagem';
            }}
          />
        </Box>
      </Dialog>

      {/* Status Update Confirmation */}
      <Dialog 
        open={openStatusConfirmDialog} 
        onClose={() => setOpenStatusConfirmDialog(false)}
        PaperProps={{ sx: { borderRadius: 5, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: 'primary.main' }}>Confirmar Alteração de Status</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontWeight: 500, mb: 2 }}>
            Você está prestes a alterar o status do relato <strong>{selectedIssue?.protocol}</strong> para <strong>{statusMap[newStatus]?.label}</strong>.
          </Typography>
          {comment && (
            <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2, border: '1px solid rgba(0,0,0,0.05)' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block' }}>COMENTÁRIO:</Typography>
              <Typography variant="body2">"{comment}"</Typography>
            </Box>
          )}
          <Typography sx={{ mt: 2, fontWeight: 500 }}>Deseja prosseguir com esta alteração?</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenStatusConfirmDialog(false)} sx={{ fontWeight: 700 }}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleUpdateStatus}
            sx={{ borderRadius: 2, fontWeight: 800 }}
          >
            Confirmar Alteração
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog 
        open={openDeleteDialog} 
        onClose={() => setOpenDeleteDialog(false)}
        PaperProps={{ sx: { borderRadius: 5, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: 'error.main' }}>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontWeight: 500 }}>
            Tem certeza que deseja excluir permanentemente o relato <strong>{selectedIssue?.protocol}</strong>? 
            Esta ação não pode ser desfeita e removerá todos os registros históricos associados.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDeleteDialog(false)} sx={{ fontWeight: 700 }}>Cancelar</Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleDeleteIssue}
            sx={{ borderRadius: 2, fontWeight: 800 }}
          >
            Sim, Excluir
          </Button>
        </DialogActions>
      </Dialog>

      {/* SMTP Test Dialog */}
      <Dialog 
        open={openEmailTestDialog} 
        onClose={() => setOpenEmailTestDialog(false)}
        PaperProps={{ sx: { borderRadius: 5, p: 1, maxWidth: 400 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: 'primary.main' }}>Teste de Configuração SMTP</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Envie um e-mail de teste para verificar se as credenciais do Brevo/SMTP estão funcionando corretamente.
          </Typography>
          <TextField
            fullWidth
            label="E-mail de Destino"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="seu-email@exemplo.com"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
          />
          <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 3, border: '1px solid rgba(0,0,0,0.05)' }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 1 }}>DICA DE CONFIGURAÇÃO:</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
              Certifique-se de que a variável <strong>SMTP_PASS</strong> no ambiente contém a sua chave de API do Brevo (ou senha SMTP).
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenEmailTestDialog(false)} sx={{ fontWeight: 700 }}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleTestEmail}
            disabled={testingEmail || !testEmail.trim()}
            sx={{ borderRadius: 2, fontWeight: 800, px: 3 }}
          >
            {testingEmail ? <CircularProgress size={20} color="inherit" /> : 'Enviar Teste'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
