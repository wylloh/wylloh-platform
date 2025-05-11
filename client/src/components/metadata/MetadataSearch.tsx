import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Divider,
  CircularProgress,
  Card,
  CardContent,
  Collapse,
  InputAdornment,
  Pagination
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Add as AddIcon
} from '@mui/icons-material';
import metadataService, { 
  ContentMetadata, 
  ContentType, 
  MetadataQueryOptions,
  MetadataSearchFilter
} from '../../services/metadata.service';
import { Link as RouterLink } from 'react-router-dom';

interface MetadataSearchProps {
  onSelectContent?: (contentId: string, metadata: ContentMetadata) => void;
  defaultContentType?: ContentType;
  showAdvanced?: boolean;
}

const MetadataSearch: React.FC<MetadataSearchProps> = ({
  onSelectContent,
  defaultContentType,
  showAdvanced = true
}) => {
  const [query, setQuery] = useState('');
  const [contentType, setContentType] = useState<ContentType | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ contentId: string, metadata: ContentMetadata }[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  
  // Advanced filters
  const [releaseYearMin, setReleaseYearMin] = useState<number | ''>('');
  const [releaseYearMax, setReleaseYearMax] = useState<number | ''>('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [minDuration, setMinDuration] = useState<number | ''>('');
  const [maxDuration, setMaxDuration] = useState<number | ''>('');
  
  // Set default content type if provided
  useEffect(() => {
    if (defaultContentType) {
      setContentType(defaultContentType);
    }
  }, [defaultContentType]);
  
  // Handle search
  const handleSearch = async () => {
    setLoading(true);
    
    try {
      // Build search filters
      const filters: MetadataSearchFilter[] = [];
      
      if (contentType) {
        filters.push({
          field: 'contentType',
          operator: 'eq',
          value: contentType
        });
      }
      
      if (releaseYearMin !== '') {
        filters.push({
          field: 'releaseYear',
          operator: 'gte',
          value: releaseYearMin
        });
      }
      
      if (releaseYearMax !== '') {
        filters.push({
          field: 'releaseYear',
          operator: 'lte',
          value: releaseYearMax
        });
      }
      
      if (selectedGenres.length > 0) {
        filters.push({
          field: 'genre',
          operator: 'in',
          value: selectedGenres
        });
      }
      
      if (selectedLanguage) {
        filters.push({
          field: 'language',
          operator: 'eq',
          value: selectedLanguage
        });
      }
      
      if (minDuration !== '') {
        filters.push({
          field: 'duration',
          operator: 'gte',
          value: minDuration
        });
      }
      
      if (maxDuration !== '') {
        filters.push({
          field: 'duration',
          operator: 'lte',
          value: maxDuration
        });
      }
      
      // Search options
      const options: MetadataQueryOptions = {
        filters,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        sort: {
          field: 'releaseYear',
          direction: 'desc'
        }
      };
      
      // Execute search
      const { metadata, total } = await metadataService.searchMetadata(
        contentType as ContentType | undefined,
        query,
        options
      );
      
      // Map results with content IDs
      const mappedResults = metadata.map(item => ({
        contentId: item.contentId || '',
        metadata: item
      })).filter(item => item.contentId);
      
      setResults(mappedResults);
      setTotalResults(total);
    } catch (error) {
      console.error('Error searching metadata:', error);
      setResults([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle page change
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    
    // Re-run search with new page
    handleSearch();
  };
  
  // Handle genre selection
  const handleGenreSelect = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };
  
  // Reset all filters
  const handleResetFilters = () => {
    setContentType(defaultContentType || '');
    setReleaseYearMin('');
    setReleaseYearMax('');
    setSelectedGenres([]);
    setSelectedLanguage('');
    setMinDuration('');
    setMaxDuration('');
  };
  
  // Format duration from seconds to human-readable format
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };
  
  // Common genre options
  const genreOptions = [
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 
    'Drama', 'Family', 'Fantasy', 'Horror', 'Mystery', 'Romance', 
    'Science Fiction', 'Thriller', 'War', 'Western', 'Musical', 'Biography'
  ];
  
  // Language options
  const languageOptions = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Japanese', 
    'Chinese', 'Korean', 'Russian', 'Arabic', 'Hindi', 'Portuguese'
  ];
  
  return (
    <Box>
      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              label="Search Content"
              variant="outlined"
              fullWidth
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: query && (
                  <InputAdornment position="end">
                    <IconButton 
                      size="small" 
                      onClick={() => setQuery('')}
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Content Type</InputLabel>
              <Select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as ContentType | '')}
                label="Content Type"
              >
                <MenuItem value="">All Types</MenuItem>
                {Object.values(ContentType).map(type => (
                  <MenuItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleSearch}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={18} /> : <SearchIcon />}
              >
                Search
              </Button>
              
              {showAdvanced && (
                <Button
                  variant="outlined"
                  onClick={() => setShowFilters(!showFilters)}
                  endIcon={showFilters ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                >
                  Filters
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
        
        {/* Advanced Filters */}
        {showAdvanced && (
          <Collapse in={showFilters}>
            <Box mt={3}>
              <Typography variant="subtitle2" gutterBottom>
                Advanced Filters
              </Typography>
              
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Release Year
                  </Typography>
                  
                  <Box display="flex" gap={1}>
                    <TextField
                      label="From"
                      type="number"
                      value={releaseYearMin}
                      onChange={(e) => setReleaseYearMin(
                        e.target.value === '' ? '' : Number(e.target.value)
                      )}
                      InputProps={{ inputProps: { min: 1900, max: new Date().getFullYear() } }}
                      fullWidth
                      size="small"
                    />
                    <TextField
                      label="To"
                      type="number"
                      value={releaseYearMax}
                      onChange={(e) => setReleaseYearMax(
                        e.target.value === '' ? '' : Number(e.target.value)
                      )}
                      InputProps={{ inputProps: { min: 1900, max: new Date().getFullYear() + 5 } }}
                      fullWidth
                      size="small"
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Duration
                  </Typography>
                  
                  <Box display="flex" gap={1}>
                    <TextField
                      label="Min (seconds)"
                      type="number"
                      value={minDuration}
                      onChange={(e) => setMinDuration(
                        e.target.value === '' ? '' : Number(e.target.value)
                      )}
                      fullWidth
                      size="small"
                    />
                    <TextField
                      label="Max (seconds)"
                      type="number"
                      value={maxDuration}
                      onChange={(e) => setMaxDuration(
                        e.target.value === '' ? '' : Number(e.target.value)
                      )}
                      fullWidth
                      size="small"
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Language
                  </Typography>
                  
                  <FormControl fullWidth size="small">
                    <InputLabel>Language</InputLabel>
                    <Select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value as string)}
                      label="Language"
                    >
                      <MenuItem value="">Any Language</MenuItem>
                      {languageOptions.map(language => (
                        <MenuItem key={language} value={language}>
                          {language}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Genres
                  </Typography>
                  
                  <Box>
                    {genreOptions.map(genre => (
                      <Chip
                        key={genre}
                        label={genre}
                        onClick={() => handleGenreSelect(genre)}
                        color={selectedGenres.includes(genre) ? 'primary' : 'default'}
                        variant={selectedGenres.includes(genre) ? 'filled' : 'outlined'}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Box display="flex" justifyContent="flex-end">
                    <Button
                      variant="text"
                      onClick={handleResetFilters}
                      size="small"
                    >
                      Reset Filters
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        )}
      </Paper>
      
      {/* Search Results */}
      <Box>
        {loading && results.length === 0 ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : results.length > 0 ? (
          <>
            <Typography variant="subtitle2" gutterBottom>
              {totalResults} result{totalResults !== 1 ? 's' : ''} found
            </Typography>
            
            <Grid container spacing={2}>
              {results.map((result) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={result.contentId}>
                  <Card 
                    variant="outlined"
                    sx={{ 
                      cursor: onSelectContent ? 'pointer' : 'default',
                      '&:hover': onSelectContent ? {
                        boxShadow: 2,
                        borderColor: 'primary.main'
                      } : {}
                    }}
                    onClick={() => onSelectContent && onSelectContent(result.contentId, result.metadata)}
                  >
                    <CardContent>
                      <Typography variant="subtitle1" noWrap fontWeight="medium">
                        {result.metadata.title}
                      </Typography>
                      
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        {result.metadata.contentType}
                        {result.metadata.releaseYear && ` • ${result.metadata.releaseYear}`}
                        {result.metadata.duration && ` • ${formatDuration(result.metadata.duration)}`}
                      </Typography>
                      
                      {result.metadata.genre && result.metadata.genre.length > 0 && (
                        <Box mt={1}>
                          {result.metadata.genre.slice(0, 2).map((genre, idx) => (
                            <Chip
                              key={idx}
                              label={genre}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                          {result.metadata.genre.length > 2 && (
                            <Chip 
                              label={`+${result.metadata.genre.length - 2}`}
                              size="small"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          )}
                        </Box>
                      )}
                      
                      {!onSelectContent && (
                        <Box mt={1} display="flex" justifyContent="flex-end">
                          <Button 
                            component={RouterLink} 
                            to={`/content/${result.contentId}`} 
                            size="small"
                          >
                            View Details
                          </Button>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            {/* Pagination */}
            {totalResults > pageSize && (
              <Box display="flex" justifyContent="center" mt={3}>
                <Pagination
                  count={Math.ceil(totalResults / pageSize)}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            )}
          </>
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="subtitle1" color="textSecondary">
              No results found
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Try adjusting your search or filters
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default MetadataSearch; 