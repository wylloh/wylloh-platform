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
  InputLabel
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useSnackbar } from 'notistack';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Verified as VerifiedIcon,
  Block as BlockIcon
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
}

interface FormData {
  email: string;
  username: string;
  role: 'user' | 'pro' | 'admin';
  status: 'active' | 'inactive' | 'pending';
  proVerificationStatus: 'none' | 'pending' | 'approved' | 'rejected';
}

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleString();
};

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const [formData, setFormData] = useState<FormData>({
    email: '',
    username: '',
    role: 'user',
    status: 'active',
    proVerificationStatus: 'none'
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
      width: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => handleEdit(params.row as User)}
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
          {params.row.proVerificationStatus === 'pending' && (
            <IconButton
              size="small"
              onClick={() => handleProVerification(params.row as User)}
              color="success"
            >
              <VerifiedIcon />
            </IconButton>
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
      proVerificationStatus: 'none'
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
      proVerificationStatus: user.proVerificationStatus
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

  const handleProVerification = async (user: User) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/users/${user.id}/verify-pro`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'approved' })
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
      
      const response = await fetch(url, {
        method: editingUser ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save user');
      
      enqueueSnackbar(
        `User ${editingUser ? 'updated' : 'added'} successfully`,
        { variant: 'success' }
      );
      
      setDialogOpen(false);
      fetchUsers();
    } catch (err) {
      enqueueSnackbar('Failed to save user', { variant: 'error' });
    }
  };

  return (
    <AdminLayout>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">User Management</Typography>
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

        <Box sx={{ flexGrow: 1, minHeight: 400 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : (
            <DataGrid
              rows={users}
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
              {editingUser ? 'Edit User' : 'Add User'}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                <TextField
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  fullWidth
                />
                <TextField
                  label="Username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  fullWidth
                />
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.role}
                    label="Role"
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
                  >
                    <MenuItem value="user">User</MenuItem>
                    <MenuItem value="pro">Pro</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as User['status'] })}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Pro Verification Status</InputLabel>
                  <Select
                    value={formData.proVerificationStatus}
                    label="Pro Verification Status"
                    onChange={(e) => setFormData({ ...formData, proVerificationStatus: e.target.value as User['proVerificationStatus'] })}
                  >
                    <MenuItem value="none">None</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained">
                {editingUser ? 'Update' : 'Add'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </AdminLayout>
  );
};

export default UsersPage; 