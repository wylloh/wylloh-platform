import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  TextField,
  InputAdornment,
  MenuItem,
  IconButton,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Tabs,
  Tab,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import { Content } from '../../types/Content';
import { contentService } from '../../services/content.service';
import EnhancedContentCard from '../../components/common/EnhancedContentCard';

// Define the interface for the filter state
interface Filters {
  search: string;
  contentType: string;
  genre: string[];
  priceRange: [number, number];
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

// Store content categories
const CONTENT_TYPES = ['All', 'Movie', 'Short Film', 'Documentary', 'Series', 'Music Video'];

// Store content genres
const GENRES = [
  'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime', 
  'Documentary', 'Drama', 'Fantasy', 'Historical', 'Horror', 'Musical',
  'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'War', 'Western'
];

const StorePage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Content state
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  
  // Filter state
  const [filters, setFilters] = useState<Filters>({
    search: '',
    contentType: 'All',
    genre: [],
    priceRange: [0, 1000],
    sortBy: 'createdAt',
    sortDirection: 'desc',
  });
  
  // Tab state
  const [selectedTab, setSelectedTab] = useState(0);
  
  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        
        // In a real implementation, this would pass filters to the API
        const data = await contentService.getStoreContent();
        
        // Apply client-side filtering (this would be server-side in production)
        let filteredContent = [...data];
        
