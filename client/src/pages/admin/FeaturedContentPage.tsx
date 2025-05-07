import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useSnackbar } from 'notistack';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import AdminLayout from '../../components/admin/AdminLayout';

interface FeaturedContent {
  id: string;
  contentId: string;
  title: string;
  description: string;
  imageUrl: string;
  startDate: Date;
  endDate: Date;
  priority: number;
  active: boolean;
}

interface FormData {
  contentId: string;
  title: string;
  description: string;
  imageUrl: string;
  startDate: Date;
  endDate: Date;
  priority: number;
}

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleString();
};

const FeaturedContentPage: React.FC = () => {
  const [content, setContent] = useState<FeaturedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<FeaturedContent | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const [formData, setFormData] = useState<FormData>({
    contentId: '',
    title: '',
    description: '',
    imageUrl: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 7 days from now
    priority: 1
  });

  const columns: GridColDef[] = [
    { field: 'title', headerName: 'Title', flex: 1 },
    { field: 'contentId', headerName: 'Content ID', flex: 1 },
    {
      field: 'startDate',
      headerName: 'Start Date',
      flex: 1,
      valueFormatter: ({ value }) => formatDate(value as string)
    },
    {
      field: 'endDate',
      headerName: 'End Date',
      flex: 1,
      valueFormatter: ({ value }) => formatDate(value as string)
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 100,
      type: 'number'
    },
    {
      field: 'active',
      headerName: 'Status',
      width: 120,
      valueGetter: (params: GridRenderCellParams) => {
        const now = new Date();
        const start = new Date(params.row.startDate);
        const end = new Date(params.row.endDate);
        return now >= start && now <= end ? 'Active' : 'Inactive';
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => handleEdit(params.row as FeaturedContent)}
            color="primary"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDelete(params.row.id as string)}
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      )
    }
  ];

  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/featured-content`);
      if (!response.ok) throw new Error('Failed to fetch featured content');
      const data = await response.json();
      setContent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      enqueueSnackbar('Failed to load featured content', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleAdd = () => {
    setEditingContent(null);
    setFormData({
      contentId: '',
      title: '',
      description: '',
      imageUrl: '',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      priority: 1
    });
    setDialogOpen(true);
  };

  const handleEdit = (content: FeaturedContent) => {
    setEditingContent(content);
    setFormData({
      contentId: content.contentId,
      title: content.title,
      description: content.description,
      imageUrl: content.imageUrl,
      startDate: new Date(content.startDate),
      endDate: new Date(content.endDate),
      priority: content.priority
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this featured content?')) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/featured-content/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete featured content');
      enqueueSnackbar('Featured content deleted successfully', { variant: 'success' });
      fetchContent();
    } catch (err) {
      enqueueSnackbar('Failed to delete featured content', { variant: 'error' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingContent
        ? `${process.env.REACT_APP_API_URL}/api/featured-content/${editingContent.id}`
        : `${process.env.REACT_APP_API_URL}/api/featured-content`;
      
      const response = await fetch(url, {
        method: editingContent ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save featured content');
      
      enqueueSnackbar(
        `Featured content ${editingContent ? 'updated' : 'added'} successfully`,
        { variant: 'success' }
      );
      
      setDialogOpen(false);
      fetchContent();
    } catch (err) {
      enqueueSnackbar('Failed to save featured content', { variant: 'error' });
    }
  };

  return (
    <AdminLayout>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Featured Content</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            Add Featured Content
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ flexGrow: 1, minHeight: 400 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : (
            <DataGrid
              rows={content}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10, page: 0 }
                }
              }}
              pageSizeOptions={[10]}
              disableRowSelectionOnClick
              autoHeight
            />
          )}
        </Box>

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleSubmit}>
            <DialogTitle>
              {editingContent ? 'Edit Featured Content' : 'Add Featured Content'}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                <TextField
                  label="Content ID"
                  value={formData.contentId}
                  onChange={(e) => setFormData({ ...formData, contentId: e.target.value })}
                  required
                  fullWidth
                />
                <TextField
                  label="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  fullWidth
                />
                <TextField
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  multiline
                  rows={3}
                  fullWidth
                />
                <TextField
                  label="Image URL"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  required
                  fullWidth
                />
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="Start Date"
                    value={formData.startDate}
                    onChange={(date: Date | null) => date && setFormData({ ...formData, startDate: date })}
                  />
                  <DateTimePicker
                    label="End Date"
                    value={formData.endDate}
                    onChange={(date: Date | null) => date && setFormData({ ...formData, endDate: date })}
                  />
                </LocalizationProvider>
                <TextField
                  label="Priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  required
                  fullWidth
                  inputProps={{ min: 1 }}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained">
                {editingContent ? 'Update' : 'Add'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </AdminLayout>
  );
};

export default FeaturedContentPage; 