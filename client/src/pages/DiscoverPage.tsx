import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  CircularProgress,
  Alert,
  Button,
  Divider,
  useTheme,
  useMediaQuery,
  Paper
} from '@mui/material';
import { 
  Search as SearchIcon,
  TrendingUp as TrendingIcon,
  Favorite as FavoriteIcon,
  NewReleases as NewReleasesIcon,
  TheatersOutlined as GenreIcon,
  FilterAlt as FilterIcon
} from '@mui/icons-material';
import RecommendationsList from '../components/recommendations/RecommendationsList';
import PersonalizedRecommendations from '../components/recommendations/PersonalizedRecommendations';
import { RecommendationType } from '../services/recommendation.service';
import { ContentType } from '../services/content.service';
import { useAuth } from '../contexts/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`discover-tabpanel-${index}`}
      aria-labelledby={`discover-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `discover-tab-${index}`,
    'aria-controls': `discover-tabpanel-${index}`,
  };
}

const genres = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
  'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery',
  'Romance', 'Science Fiction', 'Thriller', 'War', 'Western'
];

const contentTypes = [
  { value: '', label: 'All Types' },
  { value: 'movie', label: 'Movies' },
  { value: 'series', label: 'Series' },
  { value: 'short', label: 'Shorts' },
  { value: 'documentary', label: 'Documentaries' },
  { value: 'music', label: 'Music' }
];

const filterOptions = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'new', label: 'Newest First' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' }
];

const DiscoverPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isAuthenticated } = useAuth();
  
  // Extract initial filter from URL params
  const searchParams = new URLSearchParams(location.search);
  const initialSearchQuery = searchParams.get('search') || '';
  const initialContentType = searchParams.get('type') || '';
  const initialFilterType = searchParams.get('filter') || 'popular';
  const initialGenre = searchParams.get('genre') || '';
  
  // States
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [contentType, setContentType] = useState<string>(initialContentType);
  const [filterType, setFilterType] = useState(initialFilterType);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    initialGenre ? [initialGenre] : []
  );
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };
  
  // Handle content type change
  const handleContentTypeChange = (event: SelectChangeEvent) => {
    setContentType(event.target.value);
    updateUrlParams({ type: event.target.value });
  };
  
  // Handle filter type change
  const handleFilterChange = (event: SelectChangeEvent) => {
    setFilterType(event.target.value);
    updateUrlParams({ filter: event.target.value });
  };
  
  // Handle genre selection
  const handleGenreClick = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
      updateUrlParams({ genre: '' });
    } else {
      setSelectedGenres([genre]);
      updateUrlParams({ genre });
    }
  };
  
  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setContentType('');
    setFilterType('popular');
    setSelectedGenres([]);
    navigate('/discover');
  };
  
  // Update URL params when filters change
  const updateUrlParams = (params: Record<string, string>) => {
    const newSearchParams = new URLSearchParams(location.search);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newSearchParams.set(key, value);
      } else {
        newSearchParams.delete(key);
      }
    });
    
    navigate({
      pathname: location.pathname,
      search: newSearchParams.toString()
    });
  };
  
  // Handle search submission
  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    updateUrlParams({ search: searchQuery });
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Discover Content
        </Typography>
        
        {/* Search and Filter Bar */}
        <Paper
          component="form"
          onSubmit={handleSearch}
          elevation={0}
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search titles, creators, etc."
                value={searchQuery}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="content-type-label">Content Type</InputLabel>
                <Select
                  labelId="content-type-label"
                  id="content-type"
                  value={contentType}
                  onChange={handleContentTypeChange}
                  label="Content Type"
                >
                  {contentTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="filter-type-label">Sort By</InputLabel>
                <Select
                  labelId="filter-type-label"
                  id="filter-type"
                  value={filterType}
                  onChange={handleFilterChange}
                  label="Sort By"
                >
                  {filterOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                sx={{ height: '56px' }}
              >
                Search
              </Button>
            </Grid>
          </Grid>
          
          {/* Genre filters */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Genres:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {genres.map((genre) => (
                <Chip
                  key={genre}
                  label={genre}
                  clickable
                  onClick={() => handleGenreClick(genre)}
                  color={selectedGenres.includes(genre) ? "primary" : "default"}
                  variant={selectedGenres.includes(genre) ? "filled" : "outlined"}
                />
              ))}
            </Box>
          </Box>
          
          {/* Active filters summary */}
          {(searchQuery || contentType || selectedGenres.length > 0 || filterType !== 'popular') && (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
              <FilterIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                Active filters:
              </Typography>
              {searchQuery && (
                <Chip 
                  label={`Search: ${searchQuery}`} 
                  size="small" 
                  onDelete={() => { setSearchQuery(''); updateUrlParams({ search: '' }); }}
                  sx={{ mr: 1 }}
                />
              )}
              {contentType && (
                <Chip 
                  label={`Type: ${contentTypes.find(t => t.value === contentType)?.label}`} 
                  size="small" 
                  onDelete={() => { setContentType(''); updateUrlParams({ type: '' }); }}
                  sx={{ mr: 1 }}
                />
              )}
              {selectedGenres.map(genre => (
                <Chip 
                  key={genre}
                  label={`Genre: ${genre}`} 
                  size="small" 
                  onDelete={() => handleGenreClick(genre)}
                  sx={{ mr: 1 }}
                />
              ))}
              {filterType !== 'popular' && (
                <Chip 
                  label={`Sort: ${filterOptions.find(f => f.value === filterType)?.label}`} 
                  size="small" 
                  onDelete={() => { setFilterType('popular'); updateUrlParams({ filter: 'popular' }); }}
                  sx={{ mr: 1 }}
                />
              )}
              <Button 
                variant="text" 
                size="small" 
                onClick={handleClearFilters}
              >
                Clear All
              </Button>
            </Box>
          )}
        </Paper>
        
        {/* Tab Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="discover tabs"
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            <Tab icon={<TrendingIcon />} label="Trending" {...a11yProps(0)} />
            {isAuthenticated && (
              <Tab icon={<FavoriteIcon />} label="For You" {...a11yProps(1)} />
            )}
            <Tab icon={<NewReleasesIcon />} label="New Releases" {...a11yProps(isAuthenticated ? 2 : 1)} />
            <Tab icon={<GenreIcon />} label="By Genre" {...a11yProps(isAuthenticated ? 3 : 2)} />
          </Tabs>
        </Box>
        
        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          <RecommendationsList
            title="Trending Now"
            type={RecommendationType.TRENDING}
            options={{
              contentType: contentType as ContentType || undefined,
              limit: 12,
              filter: filterType
            }}
            maxItems={12}
            showReason={false}
          />
        </TabPanel>
        
        {isAuthenticated && (
          <TabPanel value={tabValue} index={1}>
            <PersonalizedRecommendations
              contentType={contentType as ContentType || undefined}
              title="Recommended For You"
              maxItems={12}
              showReasons={true}
              fallbackToTrending={false}
            />
          </TabPanel>
        )}
        
        <TabPanel value={tabValue} index={isAuthenticated ? 2 : 1}>
          <RecommendationsList
            title="New Releases"
            type={RecommendationType.NEW_RELEASES}
            options={{
              contentType: contentType as ContentType || undefined,
              limit: 12,
              filter: filterType
            }}
            maxItems={12}
            showReason={false}
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={isAuthenticated ? 3 : 2}>
          {selectedGenres.length > 0 ? (
            <RecommendationsList
              title={`${selectedGenres[0]} Content`}
              type={RecommendationType.GENRE_BASED}
              options={{
                contentType: contentType as ContentType || undefined,
                limit: 12,
                genres: selectedGenres,
                filter: filterType
              }}
              maxItems={12}
              showReason={false}
            />
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" gutterBottom>
                Select a genre to see recommendations
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose from the genre filters above to discover content by genre
              </Typography>
            </Box>
          )}
        </TabPanel>
      </Box>
    </Container>
  );
};

export default DiscoverPage; 