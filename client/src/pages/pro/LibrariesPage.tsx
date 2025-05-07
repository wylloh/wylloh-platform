import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  FormControlLabel,
  Switch,
  InputAdornment,
  CircularProgress,
  Alert,
  Tooltip,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import SearchIcon from '@mui/icons-material/Search';

// Sample library images for development
const SAMPLE_THUMBNAILS = [
  'https://images.unsplash.com/photo-1478720568477-152d9b164e26',
  'https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0',
  'https://images.unsplash.com/photo-1536240478700-b869070f9279',
  'https://images.unsplash.com/photo-1544967082-d9d25d867d66',
];

interface Library {
  _id: string;
  name: string;
  description: string;
  isPublic: boolean;
  itemCount: number;
  totalValue: number;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Sample data for development
const SAMPLE_LIBRARIES: Library[] = [
  {
    _id: '1',
    name: 'Film Collection',
    description: 'My curated collection of independent films from around the world',
    isPublic: true,
    itemCount: 24,
    totalValue: 1450,
    thumbnailUrl: SAMPLE_THUMBNAILS[0],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: '2',
    name: 'Documentary Series',
    description: 'A collection of educational documentaries focusing on climate change',
    isPublic: true,
    itemCount: 12,
    totalValue: 850,
    thumbnailUrl: SAMPLE_THUMBNAILS[1],
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: '3',
    name: 'Private Archive',
    description: 'Personal archive of family videos and memories',
    isPublic: false,
    itemCount: 47,
    totalValue: 0, // Not for sale
    thumbnailUrl: SAMPLE_THUMBNAILS[2],
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const LibrariesPage: React.FC = () => {
  const navigate = useNavigate();
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLibrary, setSelectedLibrary] = useState<Library | null>(null);
  
  // Form states
  const [libraryName, setLibraryName] = useState('');
  const [libraryDescription, setLibraryDescription] = useState('');
  const [libraryIsPublic, setLibraryIsPublic] = useState(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchLibraries = async () => {
      try {
        const response = await fetch('/api/libraries');
        if (!response.ok) {
          throw new Error('Failed to fetch libraries');
        }
        const data = await response.json();
        setLibraries(data);
      } catch (err) {
        console.error('Error fetching libraries:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        
        // Fall back to sample data in development environment
        if (process.env.NODE_ENV === 'development') {
          console.log('Using sample data for libraries');
          setLibraries(SAMPLE_LIBRARIES);
          setError(null);
        }
      } finally {
        setLoading(false);
      }
    };

    // In development, use sample data
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        setLibraries(SAMPLE_LIBRARIES);
        setLoading(false);
      }, 1000); // Simulate network delay
    } else {
      fetchLibraries();
    }
  }, []);

  const handleCreateLibrary = async () => {
    // Form validation
    const errors: Record<string, string> = {};
    if (!libraryName.trim()) {
      errors.name = 'Library name is required';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const newLibrary = {
        name: libraryName,
        description: libraryDescription,
        isPublic: libraryIsPublic,
      };
      
      // In development, mock the API call
      if (process.env.NODE_ENV === 'development') {
        const mockNewLibrary: Library = {
          _id: Date.now().toString(),
          ...newLibrary,
          itemCount: 0,
          totalValue: 0,
          thumbnailUrl: SAMPLE_THUMBNAILS[Math.floor(Math.random() * SAMPLE_THUMBNAILS.length)],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        setLibraries([mockNewLibrary, ...libraries]);
        setCreateDialogOpen(false);
        resetForm();
        return;
      }
      
      const response = await fetch('/api/libraries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newLibrary),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create library');
      }
      
      const createdLibrary = await response.json();
      setLibraries([createdLibrary, ...libraries]);
      setCreateDialogOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error creating library:', err);
      setError(err instanceof Error ? err.message : 'Failed to create library');
    }
  };

  const handleUpdateLibrary = async () => {
    if (!selectedLibrary) return;
    
    // Form validation
    const errors: Record<string, string> = {};
    if (!libraryName.trim()) {
      errors.name = 'Library name is required';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const updatedLibraryData = {
        name: libraryName,
        description: libraryDescription,
        isPublic: libraryIsPublic,
      };
      
      // In development, mock the API call
      if (process.env.NODE_ENV === 'development') {
        const updatedLibraries = libraries.map(lib => 
          lib._id === selectedLibrary._id 
            ? { 
                ...lib, 
                ...updatedLibraryData,
                updatedAt: new Date().toISOString()
              } 
            : lib
        );
        
        setLibraries(updatedLibraries);
        setEditDialogOpen(false);
        resetForm();
        return;
      }
      
      const response = await fetch(`/api/libraries/${selectedLibrary._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedLibraryData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update library');
      }
      
      const updatedLibrary = await response.json();
      const updatedLibraries = libraries.map(lib => 
        lib._id === selectedLibrary._id ? updatedLibrary : lib
      );
      
      setLibraries(updatedLibraries);
      setEditDialogOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error updating library:', err);
      setError(err instanceof Error ? err.message : 'Failed to update library');
    }
  };

  const handleDeleteLibrary = async () => {
    if (!selectedLibrary) return;

    try {
      // In development, mock the API call
      if (process.env.NODE_ENV === 'development') {
        const filteredLibraries = libraries.filter(lib => lib._id !== selectedLibrary._id);
        setLibraries(filteredLibraries);
        setDeleteDialogOpen(false);
        return;
      }
      
      const response = await fetch(`/api/libraries/${selectedLibrary._id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete library');
      }
      
      const filteredLibraries = libraries.filter(lib => lib._id !== selectedLibrary._id);
      setLibraries(filteredLibraries);
      setDeleteDialogOpen(false);
    } catch (err) {
      console.error('Error deleting library:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete library');
    }
  };

  const openEditDialog = (library: Library) => {
    setSelectedLibrary(library);
    setLibraryName(library.name);
    setLibraryDescription(library.description);
    setLibraryIsPublic(library.isPublic);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (library: Library) => {
    setSelectedLibrary(library);
    setDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setLibraryName('');
    setLibraryDescription('');
    setLibraryIsPublic(true);
    setFormErrors({});
    setSelectedLibrary(null);
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    resetForm();
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    resetForm();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredLibraries = libraries.filter(library => {
    return library.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           library.description.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4, px: { xs: 2, md: 4 } }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          My Libraries
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Library
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      <Box mb={4}>
        <TextField
          fullWidth
          placeholder="Search libraries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {filteredLibraries.length === 0 ? (
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="center"
          minHeight="200px"
          bgcolor="background.paper"
          borderRadius={2}
          p={4}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No libraries found
          </Typography>
          <Typography color="text.secondary" align="center" mb={2}>
            {searchQuery ? 'Try a different search term' : 'Create your first library to get started'}
          </Typography>
          {!searchQuery && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Library
            </Button>
          )}
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredLibraries.map((library) => (
            <Grid item xs={12} sm={6} md={4} key={library._id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  }
                }}
              >
                <CardActionArea 
                  sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                  onClick={() => navigate(`/library/${library._id}`)}
                >
                  <CardMedia
                    component="img"
                    height="160"
                    image={library.thumbnailUrl || `https://source.unsplash.com/random/800x450?sig=${library._id}`}
                    alt={library.name}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="h6" component="div" noWrap>
                        {library.name}
                      </Typography>
                      <Tooltip title={library.isPublic ? 'Public Library' : 'Private Library'}>
                        {library.isPublic ? 
                          <VisibilityIcon fontSize="small" color="action" /> : 
                          <VisibilityOffIcon fontSize="small" color="action" />
                        }
                      </Tooltip>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }} paragraph>
                      {library.description.length > 120 
                        ? `${library.description.substring(0, 120)}...` 
                        : library.description}
                    </Typography>
                    
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        Items:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {library.itemCount}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Value:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {library.totalValue > 0 ? formatCurrency(library.totalValue) : 'Not for sale'}
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="caption" color="text.secondary">
                      Updated: {formatDate(library.updatedAt)}
                    </Typography>
                  </CardContent>
                </CardActionArea>
                <CardActions>
                  <Tooltip title="View Content">
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/library/${library._id}`);
                      }}
                    >
                      <FormatListBulletedIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="View Analytics">
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/library/${library._id}?tab=1`);
                      }}
                    >
                      <AnalyticsIcon />
                    </IconButton>
                  </Tooltip>
                  <Box flexGrow={1} />
                  <Tooltip title="Edit Library">
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(library);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Library">
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteDialog(library);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Library Dialog */}
      <Dialog open={createDialogOpen} onClose={handleCloseCreateDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Library</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Library Name"
              value={libraryName}
              onChange={(e) => setLibraryName(e.target.value)}
              margin="normal"
              variant="outlined"
              error={!!formErrors.name}
              helperText={formErrors.name}
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={libraryDescription}
              onChange={(e) => setLibraryDescription(e.target.value)}
              margin="normal"
              variant="outlined"
              multiline
              rows={4}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={libraryIsPublic}
                  onChange={(e) => setLibraryIsPublic(e.target.checked)}
                  color="primary"
                />
              }
              label="Make this library public"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>Cancel</Button>
          <Button onClick={handleCreateLibrary} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Library Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Library</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Library Name"
              value={libraryName}
              onChange={(e) => setLibraryName(e.target.value)}
              margin="normal"
              variant="outlined"
              error={!!formErrors.name}
              helperText={formErrors.name}
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={libraryDescription}
              onChange={(e) => setLibraryDescription(e.target.value)}
              margin="normal"
              variant="outlined"
              multiline
              rows={4}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={libraryIsPublic}
                  onChange={(e) => setLibraryIsPublic(e.target.checked)}
                  color="primary"
                />
              }
              label="Make this library public"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleUpdateLibrary} variant="contained" color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Library</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedLibrary?.name}"? This action cannot be undone.
          </Typography>
          {selectedLibrary?.itemCount && selectedLibrary.itemCount > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This library contains {selectedLibrary.itemCount} items that will also be removed from your collection.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteLibrary} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LibrariesPage; 