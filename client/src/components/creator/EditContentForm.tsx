import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Alert,
  AlertTitle,
  CircularProgress,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  PlayArrow as PlayArrowIcon,
  AddCircleOutline as AddIcon,
  DeleteOutline as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';

// Define content types
const CONTENT_TYPES = [
  { value: 'movie', label: 'Movie' },
  { value: 'series', label: 'Series' },
  { value: 'short', label: 'Short Film' },
  { value: 'music', label: 'Music' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'ebook', label: 'E-Book' },
  { value: 'art', label: 'Art' },
  { value: 'other', label: 'Other' }
];

// Define content item interface
export interface ContentItem {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  contentType: string;
  status: 'active' | 'draft' | 'pending';
  visibility: 'public' | 'private' | 'unlisted';
  metadata: {
    genres?: string[];
    releaseYear?: string;
    duration?: string;
    director?: string;
    cast?: string[];
    tags?: string[];
    [key: string]: any;
  };
  ipfsCid?: string;
  previewCid?: string;
  thumbnailCid?: string;
  createdAt: string;
  tokenized: boolean;
}

interface EditContentFormProps {
  contentId: string;
  onSuccess?: () => void;
}

const EditContentForm: React.FC<EditContentFormProps> = ({ contentId, onSuccess }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Mock content data for demo - in a real app this would be fetched from API
  const [content, setContent] = useState<ContentItem | null>(null);
  
  // Form specific state
  const [newTag, setNewTag] = useState<string>('');
  const [newGenre, setNewGenre] = useState<string>('');
  const [newCastMember, setNewCastMember] = useState<string>('');
  
  // Load content data on mount
  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        // In a real app, this would call an API
        // For demo, we'll simulate an API call with timeout
        setTimeout(() => {
          // Mock content data
          const mockContent: ContentItem = {
            id: contentId,
            title: 'The Digital Frontier',
            description: 'A journey into the world of blockchain and digital ownership.',
            thumbnailUrl: 'https://source.unsplash.com/random/400x300/?technology',
            contentType: 'movie',
            status: 'active',
            visibility: 'public',
            metadata: {
              genres: ['Documentary', 'Technology', 'Finance'],
              releaseYear: '2023',
              duration: '84 minutes',
              director: 'Alexandra Rivera',
              cast: ['John Smith', 'Jane Doe', 'David Johnson'],
              tags: ['blockchain', 'web3', 'digital ownership', 'technology']
            },
            ipfsCid: 'QmXyZ123456789',
            previewCid: 'QmAbc123456789',
            thumbnailCid: 'QmDef123456789',
            createdAt: '2023-11-10T12:00:00.000Z',
            tokenized: true
          };
          
          setContent(mockContent);
          setLoading(false);
        }, 800);
      } catch (err: any) {
        setError(err.message || 'Failed to load content');
        setLoading(false);
      }
    };
    
    fetchContent();
  }, [contentId]);
  
  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (!content) return;
    
    setContent({
      ...content,
      [name]: value
    });
  };
  
  // Handle select field changes
  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    
    if (!content) return;
    
    setContent({
      ...content,
      [name]: value
    });
  };
  
  // Handle metadata field changes
  const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (!content) return;
    
    setContent({
      ...content,
      metadata: {
        ...content.metadata,
        [name]: value
      }
    });
  };
  
  // Handle tag/genre/cast management
  const handleAddTag = () => {
    if (!newTag.trim() || !content) return;
    
    const tags = content.metadata.tags || [];
    
    if (!tags.includes(newTag.trim())) {
      setContent({
        ...content,
        metadata: {
          ...content.metadata,
          tags: [...tags, newTag.trim()]
        }
      });
      setNewTag('');
    }
  };
  
  const handleRemoveTag = (tag: string) => {
    if (!content) return;
    
    const tags = content.metadata.tags || [];
    
    setContent({
      ...content,
      metadata: {
        ...content.metadata,
        tags: tags.filter(t => t !== tag)
      }
    });
  };
  
  const handleAddGenre = () => {
    if (!newGenre.trim() || !content) return;
    
    const genres = content.metadata.genres || [];
    
    if (!genres.includes(newGenre.trim())) {
      setContent({
        ...content,
        metadata: {
          ...content.metadata,
          genres: [...genres, newGenre.trim()]
        }
      });
      setNewGenre('');
    }
  };
  
  const handleRemoveGenre = (genre: string) => {
    if (!content) return;
    
    const genres = content.metadata.genres || [];
    
    setContent({
      ...content,
      metadata: {
        ...content.metadata,
        genres: genres.filter(g => g !== genre)
      }
    });
  };
  
  const handleAddCastMember = () => {
    if (!newCastMember.trim() || !content) return;
    
    const cast = content.metadata.cast || [];
    
    if (!cast.includes(newCastMember.trim())) {
      setContent({
        ...content,
        metadata: {
          ...content.metadata,
          cast: [...cast, newCastMember.trim()]
        }
      });
      setNewCastMember('');
    }
  };
  
  const handleRemoveCastMember = (member: string) => {
    if (!content) return;
    
    const cast = content.metadata.cast || [];
    
    setContent({
      ...content,
      metadata: {
        ...content.metadata,
        cast: cast.filter(m => m !== member)
      }
    });
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!content) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      // In a real app, this would call an API to update the content
      // For demo, we'll simulate an API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Success!
      setSuccess(true);
      
      // Call success callback or navigate after a delay
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/creator/dashboard');
        }
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update content');
      setSubmitting(false);
    }
  };
  
  // Handle cancel
  const handleCancel = () => {
    navigate('/creator/dashboard');
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!content) {
    return (
      <Alert severity="error">
        <AlertTitle>Error</AlertTitle>
        Content not found or failed to load.
      </Alert>
    );
  }
  
  if (success) {
    return (
      <Alert severity="success" sx={{ mb: 3 }}>
        <AlertTitle>Success!</AlertTitle>
        Content updated successfully. Redirecting to dashboard...
      </Alert>
    );
  }
  
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Edit Content
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Basic Information
          </Typography>
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="Title"
            name="title"
            value={content.title}
            onChange={handleInputChange}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={content.description}
            onChange={handleInputChange}
            multiline
            rows={4}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Content Type</InputLabel>
            <Select
              name="contentType"
              value={content.contentType}
              onChange={handleSelectChange}
              label="Content Type"
            >
              {CONTENT_TYPES.map(type => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Visibility</InputLabel>
            <Select
              name="visibility"
              value={content.visibility}
              onChange={handleSelectChange}
              label="Visibility"
              disabled={content.tokenized}
            >
              <MenuItem value="private">Private (Only you)</MenuItem>
              <MenuItem value="unlisted">Unlisted (Anyone with link)</MenuItem>
              <MenuItem value="public">Public (Listed in marketplace)</MenuItem>
            </Select>
            {content.tokenized && (
              <FormHelperText>
                Visibility cannot be changed after tokenization
              </FormHelperText>
            )}
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={content.status}
              onChange={handleSelectChange}
              label="Status"
              disabled={content.tokenized}
            >
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="active">Active</MenuItem>
            </Select>
            {content.tokenized && (
              <FormHelperText>
                Status cannot be changed after tokenization
              </FormHelperText>
            )}
          </FormControl>
        </Grid>
        
        {/* Divider */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>
            Metadata
          </Typography>
        </Grid>
        
        {/* Year, Duration, Director */}
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Release Year"
            name="releaseYear"
            value={content.metadata.releaseYear || ''}
            onChange={handleMetadataChange}
          />
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Duration"
            name="duration"
            value={content.metadata.duration || ''}
            onChange={handleMetadataChange}
            placeholder="e.g., 90 minutes"
          />
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Director"
            name="director"
            value={content.metadata.director || ''}
            onChange={handleMetadataChange}
          />
        </Grid>
        
        {/* Genres */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Genres
          </Typography>
          <Box sx={{ display: 'flex', mb: 1 }}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              label="Add a genre"
              value={newGenre}
              onChange={(e) => setNewGenre(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddGenre();
                }
              }}
            />
            <Button
              variant="contained"
              onClick={handleAddGenre}
              disabled={!newGenre.trim()}
              sx={{ ml: 1 }}
            >
              Add
            </Button>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {content.metadata.genres?.map((genre) => (
              <Chip
                key={genre}
                label={genre}
                onDelete={() => handleRemoveGenre(genre)}
                sx={{ mb: 1 }}
              />
            ))}
          </Stack>
        </Grid>
        
        {/* Cast */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Cast
          </Typography>
          <Box sx={{ display: 'flex', mb: 1 }}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              label="Add cast member"
              value={newCastMember}
              onChange={(e) => setNewCastMember(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCastMember();
                }
              }}
            />
            <Button
              variant="contained"
              onClick={handleAddCastMember}
              disabled={!newCastMember.trim()}
              sx={{ ml: 1 }}
            >
              Add
            </Button>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {content.metadata.cast?.map((member) => (
              <Chip
                key={member}
                label={member}
                onDelete={() => handleRemoveCastMember(member)}
                sx={{ mb: 1 }}
              />
            ))}
          </Stack>
        </Grid>
        
        {/* Tags */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Tags
          </Typography>
          <Box sx={{ display: 'flex', mb: 1 }}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              label="Add a tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button
              variant="contained"
              onClick={handleAddTag}
              disabled={!newTag.trim()}
              sx={{ ml: 1 }}
            >
              Add
            </Button>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {content.metadata.tags?.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                onDelete={() => handleRemoveTag(tag)}
                sx={{ mb: 1 }}
              />
            ))}
          </Stack>
        </Grid>
        
        {/* IPFS Information (Read-only) */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>
            Storage Information
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom>
                Main Content CID
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                {content.ipfsCid || 'Not available'}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom>
                Preview CID
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                {content.previewCid || 'Not available'}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom>
                Thumbnail CID
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                {content.thumbnailCid || 'Not available'}
              </Typography>
            </Grid>
          </Grid>
        </Grid>
        
        {/* Actions */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<PlayArrowIcon />}
              component={Link}
              to={`/player/${content.id}`}
            >
              Preview Content
            </Button>
            
            <Box>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
                sx={{ mr: 2 }}
                disabled={submitting}
              >
                Cancel
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default EditContentForm;