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
  Divider,
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

const MarketplacePage: React.FC = () => {
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
        const data = await contentService.getMarketplaceContent();
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
          <Typography variant="h4" gutterBottom>Marketplace</Typography>
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

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Marketplace
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
      {paginatedContent.length > 0 ? (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {paginatedContent.map((content) => (
            <Grid item key={content.id} xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height="160"
                    image={content.image}
                    alt={content.title}
                  />
                  <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                    <IconButton 
                      size="small" 
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.8)', 
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } 
                      }}
                      onClick={() => toggleFavorite(content.id)}
                    >
                      {favorites.includes(content.id) ? 
                        <Favorite color="error" /> : 
                        <FavoriteBorder />}
                    </IconButton>
                  </Box>
                </Box>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h6" component="h2" noWrap>
                    {content.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, height: '3em', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {content.description}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Chip label={content.contentType.toUpperCase()} size="small" />
                    <Typography variant="caption" color="text.secondary">
                      {content.available}/{content.totalSupply}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    By {content.creator}
                  </Typography>
                </CardContent>
                <Divider />
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<Info />}
                    component={Link}
                    to={`/marketplace/${content.id}`}
                  >
                    Details
                  </Button>
                  <Button 
                    size="small" 
                    startIcon={<PlayArrow />}
                    component={Link}
                    to={`/player/${content.id}`}
                  >
                    Preview
                  </Button>
                  <Box sx={{ flexGrow: 1 }} />
                  <Typography variant="button" color="primary">
                    {content.price} MATIC
                  </Typography>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No content found matching your criteria
          </Typography>
          <Button 
            variant="outlined" 
            sx={{ mt: 2 }}
            onClick={() => {
              setSearchQuery('');
              setContentType('all');
              setSortBy('newest');
            }}
          >
            Clear Filters
          </Button>
        </Box>
      )}
      
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

export default MarketplacePage;