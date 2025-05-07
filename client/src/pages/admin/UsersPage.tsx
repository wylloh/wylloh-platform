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
  CircularProgress,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Paper,
  Tooltip,
  Divider
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams, GridToolbar } from '@mui/x-data-grid';
import { useSnackbar } from 'notistack';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Verified as VerifiedIcon,
  Block as BlockIcon,
  History as HistoryIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import AdminLayout from '../../components/admin/AdminLayout';

interface User {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'pro' | 'admin';
  status: 'active' | 'inactive' | 'pending';
  proVerificationStatus: 'none' | 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  lastLogin: Date;
  verificationHistory?: VerificationHistory[];
}

interface VerificationHistory {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: Date;
  notes?: string;
  adminId: string;
}

interface FormData {
  email: string;
  username: string;
  role: 'user' | 'pro' | 'admin';
  status: 'active' | 'inactive' | 'pending';
  proVerificationStatus: 'none' | 'pending' | 'approved' | 'rejected';
  verificationNotes?: string;
}

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleString();
};

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const [formData, setFormData] = useState<FormData>({
    email: '',
    username: '',
    role: 'user',
    status: 'active',
    proVerificationStatus: 'none',
    verificationNotes: ''
  });

  const columns: GridColDef[] = [
    { field: 'username', headerName: 'Username', flex: 1 },
    { field: 'email', headerName: 'Email', flex: 1 },
    {
      field: 'role',
      headerName: 'Role',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          color={
            params.value === 'admin'
              ? 'error'
              : params.value === 'pro'
              ? 'primary'
              : 'default'
          }
          size="small"
        />
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          color={
            params.value === 'active'
              ? 'success'
              : params.value === 'pending'
              ? 'warning'
              : 'error'
          }
          size="small"
        />
      )
    },
    {
      field: 'proVerificationStatus',
      headerName: 'Pro Status',
      width: 150,
      renderCell: (params: GridRenderCellParams) => {
        if (params.value === 'none') return null;
        return (
          <Chip
            label={params.value}
            color={
              params.value === 'approved'
                ? 'success'
                : params.value === 'pending'
                ? 'warning'
                : 'error'
            }
            size="small"
            icon={params.value === 'approved' ? <VerifiedIcon /> : undefined}
          />
        );
      }
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      flex: 1,
      valueFormatter: ({ value }) => formatDate(value as string)
    },
    {
      field: 'lastLogin',
      headerName: 'Last Login',
      flex: 1,
      valueFormatter: ({ value }) => formatDate(value as string)
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Tooltip title="View History">
            <IconButton
              size="small"
              onClick={() => handleViewHistory(params.row as User)}
              color="info"
            >
              <HistoryIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit User">
            <IconButton
              size="small"
              onClick={() => handleEdit(params.row as User)}
              color="primary"
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete User">
            <IconButton
              size="small"
              onClick={() => handleDelete(params.row.id as string)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
          {params.row.proVerificationStatus === 'pending' && (
            <Tooltip title="Verify Pro Status">
              <IconButton
                size="small"
                onClick={() => handleProVerification(params.row as User)}
                color="success"
              >
                <VerifiedIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )
    }
  ];

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users`);
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      enqueueSnackbar('Failed to load users', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAdd = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      username: '',
      role: 'user',
      status: 'active',
      proVerificationStatus: 'none',
      verificationNotes: ''
    });
    setDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      username: user.username,
      role: user.role,
      status: user.status,
      proVerificationStatus: user.proVerificationStatus,
      verificationNotes: ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete user');
      enqueueSnackbar('User deleted successfully', { variant: 'success' });
      fetchUsers();
    } catch (err) {
      enqueueSnackbar('Failed to delete user', { variant: 'error' });
    }
  };

  const handleViewHistory = (user: User) => {
    setSelectedUser(user);
    setHistoryDialogOpen(true);
  };

  const handleProVerification = async (user: User) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/users/${user.id}/verify-pro`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            status: 'approved',
            notes: formData.verificationNotes
          })
        }
      );
      if (!response.ok) throw new Error('Failed to verify Pro status');
      enqueueSnackbar('Pro status verified successfully', { variant: 'success' });
      fetchUsers();
    } catch (err) {
      enqueueSnackbar('Failed to verify Pro status', { variant: 'error' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingUser
        ? `${process.env.REACT_APP_API_URL}/api/users/${editingUser.id}`
        : `${process.env.REACT_APP_API_URL}/api/users`;
      
      const method = editingUser ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save user');
      
      enqueueSnackbar(
        `User ${editingUser ? 'updated' : 'created'} successfully`,
        { variant: 'success' }
      );
      
      setDialogOpen(false);
      fetchUsers();
    } catch (err) {
      enqueueSnackbar(
        `Failed to ${editingUser ? 'update' : 'create'} user`,
        { variant: 'error' }
      );
    }
  };

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" component="h1">
            User Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            Add User
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ height: 'calc(100vh - 200px)', width: '100%' }}>
          <DataGrid
            rows={users}
            columns={columns}
            loading={loading}
            slots={{
              toolbar: GridToolbar
            }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 }
              }
            }}
            disableRowSelectionOnClick
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 }
              }
            }}
            pageSizeOptions={[10, 25, 50]}
          />
        </Paper>

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingUser ? 'Edit User' : 'Add New User'}
          </DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={formData.role}
                      label="Role"
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as FormData['role'] })}
                    >
                      <MenuItem value="user">User</MenuItem>
                      <MenuItem value="pro">Pro</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      label="Status"
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as FormData['status'] })}
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {editingUser && (
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Pro Verification Status</InputLabel>
                      <Select
                        value={formData.proVerificationStatus}
                        label="Pro Verification Status"
                        onChange={(e) => setFormData({ ...formData, proVerificationStatus: e.target.value as FormData['proVerificationStatus'] })}
                      >
                        <MenuItem value="none">None</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                {formData.proVerificationStatus === 'pending' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Verification Notes"
                      multiline
                      rows={4}
                      value={formData.verificationNotes}
                      onChange={(e) => setFormData({ ...formData, verificationNotes: e.target.value })}
                    />
                  </Grid>
                )}
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained" color="primary">
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={historyDialogOpen} onClose={() => setHistoryDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Verification History - {selectedUser?.username}
          </DialogTitle>
          <DialogContent>
            {selectedUser?.verificationHistory?.map((history, index) => (
              <Box key={history.id} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip
                    label={history.status}
                    color={
                      history.status === 'approved'
                        ? 'success'
                        : history.status === 'pending'
                        ? 'warning'
                        : 'error'
                    }
                    size="small"
                  />
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(history.timestamp)}
                  </Typography>
                </Box>
                {history.notes && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {history.notes}
                  </Typography>
                )}
                {index < (selectedUser.verificationHistory?.length || 0) - 1 && (
                  <Divider sx={{ my: 1 }} />
                )}
              </Box>
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
};

export default UsersPage; 