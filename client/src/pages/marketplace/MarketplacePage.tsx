import React, { useState, useEffect } from 'react';
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
  Tooltip
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

// Mock content data
const mockContent = [
  {
    id: 'big-buck-bunny',
    title: 'Big Buck Bunny',
    description: 'A short film featuring a large rabbit dealing with three bullying rodents.',
    image: 'https://peach.blender.org/wp-content/uploads/bbb-splash.png',
    contentType: 'short film',
    creator: 'Pro Creator',
    price: 0.01,
    available: 995,
    totalSupply: 1000,
    releaseDate: new Date().toLocaleDateString('en-US')
  },
  {
    id: '1',
    title: 'The Digital Frontier',
    description: 'A journey into the world of blockchain and digital ownership.',
    image: generatePlaceholderImage('The Digital Frontier'),
    contentType: 'movie',
    creator: 'Digital Studios',
    price: 0.01,
    available: 250,
    totalSupply: 1000,
    releaseDate: '2023-10-15'
  },
  {
    id: '2',
    title: 'Nature Unveiled',
    description: 'A breathtaking documentary exploring the wonders of nature.',
    image: generatePlaceholderImage('Nature Unveiled'),
    contentType: 'documentary',
    creator: 'EcoVision Films',
    price: 0.008,
    available: 450,
    totalSupply: 1000,
    releaseDate: '2023-09-22'
  },
  {
    id: '3',
    title: 'Future Horizons',
    description: 'A science fiction tale about the future of humanity.',
    image: generatePlaceholderImage('Future Horizons'),
    contentType: 'movie',
    creator: 'Quantum Entertainment',
    price: 0.015,
    available: 120,
    totalSupply: 500,
    releaseDate: '2023-11-05'
  },
  {
    id: '4',
    title: 'Urban Landscapes',
    description: 'A visual journey through the world\'s most iconic cities.',
    image: generatePlaceholderImage('Urban Landscapes'),
    contentType: 'short film',
    creator: 'Metropolitan Arts',
    price: 0.005,
    available: 800,
    totalSupply: 1000,
    releaseDate: '2023-08-30'
  },
  {
    id: '5',
    title: 'Emotional Symphony',
    description: 'A musical exploration of human emotions.',
    image: generatePlaceholderImage('Emotional Symphony'),
    contentType: 'music film',
    creator: 'Harmony Productions',
    price: 0.007,
    available: 600,
    totalSupply: 2000,
    releaseDate: '2023-10-10'
  },
  {
    id: '6',
    title: 'Culinary Adventures',
    description: 'A journey through global cuisines and food cultures.',
    image: generatePlaceholderImage('Culinary Adventures'),
    contentType: 'series',
    creator: 'Gourmet Studios',
    price: 0.01,
    available: 350,
    totalSupply: 1000,
    releaseDate: '2023-09-15'
  },
  {
    id: '7',
    title: 'Sports Legends',
    description: 'Stories of triumph and perseverance in sports.',
    image: generatePlaceholderImage('Sports Legends'),
    contentType: 'documentary',
    creator: 'Champion Media',
    price: 0.009,
    available: 420,
    totalSupply: 1000,
    releaseDate: '2023-10-01'
  },
  {
    id: '8',
    title: 'Ocean Depths',
    description: 'Exploring the mysteries of the deep sea.',
    image: generatePlaceholderImage('Ocean Depths'),
    contentType: 'documentary',
    creator: 'Deep Blue Productions',
    price: 0.012,
    available: 280,
    totalSupply: 750,
    releaseDate: '2023-11-15'
  }
];

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
  const [filteredContent, setFilteredContent] = useState(mockContent);
  const { active } = useWallet();
  
  const itemsPerPage = 8;

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

  useEffect(() => {
    // Filter and sort content based on user selections
    let result = [...mockContent];
    
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
        result.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
        break;
      case 'price_low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'availability':
        result.sort((a, b) => b.available - a.available);
        break;
      // Popularity would typically be based on some metric from the backend
      default:
        break;
    }
    
    setFilteredContent(result);
  }, [searchQuery, contentType, sortBy]);

  // Calculate paginated content
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedContent = filteredContent.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredContent.length / itemsPerPage);

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