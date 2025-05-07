import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  CircularProgress,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import CollectionsIcon from '@mui/icons-material/Collections';

interface Library {
  _id: string;
  name: string;
  description: string;
  isPublic: boolean;
  itemCount: number;
  totalValue: number;
}

const MyLibraryPage: React.FC = () => {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newLibrary, setNewLibrary] = useState({
    name: '',
    description: '',
    isPublic: false,
  });

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
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchLibraries();
  }, []);

  const handleCreateDialogOpen = () => {
    setCreateDialogOpen(true);
  };

  const handleCreateDialogClose = () => {
    setCreateDialogOpen(false);
  };

  const handleCreateLibrary = async () => {
    try {
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
      setLibraries([...libraries, createdLibrary]);
      setNewLibrary({
        name: '',
        description: '',
        isPublic: false,
      });
      setCreateDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Typography color="error" sx={{ my: 2 }}>
          {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">My Libraries</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateDialogOpen}
        >
          Create Library
        </Button>
      </Box>

      {libraries.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px',
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
          }}
        >
          <CollectionsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Libraries Yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Start building your collection by creating your first library
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateDialogOpen}
          >
            Create Library
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {libraries.map((library) => (
            <Grid item xs={12} sm={6} md={4} key={library._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" gutterBottom>
                    {library.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {library.description}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Items: {library.itemCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Value: {formatCurrency(library.totalValue)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Visibility: {library.isPublic ? 'Public' : 'Private'}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button
                    component={Link}
                    to={`/library/${library._id}`}
                    size="small"
                  >
                    View Content
                  </Button>
                  <Button
                    component={Link}
                    to={`/library/${library._id}?tab=analytics`}
                    size="small"
                    startIcon={<AnalyticsIcon />}
                  >
                    Analytics
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={createDialogOpen} onClose={handleCreateDialogClose}>
        <DialogTitle>Create New Library</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Library Name"
            fullWidth
            value={newLibrary.name}
            onChange={(e) => setNewLibrary({ ...newLibrary, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={newLibrary.description}
            onChange={(e) => setNewLibrary({ ...newLibrary, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={newLibrary.isPublic}
                onChange={(e) => setNewLibrary({ ...newLibrary, isPublic: e.target.checked })}
              />
            }
            label="Make this library public"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateDialogClose}>Cancel</Button>
          <Button
            onClick={handleCreateLibrary}
            variant="contained"
            disabled={!newLibrary.name.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MyLibraryPage;