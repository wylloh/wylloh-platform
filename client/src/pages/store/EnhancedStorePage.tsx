import React, { useState, useEffect, useMemo } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Button, 
  CardActions,
  TextField,
  InputAdornment,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  SelectChangeEvent,
  IconButton,
  Tooltip,
  Skeleton
} from '@mui/material';
import { 
  Search as SearchIcon, 
  FilterList as FilterIcon,
  PlayArrow,
  Info,
  FavoriteBorder,
  Favorite
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useWallet } from '../../contexts/WalletContext';
import { generatePlaceholderImage } from '../../utils/placeholders';
import { contentService, Content } from '../../services/content.service';
import { getProjectIpfsUrl } from '../../utils/ipfs';
import ContentStatusBadge from '../../components/common/ContentStatusBadge';

// Content type options
const contentTypes = [
  { value: 'all', label: 'All Types' },
  { value: 'movie', label: 'Movies' },
  { value: 'documentary', label: 'Documentaries' },
  { value: 'series', label: 'Series' },
  { value: 'short film', label: 'Short Films' },
  { value: 'music film', label: 'Music Films' }
];

// Sort options
const sortOptions = [
  { value: 'newest', label: 'Newest Releases' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'availability', label: 'Availability' },
  { value: 'popularity', label: 'Popularity' }
];

/**
 * Enhanced Store Page that uses shared components for platform parity
 */
const EnhancedStorePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [contentType, setContentType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [page, setPage] = useState<number>(1);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { active } = useWallet();
  
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const data = await contentService.getStoreContent();
        setContent(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching content:', err);
        setError('Failed to load content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  // Filter and sort content
  const filteredContent = useMemo(() => {
    let result = [...content];
    
    // Apply content type filter
    if (contentType !== 'all') {
      result = result.filter(item => item.contentType === contentType);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        item => 
          item.title.toLowerCase().includes(query) || 
          item.description.toLowerCase().includes(query) ||
          item.creator.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'price_low':
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price_high':
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'availability':
        result.sort((a, b) => (b.available || 0) - (a.available || 0));
        break;
      default:
        break;
    }
    
    return result;
  }, [content, searchQuery, contentType, sortBy]);

  // Calculate paginated content
  const paginatedContent = filteredContent.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  const totalPages = Math.ceil(filteredContent.length / itemsPerPage);

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" gutterBottom>Store</Typography>
          <Grid container spacing={4}>
            {[...Array(4)].map((_, index) => (
              <Grid item key={index} xs={12} sm={6} md={3}>
                <Card>
                  <Skeleton variant="rectangular" height={140} />
                  <CardContent>
                    <Skeleton variant="text" />
                    <Skeleton variant="text" />
                    <Skeleton variant="text" width="60%" />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            {error}
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  const handleContentTypeChange = (event: SelectChangeEvent<string>) => {
    setContentType(event.target.value);
    setPage(1); // Reset to first page on filter change
  };

  const handleSortChange = (event: SelectChangeEvent<string>) => {
    setSortBy(event.target.value);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFavorite = (id: string) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(fav => fav !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  const renderContent = () => {
    if (paginatedContent.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No content found matching your criteria
          </Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={4}>
        {paginatedContent.map((item) => (
          <Grid item key={item.id} xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                position: 'relative' 
              }}
            >
              {/* Favorite button */}
              <IconButton 
                sx={{ 
                  position: 'absolute', 
                  top: 8, 
                  right: 8,
                  bgcolor: 'rgba(255, 255, 255, 0.7)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' }
                }}
                onClick={() => toggleFavorite(item.id)}
              >
                {favorites.includes(item.id) ? 
                  <Favorite color="error" /> : 
                  <FavoriteBorder />}
              </IconButton>
              
              {/* Content image */}
              <CardMedia
                component="img"
                height="140"
                image={
                  item.thumbnailCid 
                    ? getProjectIpfsUrl(item.thumbnailCid) 
                    : item.image || generatePlaceholderImage(item.title)
                }
                alt={item.title}
              />
              
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography gutterBottom variant="h6" component="h2" noWrap sx={{ flex: 1, mr: 1 }}>
                    {item.title}
                  </Typography>
                  
                  {/* Add status badge - only show tokenization status in store context */}
                  <Box sx={{ flexShrink: 0 }}>
                    <ContentStatusBadge
                      status="active"
                      tokenized={item.tokenized}
                      showLabel={false}
                      size="small"
                      context="store"
                    />
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ 
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  mb: 1
                }}>
                  {item.description}
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    by {item.creator}
                  </Typography>
                  
                  <Chip 
                    label={item.contentType} 
                    size="small" 
                    sx={{ fontSize: '0.7rem' }}
                  />
                </Box>
              </CardContent>
              
              <CardActions sx={{ mt: 'auto', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                    {item.price} ETH
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.available}/{item.totalSupply} available
                  </Typography>
                </Box>
                
                <Button 
                  component={Link} 
                  to={`/content/${item.id}`}
                  variant="contained" 
                  size="small"
                  startIcon={<Info />}
                >
                  Details
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Store
      </Typography>
      
      {/* Filters Section */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search Content"
              variant="outlined"
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
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Content Type</InputLabel>
              <Select
                value={contentType}
                onChange={handleContentTypeChange}
                label="Content Type"
                startAdornment={
                  <InputAdornment position="start">
                    <FilterIcon />
                  </InputAdornment>
                }
              >
                {contentTypes.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={handleSortChange}
                label="Sort By"
              >
                {sortOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography variant="body2" color="textSecondary">
              Showing {filteredContent.length} results
            </Typography>
          </Grid>
        </Grid>
      </Box>
      
      {/* Content Grid */}
      {renderContent()}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={handlePageChange} 
            color="primary" 
            showFirstButton 
            showLastButton
          />
        </Box>
      )}
    </Container>
  );
};

export default EnhancedStorePage; 