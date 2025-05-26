import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Alert,
  IconButton,
  Autocomplete,
  SelectChangeEvent
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import useMetadata from '../../hooks/useMetadata';
import {
  ContentMetadata,
  ContentType,
  MetadataFieldType
} from '../../services/metadata.service';

interface MetadataEditorProps {
  contentId: string;
  contentType: ContentType;
  onSave?: (metadata: ContentMetadata) => void;
  readOnly?: boolean;
}

const MetadataEditor: React.FC<MetadataEditorProps> = ({
  contentId,
  contentType,
  onSave,
  readOnly = false
}) => {
  const {
    metadata,
    loading,
    error,
    validationErrors,
    updateMetadata,
    generateMetadata
  } = useMetadata(contentId, contentType);
  
  const [localMetadata, setLocalMetadata] = useState<Partial<ContentMetadata>>({});
  const [expanded, setExpanded] = useState<string | false>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // When metadata is loaded, update local state
  useEffect(() => {
    if (metadata) {
      setLocalMetadata(metadata);
    }
  }, [metadata]);
  
  // Handle panel expansion
  const handlePanelChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };
  
  // Handle text field changes
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLocalMetadata(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle number field changes
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalMetadata(prev => ({
      ...prev,
      [name]: value === '' ? '' : Number(value)
    }));
  };
  
  // Handle select field changes
  const handleSelectChange = (e: SelectChangeEvent<any>) => {
    const name = e.target.name as string;
    const value = e.target.value;
    setLocalMetadata(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle array field changes (tags, genres, etc.)
  const handleArrayChange = (name: string, values: string[]) => {
    setLocalMetadata(prev => ({
      ...prev,
      [name]: values
    }));
  };
  
  // Handle tag input (on enter key)
  const handleTagInput = (name: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      e.preventDefault();
      const value = e.currentTarget.value.trim();
      
      setLocalMetadata(prev => {
        const currentArray = prev[name] || [];
        
        if (Array.isArray(currentArray) && !currentArray.includes(value)) {
          return {
            ...prev,
            [name]: [...currentArray, value]
          };
        }
        
        return prev;
      });
      
      // Clear the input
      e.currentTarget.value = '';
    }
  };
  
  // Remove item from array
  const handleRemoveArrayItem = (name: string, index: number) => {
    setLocalMetadata(prev => {
      const currentArray = prev[name] || [];
      
      if (Array.isArray(currentArray)) {
        return {
          ...prev,
          [name]: currentArray.filter((_, i) => i !== index)
        };
      }
      
      return prev;
    });
  };
  
  // Save metadata changes
  const handleSave = async () => {
    if (!localMetadata || readOnly) return;
    
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      await updateMetadata(localMetadata);
      setSaveSuccess(true);
      
      if (onSave && metadata) {
        onSave({
          ...metadata,
          ...localMetadata
        });
      }
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error saving metadata:', err);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Generate metadata
  const handleGenerateMetadata = async () => {
    await generateMetadata();
  };
  
  // Get validation error for a field
  const getFieldError = (fieldName: string): string | undefined => {
    const error = validationErrors.find(e => e.field === fieldName);
    return error?.message;
  };
  
  if (loading && !metadata) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }
  
  const genreOptions = [
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 
    'Drama', 'Family', 'Fantasy', 'Horror', 'Mystery', 'Romance', 
    'Science Fiction', 'Thriller', 'War', 'Western', 'Musical', 'Biography'
  ];
  
  const languageOptions = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Japanese', 
    'Chinese', 'Korean', 'Russian', 'Arabic', 'Hindi', 'Portuguese'
  ];
  
  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Metadata saved successfully!
        </Alert>
      )}
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Content Metadata</Typography>
        
        <Box>
          {!readOnly && (
            <>
              <Button 
                startIcon={<RefreshIcon />}
                variant="outlined" 
                color="secondary"
                onClick={handleGenerateMetadata}
                sx={{ mr: 1 }}
              >
                Generate
              </Button>
              
              <Button
                startIcon={<SaveIcon />}
                variant="contained"
                color="primary"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          )}
        </Box>
      </Box>
      
      {/* Basic Information */}
      <Accordion 
        expanded={expanded === 'basic'} 
        onChange={handlePanelChange('basic')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">Basic Information</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Title"
                name="title"
                value={localMetadata.title || ''}
                onChange={handleTextChange}
                fullWidth
                required
                error={!!getFieldError('title')}
                helperText={getFieldError('title')}
                InputProps={{
                  readOnly
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Content Type</InputLabel>
                <Select
                  name="contentType"
                  value={localMetadata.contentType || contentType}
                  onChange={handleSelectChange}
                  disabled={readOnly}
                >
                  {Object.values(ContentType).map(type => (
                    <MenuItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Description"
                name="description"
                value={localMetadata.description || ''}
                onChange={handleTextChange}
                fullWidth
                multiline
                rows={3}
                InputProps={{
                  readOnly
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Release Year"
                name="releaseYear"
                type="number"
                value={localMetadata.releaseYear || ''}
                onChange={handleNumberChange}
                fullWidth
                inputProps={{ min: 1900, max: new Date().getFullYear() + 5 }}
                InputProps={{
                  readOnly
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Duration (seconds)"
                name="duration"
                type="number"
                value={localMetadata.duration || ''}
                onChange={handleNumberChange}
                fullWidth
                inputProps={{ min: 0 }}
                InputProps={{
                  readOnly
                }}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
      
      {/* Classification */}
      <Accordion 
        expanded={expanded === 'classification'} 
        onChange={handlePanelChange('classification')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">Classification</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                freeSolo
                options={genreOptions}
                value={localMetadata.genre || []}
                onChange={(_, newValue) => handleArrayChange('genre', newValue)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      {...getTagProps({ index })}
                      disabled={readOnly}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Genres"
                    placeholder="Add genre"
                    onKeyDown={(e) => handleTagInput('genre', e as any)}
                  />
                )}
                disabled={readOnly}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={localMetadata.tags || []}
                onChange={(_, newValue) => handleArrayChange('tags', newValue)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      {...getTagProps({ index })}
                      disabled={readOnly}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Tags"
                    placeholder="Add tag"
                    onKeyDown={(e) => handleTagInput('tags', e as any)}
                  />
                )}
                disabled={readOnly}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Autocomplete
                freeSolo
                options={languageOptions}
                value={localMetadata.language || ''}
                onChange={(_, newValue) => {
                  setLocalMetadata(prev => ({
                    ...prev,
                    language: newValue
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Language"
                  />
                )}
                disabled={readOnly}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Country"
                name="country"
                value={localMetadata.country || ''}
                onChange={handleTextChange}
                fullWidth
                InputProps={{
                  readOnly
                }}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
      
      {/* Credits */}
      {(contentType === ContentType.MOVIE || 
        contentType === ContentType.SERIES || 
        contentType === ContentType.SHORT) && (
        <Accordion 
          expanded={expanded === 'credits'} 
          onChange={handlePanelChange('credits')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Credits</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={[]}
                  value={localMetadata.cast || []}
                  onChange={(_, newValue) => handleArrayChange('cast', newValue)}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        {...getTagProps({ index })}
                        disabled={readOnly}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      label="Cast"
                      placeholder="Add cast member"
                      onKeyDown={(e) => handleTagInput('cast', e as any)}
                    />
                  )}
                  disabled={readOnly}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Director"
                  name="director"
                  value={localMetadata.director || ''}
                  onChange={handleTextChange}
                  fullWidth
                  InputProps={{
                    readOnly
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Producer"
                  name="producer"
                  value={localMetadata.producer || ''}
                  onChange={handleTextChange}
                  fullWidth
                  InputProps={{
                    readOnly
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Writer"
                  name="writer"
                  value={localMetadata.writer || ''}
                  onChange={handleTextChange}
                  fullWidth
                  InputProps={{
                    readOnly
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Studio"
                  name="studio"
                  value={localMetadata.studio || ''}
                  onChange={handleTextChange}
                  fullWidth
                  InputProps={{
                    readOnly
                  }}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}
      
      {/* External References */}
      <Accordion 
        expanded={expanded === 'references'} 
        onChange={handlePanelChange('references')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">External References</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="IMDB ID"
                name="references.imdb"
                value={localMetadata.references?.imdb || ''}
                onChange={(e) => {
                  setLocalMetadata(prev => ({
                    ...prev,
                    references: {
                      ...(prev.references || {}),
                      imdb: e.target.value
                    }
                  }));
                }}
                fullWidth
                InputProps={{
                  readOnly
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="TMDB ID"
                name="references.tmdb"
                value={localMetadata.references?.tmdb || ''}
                onChange={(e) => {
                  setLocalMetadata(prev => ({
                    ...prev,
                    references: {
                      ...(prev.references || {}),
                      tmdb: e.target.value
                    }
                  }));
                }}
                fullWidth
                InputProps={{
                  readOnly
                }}
              />
            </Grid>
            
            {contentType === ContentType.MUSIC && (
              <Grid item xs={12} md={6}>
                <TextField
                  label="MusicBrainz ID"
                  name="references.musicbrainz"
                  value={localMetadata.references?.musicbrainz || ''}
                  onChange={(e) => {
                    setLocalMetadata(prev => ({
                      ...prev,
                      references: {
                        ...(prev.references || {}),
                        musicbrainz: e.target.value
                      }
                    }));
                  }}
                  fullWidth
                  InputProps={{
                    readOnly
                  }}
                />
              </Grid>
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default MetadataEditor; 