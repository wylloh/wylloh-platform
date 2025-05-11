import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Divider,
  Grid,
  Card,
  CardContent,
  IconButton,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  CircularProgress,
  Link
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { ContentMetadata, ContentType } from '../../services/metadata.service';
import useMetadata from '../../hooks/useMetadata';

interface MetadataDisplayProps {
  contentId: string;
  metadata?: ContentMetadata;
  showEdit?: boolean;
  onEdit?: () => void;
  condensed?: boolean;
}

const MetadataDisplay: React.FC<MetadataDisplayProps> = ({
  contentId,
  metadata: propMetadata,
  showEdit = false,
  onEdit,
  condensed = false
}) => {
  const [expanded, setExpanded] = useState(!condensed);
  const { metadata: fetchedMetadata, loading, error } = useMetadata(contentId);
  
  // Use provided metadata or fetch it
  const metadata = propMetadata || fetchedMetadata;
  
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };
  
  // Format duration from seconds to HH:MM:SS
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return 'Unknown';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m ${remainingSeconds}s`;
    }
  };
  
  if (loading && !metadata) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress size={24} />
      </Box>
    );
  }
  
  if (error || !metadata) {
    return (
      <Box p={2}>
        <Typography color="error">
          {error || 'No metadata available'}
        </Typography>
      </Box>
    );
  }
  
  // Basic metadata display for condensed view
  if (condensed) {
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="subtitle1" fontWeight="bold">
            Metadata
          </Typography>
          
          <Box>
            {showEdit && (
              <IconButton 
                size="small" 
                onClick={onEdit}
                sx={{ mr: 1 }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            )}
            
            <IconButton 
              size="small" 
              onClick={handleExpandClick}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>
        
        <Collapse in={expanded}>
          <Grid container spacing={1}>
            {metadata.releaseYear && (
              <Grid item>
                <Chip 
                  size="small" 
                  label={metadata.releaseYear} 
                  variant="outlined"
                />
              </Grid>
            )}
            
            {metadata.duration && (
              <Grid item>
                <Chip 
                  size="small" 
                  label={formatDuration(metadata.duration)} 
                  variant="outlined"
                />
              </Grid>
            )}
            
            {metadata.genre && metadata.genre.length > 0 && (
              <Grid item>
                <Chip 
                  size="small" 
                  label={metadata.genre[0]} 
                  color="primary"
                  variant="outlined"
                />
                {metadata.genre.length > 1 && (
                  <Chip 
                    size="small" 
                    label={`+${metadata.genre.length - 1}`}
                    variant="outlined"
                    sx={{ ml: 0.5 }}
                  />
                )}
              </Grid>
            )}
            
            {metadata.language && (
              <Grid item>
                <Chip 
                  size="small" 
                  label={metadata.language} 
                  variant="outlined"
                />
              </Grid>
            )}
          </Grid>
        </Collapse>
      </Box>
    );
  }
  
  // Full metadata display
  return (
    <Card variant="outlined">
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Content Information
          </Typography>
          
          {showEdit && (
            <IconButton onClick={onEdit}>
              <EditIcon />
            </IconButton>
          )}
        </Box>
        
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Basic Details
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell component="th" width="40%">Title</TableCell>
                    <TableCell>{metadata.title}</TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell component="th">Content Type</TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>
                      {metadata.contentType}
                    </TableCell>
                  </TableRow>
                  
                  {metadata.releaseYear && (
                    <TableRow>
                      <TableCell component="th">Release Year</TableCell>
                      <TableCell>{metadata.releaseYear}</TableCell>
                    </TableRow>
                  )}
                  
                  {metadata.duration && (
                    <TableRow>
                      <TableCell component="th">Duration</TableCell>
                      <TableCell>{formatDuration(metadata.duration)}</TableCell>
                    </TableRow>
                  )}
                  
                  {metadata.language && (
                    <TableRow>
                      <TableCell component="th">Language</TableCell>
                      <TableCell>{metadata.language}</TableCell>
                    </TableRow>
                  )}
                  
                  {metadata.country && (
                    <TableRow>
                      <TableCell component="th">Country</TableCell>
                      <TableCell>{metadata.country}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          
          {/* Credits */}
          {(metadata.contentType === ContentType.MOVIE ||
            metadata.contentType === ContentType.SERIES ||
            metadata.contentType === ContentType.SHORT) && (
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Credits
              </Typography>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableBody>
                    {metadata.director && (
                      <TableRow>
                        <TableCell component="th" width="40%">Director</TableCell>
                        <TableCell>{metadata.director}</TableCell>
                      </TableRow>
                    )}
                    
                    {metadata.producer && (
                      <TableRow>
                        <TableCell component="th">Producer</TableCell>
                        <TableCell>{metadata.producer}</TableCell>
                      </TableRow>
                    )}
                    
                    {metadata.writer && (
                      <TableRow>
                        <TableCell component="th">Writer</TableCell>
                        <TableCell>{metadata.writer}</TableCell>
                      </TableRow>
                    )}
                    
                    {metadata.studio && (
                      <TableRow>
                        <TableCell component="th">Studio</TableCell>
                        <TableCell>{metadata.studio}</TableCell>
                      </TableRow>
                    )}
                    
                    {metadata.cast && metadata.cast.length > 0 && (
                      <TableRow>
                        <TableCell component="th">Cast</TableCell>
                        <TableCell>
                          {metadata.cast.slice(0, 3).join(', ')}
                          {metadata.cast.length > 3 && `, +${metadata.cast.length - 3} more`}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          )}
          
          {/* Description */}
          {metadata.description && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Description
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2">
                  {metadata.description}
                </Typography>
              </Paper>
            </Grid>
          )}
          
          {/* Classification */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Classification
            </Typography>
            
            <Paper variant="outlined" sx={{ p: 2 }}>
              {metadata.genre && metadata.genre.length > 0 ? (
                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Genres
                  </Typography>
                  <Box>
                    {metadata.genre.map((genre, index) => (
                      <Chip
                        key={index}
                        label={genre}
                        color="primary"
                        variant="outlined"
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  No genres specified
                </Typography>
              )}
              
              {metadata.tags && metadata.tags.length > 0 && (
                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Tags
                  </Typography>
                  <Box>
                    {metadata.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        variant="outlined"
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>
          
          {/* External References */}
          {metadata.references && Object.keys(metadata.references).length > 0 && (
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                External References
              </Typography>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableBody>
                    {metadata.references.imdb && (
                      <TableRow>
                        <TableCell component="th" width="40%">IMDB</TableCell>
                        <TableCell>
                          <Link 
                            href={`https://www.imdb.com/title/${metadata.references.imdb}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            {metadata.references.imdb}
                          </Link>
                        </TableCell>
                      </TableRow>
                    )}
                    
                    {metadata.references.tmdb && (
                      <TableRow>
                        <TableCell component="th">TMDB</TableCell>
                        <TableCell>
                          <Link 
                            href={`https://www.themoviedb.org/movie/${metadata.references.tmdb}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            {metadata.references.tmdb}
                          </Link>
                        </TableCell>
                      </TableRow>
                    )}
                    
                    {metadata.references.musicbrainz && (
                      <TableRow>
                        <TableCell component="th">MusicBrainz</TableCell>
                        <TableCell>
                          <Link 
                            href={`https://musicbrainz.org/recording/${metadata.references.musicbrainz}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            {metadata.references.musicbrainz}
                          </Link>
                        </TableCell>
                      </TableRow>
                    )}
                    
                    {metadata.references.custom && Object.entries(metadata.references.custom).map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell component="th">{key}</TableCell>
                        <TableCell>{value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          )}
          
          {/* Technical Information */}
          <Grid item xs={12}>
            <Box mt={1} display="flex" justifyContent="flex-end">
              <Typography variant="caption" color="textSecondary">
                Metadata version: {metadata.version}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default MetadataDisplay; 