        // Filter by search term
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredContent = filteredContent.filter(
            item => 
              item.title.toLowerCase().includes(searchLower) || 
              (item.description && item.description.toLowerCase().includes(searchLower))
          );
        }
        
        // Filter by content type
        if (filters.contentType && filters.contentType !== 'All') {
          filteredContent = filteredContent.filter(
            item => item.contentType.toLowerCase() === filters.contentType.toLowerCase()
          );
        }
        
        // Filter by genre
        if (filters.genre.length > 0) {
          filteredContent = filteredContent.filter(item => {
            if (!item.metadata?.genres) return false;
            return filters.genre.some(genre => 
              item.metadata.genres.some((g: string) => g.toLowerCase() === genre.toLowerCase())
            );
          });
        }
        
        // Filter by price range
        filteredContent = filteredContent.filter(
          item => (item.price || 0) >= filters.priceRange[0] && (item.price || 0) <= filters.priceRange[1]
        );
        
        // Sort content
        filteredContent.sort((a, b) => {
          let aValue: any, bValue: any;
          
          // Determine sort values based on sortBy
          switch (filters.sortBy) {
            case 'price':
              aValue = a.price || 0;
              bValue = b.price || 0;
              break;
            case 'title':
              aValue = a.title;
              bValue = b.title;
              break;
            case 'createdAt':
            default:
              aValue = new Date(a.createdAt).getTime();
              bValue = new Date(b.createdAt).getTime();
              break;
          }
          
          // Apply sort direction
          if (filters.sortDirection === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
        
        setContent(filteredContent);
        setError(null);
      } catch (error) {
        console.error('Error fetching content:', error);
        setError('Failed to load content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchContent();
  }, [filters]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: event.target.value }));
  };

  const handleContentTypeChange = (event: SelectChangeEvent<string>) => {
    setFilters(prev => ({ ...prev, contentType: event.target.value as string }));
  };

  const handleGenreChange = (event: SelectChangeEvent<string[]>) => {
    setFilters(prev => ({ ...prev, genre: event.target.value as string[] }));
  };

  const handleSortByChange = (event: SelectChangeEvent<string>) => {
    setFilters(prev => ({ ...prev, sortBy: event.target.value as string }));
  };

  const toggleSortDirection = () => {
    setFilters(prev => ({ 
      ...prev, 
      sortDirection: prev.sortDirection === 'asc' ? 'desc' : 'asc' 
    }));
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
    
    // Apply different filters based on tab
    switch (newValue) {
      case 0: // All
        setFilters(prev => ({ ...prev, contentType: 'All' }));
        break;
      case 1: // Movies
        setFilters(prev => ({ ...prev, contentType: 'Movie' }));
        break;
      case 2: // Series
        setFilters(prev => ({ ...prev, contentType: 'Series' }));
        break;
      case 3: // Shorts
        setFilters(prev => ({ ...prev, contentType: 'Short Film' }));
        break;
      default:
        setFilters(prev => ({ ...prev, contentType: 'All' }));
    }
  };

  const renderSkeletons = () => {
    return Array(8).fill(0).map((_, index) => (
      <Grid item xs={12} sm={6} md={4} lg={3} key={`skeleton-${index}`}>
        <Skeleton variant="rectangular" height={250} />
        <Skeleton variant="text" height={30} sx={{ mt: 1 }} />
        <Skeleton variant="text" height={20} width="60%" />
      </Grid>
    ));
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>Your next favorite film awaits.</Typography>
        <Typography variant="body1" color="text.secondary">
          Discover movies you'll actually own, from filmmakers who pour their hearts into every frame.
        </Typography>
      </Box>
      
      {/* Tabs for content type filtering */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={selectedTab} 
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : undefined}
        >
          <Tab label="All Content" />
          <Tab label="Movies" />
          <Tab label="Series" />
          <Tab label="Short Films" />
        </Tabs>
      </Box>
      
      {/* Filters section */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search"
              variant="outlined"
              value={filters.search}
              onChange={handleSearchChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Genre</InputLabel>
              <Select
                multiple
                value={filters.genre}
                onChange={handleGenreChange}
                label="Genre"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {GENRES.map(genre => (
                  <MenuItem key={genre} value={genre}>
                    {genre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={filters.sortBy}
                  onChange={handleSortByChange}
                  label="Sort By"
                >
                  <MenuItem value="createdAt">Date Added</MenuItem>
                  <MenuItem value="price">Price</MenuItem>
                  <MenuItem value="title">Title</MenuItem>
                </Select>
              </FormControl>
              
              <IconButton onClick={toggleSortDirection} sx={{ ml: 1 }}>
                {filters.sortDirection === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
              </IconButton>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <IconButton onClick={() => setShowGrid(true)} color={showGrid ? 'primary' : 'default'}>
                <ViewModuleIcon />
              </IconButton>
              <IconButton onClick={() => setShowGrid(false)} color={!showGrid ? 'primary' : 'default'}>
                <ViewListIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Results section */}
      {error ? (
        <Box sx={{ py: 5, textAlign: 'center' }}>
          <Typography color="error" variant="h6" gutterBottom>
            {error}
          </Typography>
          <Button 
            variant="contained" 
            sx={{ mt: 2 }}
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </Box>
      ) : (
        <>
          {/* Results count */}
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary">
              {loading ? 'Loading content...' : `${content.length} items found`}
            </Typography>
          </Box>
          
          {/* Content grid */}
          <Grid container spacing={3}>
            {loading ? (
              renderSkeletons()
            ) : content.length > 0 ? (
              content.map(item => (
                <Grid item xs={12} sm={showGrid ? 6 : 12} md={showGrid ? 4 : 12} lg={showGrid ? 3 : 12} key={item.id}>
                  <EnhancedContentCard
                    content={item}
                    context="store"
                    variant={showGrid ? "standard" : "detailed"}
                    onBuy={(id) => console.log('Buy clicked for:', id)}
                    showPrice={true}
                    elevation={1}
                  />
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom>
                    No content matches your search
                  </Typography>
                  <Button 
                    variant="contained" 
                    sx={{ mt: 2 }}
                    onClick={() => setFilters({
                      search: '',
                      contentType: 'All',
                      genre: [],
                      priceRange: [0, 1000],
                      sortBy: 'createdAt',
                      sortDirection: 'desc',
                    })}
                  >
                    Clear Filters
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>
        </>
      )}
    </Container>
  );
};

export default StorePage; 