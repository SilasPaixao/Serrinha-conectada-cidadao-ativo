import { useState, useEffect } from 'react';
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
  Stack
} from '@mui/material';
import { 
  Edit, 
  Download, 
  PictureAsPdf, 
  Assessment, 
  PendingActions, 
  CheckCircle, 
  ErrorOutline,
  FilterList
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const statusMap: any = {
  PENDING: { label: 'Pendente', color: 'warning', icon: <PendingActions sx={{ fontSize: 16 }} /> },
  IN_PROGRESS: { label: 'Em Andamento', color: 'info', icon: <Assessment sx={{ fontSize: 16 }} /> },
  RESOLVED: { label: 'Resolvido', color: 'success', icon: <CheckCircle sx={{ fontSize: 16 }} /> },
  REJECTED: { label: 'Rejeitado', color: 'error', icon: <ErrorOutline sx={{ fontSize: 16 }} /> },
};

export default function AdminDashboard() {
  const [issues, setIssues] = useState<any[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [comment, setComment] = useState('');

  const fetchIssues = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/issues', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIssues(response.data);
    } catch (err) {
      console.error('Erro ao buscar relatos', err);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleUpdateStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/admin/issues/${selectedIssue.id}/status`, 
        { status: newStatus, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOpenDialog(false);
      fetchIssues();
    } catch (err) {
      console.error('Erro ao atualizar status', err);
    }
  };

  const stats = {
    total: issues.length,
    pending: issues.filter(i => i.status === 'PENDING').length,
    resolved: issues.filter(i => i.status === 'RESOLVED').length,
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Relatos');
    
    worksheet.columns = [
      { header: 'Protocolo', key: 'protocol', width: 20 },
      { header: 'Categoria', key: 'category', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Data', key: 'date', width: 20 },
      { header: 'Descrição', key: 'description', width: 40 },
    ];

    issues.forEach(issue => {
      worksheet.addRow({
        protocol: issue.protocol,
        category: issue.category,
        status: statusMap[issue.status].label,
        date: format(new Date(issue.createdAt), 'dd/MM/yyyy HH:mm'),
        description: issue.description,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `relatos-serrinha-${format(new Date(), 'yyyyMMdd')}.xlsx`;
    anchor.click();
  };

  const exportToPDF = () => {
    const doc = new jsPDF() as any;
    doc.text('Relatório de Zeladoria Urbana - Serrinha Conectada', 14, 15);
    
    const tableData = issues.map(issue => [
      issue.protocol,
      issue.category,
      statusMap[issue.status].label,
      format(new Date(issue.createdAt), 'dd/MM/yyyy'),
      issue.description.substring(0, 50) + '...'
    ]);

    doc.autoTable({
      head: [['Protocolo', 'Categoria', 'Status', 'Data', 'Descrição']],
      body: tableData,
      startY: 20,
    });

    doc.save(`relatos-serrinha-${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  return (
    <Box sx={{ py: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-1px' }}>Painel de Gestão</Typography>
          <Typography variant="body2" color="text.secondary">Gerencie e acompanhe as solicitações de zeladoria urbana.</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button 
            variant="outlined" 
            startIcon={<Download />} 
            onClick={exportToExcel}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Exportar Excel
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<PictureAsPdf />} 
            onClick={exportToPDF}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            PDF
          </Button>
        </Stack>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Total de Relatos', value: stats.total, color: 'primary.main', icon: <Assessment /> },
          { label: 'Pendentes', value: stats.pending, color: 'warning.main', icon: <PendingActions /> },
          { label: 'Resolvidos', value: stats.resolved, color: 'success.main', icon: <CheckCircle /> },
        ].map((stat, i) => (
          <Grid size={{ xs: 12, sm: 4 }} key={i}>
            <Card sx={{ p: 3, borderRadius: 4, border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>{stat.label}</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>{stat.value}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: `${stat.color.split('.')[0]}.light`, color: stat.color }}>
                  {stat.icon}
                </Avatar>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Table Section */}
      <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Solicitações Recentes</Typography>
          <Button startIcon={<FilterList />} size="small" sx={{ textTransform: 'none', fontWeight: 600 }}>Filtrar</Button>
        </Box>
        
        {/* Desktop Table View */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.01)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Protocolo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Categoria</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Data de Registro</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {issues.map((issue) => (
                  <TableRow key={issue.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>{issue.protocol}</TableCell>
                    <TableCell>{issue.category}</TableCell>
                    <TableCell>{format(new Date(issue.createdAt), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell>
                      <Chip 
                        icon={statusMap[issue.status].icon}
                        label={statusMap[issue.status].label} 
                        color={statusMap[issue.status].color} 
                        size="small" 
                        sx={{ fontWeight: 700, borderRadius: 1.5 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Atualizar Status">
                        <IconButton 
                          size="small"
                          onClick={() => {
                            setSelectedIssue(issue);
                            setNewStatus(issue.status);
                            setOpenDialog(true);
                          }}
                          sx={{ border: '1px solid rgba(0,0,0,0.05)' }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Mobile Card View */}
        <Box sx={{ display: { xs: 'block', md: 'none' }, p: 2 }}>
          {issues.map((issue) => (
            <Card key={issue.id} sx={{ mb: 2, p: 2, borderRadius: 3, border: '1px solid rgba(0,0,0,0.05)', boxShadow: 'none' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>{issue.protocol}</Typography>
                <Chip 
                  label={statusMap[issue.status].label} 
                  color={statusMap[issue.status].color} 
                  size="small" 
                  sx={{ fontWeight: 700, borderRadius: 1.5, fontSize: '0.7rem' }}
                />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>{issue.category}</Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                {format(new Date(issue.createdAt), 'dd/MM/yyyy HH:mm')}
              </Typography>
              <Button 
                fullWidth 
                variant="outlined" 
                size="small"
                startIcon={<Edit />}
                onClick={() => {
                  setSelectedIssue(issue);
                  setNewStatus(issue.status);
                  setOpenDialog(true);
                }}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
              >
                Atualizar Status
              </Button>
            </Card>
          ))}
        </Box>

        {issues.length === 0 && (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography color="text.secondary">Nenhuma solicitação encontrada.</Typography>
          </Box>
        )}
      </Paper>

      {/* Update Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        fullWidth 
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Atualizar Status do Relato</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>PROTOCOLO</Typography>
              <Typography variant="body1" sx={{ fontWeight: 700 }}>{selectedIssue?.protocol}</Typography>
            </Box>
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
              label="Comentário / Observação para o Cidadão"
              multiline
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Descreva o andamento ou motivo da resolução/rejeição..."
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ fontWeight: 700 }}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleUpdateStatus}
            sx={{ borderRadius: 2, px: 3, fontWeight: 700 }}
          >
            Salvar Alteração
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
