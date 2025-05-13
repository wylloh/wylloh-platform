import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Typography,
  TextField,
  Button,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  InputAdornment,
  Rating,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Drawer,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  Add as AddIcon,
  MonetizationOn as MonetizationOnIcon,
  PlayArrow as PlayArrowIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Info as InfoIcon,
  FilterAlt as FilterAltIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { searchService, SearchFilters, SearchResult, SearchResponse } from '../services/search.service';
import EnhancedContentCard from '../components/common/EnhancedContentCard';

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Search state
  const [query, setQuery] = useState<string>(searchParams.get('q') || '');
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(parseInt(searchParams.get('page') || '1', 10));
  
  // Filter state
  const [filtersOpen, setFiltersOpen] = useState<boolean>(!isMobile);
  const [filters, setFilters] = useState<SearchFilters>({
    genre: searchParams.getAll('genre') || [],
    releaseYear: { 
      min: searchParams.get('yearMin') ? parseInt(searchParams.get('yearMin') || '', 10) : undefined,
      max: searchParams.get('yearMax') ? parseInt(searchParams.get('yearMax') || '', 10) : undefined
    },
    availability: (searchParams.get('availability') as 'all' | 'forSale' | 'forLending' | 'owned') || 'all',
    licenseType: searchParams.getAll('licenseType') as ('personal' | 'commercial' | 'perpetual' | 'limited')[],
    priceRange: {
      min: searchParams.get('priceMin') ? parseFloat(searchParams.get('priceMin') || '') : undefined,
      max: searchParams.get('priceMax') ? parseFloat(searchParams.get('priceMax') || '') : undefined
    },
    orderBy: (searchParams.get('orderBy') as 'relevance' | 'price' | 'date' | 'popularity') || 'relevance',
    blockchain: searchParams.get('blockchain') || undefined,
    tokenStandard: searchParams.get('tokenStandard') || undefined
  });
  
  // Year and price filter UI state
  const [yearRange, setYearRange] = useState<number[]>([
    filters.releaseYear?.min || 2015,
    filters.releaseYear?.max || 2023
  ]);
  const [priceRange, setPriceRange] = useState<number[]>([
    filters.priceRange?.min || 0,
    filters.priceRange?.max || 100
  ]);
  
  // Available filter options from search results
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [availableBlockchains, setAvailableBlockchains] = useState<string[]>([]);
  const [availableTokenStandards, setAvailableTokenStandards] = useState<string[]>([]);
  const [yearBounds, setYearBounds] = useState<{ min: number; max: number }>({ min: 2015, max: 2023 });
  const [priceBounds, setPriceBounds] = useState<{ min: number; max: number }>({ min: 0, max: 100 });
  
  // Effect to load initial search results
  useEffect(() => {
    const performSearch = async () => {
      if (query || Object.values(filters).some(val => val !== undefined && val !== null)) {
        try {
          setLoading(true);
          setError(null);
          
          const results = await searchService.searchContent(query, filters, page);
          setSearchResults(results);
          
          // Update available filter options
          setAvailableGenres(results.filters.availableGenres);
          setAvailableBlockchains(results.filters.blockchains);
          setAvailableTokenStandards(results.filters.tokenStandards);
          setYearBounds(results.filters.yearRange);
          setPriceBounds(results.filters.priceRange);
          
          // Initialize sliders with new bounds if not already set
          if (!filters.releaseYear?.min && !filters.releaseYear?.max) {
            setYearRange([results.filters.yearRange.min, results.filters.yearRange.max]);
          }
          if (!filters.priceRange?.min && !filters.priceRange?.max) {
            setPriceRange([results.filters.priceRange.min, results.filters.priceRange.max]);
          }
        } catch (err) {
          console.error('Error performing search:', err);
          setError(err instanceof Error ? err.message : 'An error occurred during search');
        } finally {
          setLoading(false);
        }
      }
    };
    
    performSearch();
  }, [query, filters, page]);
  
  // Update URL params when search parameters change
  useEffect(() => {
    const newParams = new URLSearchParams();
    
    // Add basic search parameters
    if (query) newParams.set('q', query);
    if (page > 1) newParams.set('page', page.toString());
    
    // Add filter parameters
    if (filters.genre && filters.genre.length > 0) {
      filters.genre.forEach(genre => newParams.append('genre', genre));
    }
    
    if (filters.releaseYear?.min) newParams.set('yearMin', filters.releaseYear.min.toString());
    if (filters.releaseYear?.max) newParams.set('yearMax', filters.releaseYear.max.toString());
    
    if (filters.availability && filters.availability !== 'all') {
      newParams.set('availability', filters.availability);
    }
    
    if (filters.licenseType && filters.licenseType.length > 0) {
      filters.licenseType.forEach(type => newParams.append('licenseType', type));
    }
    
    if (filters.priceRange?.min !== undefined) {
      newParams.set('priceMin', filters.priceRange.min.toString());
    }
    if (filters.priceRange?.max !== undefined) {
      newParams.set('priceMax', filters.priceRange.max.toString());
    }
    
    if (filters.orderBy && filters.orderBy !== 'relevance') {
      newParams.set('orderBy', filters.orderBy);
    }
    
    if (filters.blockchain) newParams.set('blockchain', filters.blockchain);
    if (filters.tokenStandard) newParams.set('tokenStandard', filters.tokenStandard);
    
    setSearchParams(newParams);
  }, [query, filters, page, setSearchParams]);
  
  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (page !== 1) setPage(1); // Reset to page 1 on new search
    else {
      // Force a search refresh
      const refreshFilters = { ...filters };
      setFilters(refreshFilters);
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (updatedFilters: Partial<SearchFilters>) => {
    setFilters({ ...filters, ...updatedFilters });
    if (page !== 1) setPage(1); // Reset to page 1 when filters change
  };
  
  // Apply year range to filters
  const handleYearRangeApply = () => {
    handleFilterChange({
      releaseYear: {
        min: yearRange[0],
        max: yearRange[1]
      }
    });
  };
  
  // Apply price range to filters
  const handlePriceRangeApply = () => {
    handleFilterChange({
      priceRange: {
        min: priceRange[0],
        max: priceRange[1]
      }
    });
  };
  
  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      orderBy: 'relevance'
    });
    setYearRange([yearBounds.min, yearBounds.max]);
    setPriceRange([priceBounds.min, priceBounds.max]);
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return `${value.toFixed(3)} ETH`;
  };
  
  // Filter drawer for mobile view
  const filterDrawer = (
    <Box sx={{ width: isMobile ? 'auto' : 300, p: 2 }}>
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        mb={2}
      >
        <Typography variant="h6" component="h2">
          Filters
        </Typography>
        {isMobile && (
          <IconButton onClick={() => setFiltersOpen(false)}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>
      
      <Button 
        startIcon={<ClearIcon />} 
        onClick={handleClearFilters}
        variant="outlined"
        color="secondary"
        size="small"
        sx={{ mb: 2 }}
        fullWidth
      >
        Clear All Filters
      </Button>
      
      <Divider sx={{ mb: 2 }} />
      
      {/* Sort Order */}
      <FormControl fullWidth margin="normal">
        <InputLabel>Sort By</InputLabel>
        <Select
          value={filters.orderBy || 'relevance'}
          label="Sort By"
          onChange={(e) => handleFilterChange({ orderBy: e.target.value as any })}
        >
          <MenuItem value="relevance">Relevance</MenuItem>
          <MenuItem value="price">Price (Low to High)</MenuItem>
          <MenuItem value="date">Release Date (Newest)</MenuItem>
          <MenuItem value="popularity">Popularity</MenuItem>
        </Select>
      </FormControl>
      
      {/* Availability */}
      <FormControl fullWidth margin="normal">
        <InputLabel>Availability</InputLabel>
        <Select
          value={filters.availability || 'all'}
          label="Availability"
          onChange={(e) => handleFilterChange({ availability: e.target.value as any })}
        >
          <MenuItem value="all">All Content</MenuItem>
          <MenuItem value="forSale">For Sale</MenuItem>
          <MenuItem value="forLending">Available for Lending</MenuItem>
          <MenuItem value="owned">Owned by You</MenuItem>
        </Select>
      </FormControl>
      
      {/* Genres */}
      <FormControl fullWidth margin="normal">
        <InputLabel>Genres</InputLabel>
        <Select
          multiple
          value={filters.genre || []}
          onChange={(e) => handleFilterChange({ genre: e.target.value as string[] })}
          input={<OutlinedInput label="Genres" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {(selected as string[]).map((value) => (
                <Chip key={value} label={value} size="small" />
              ))}
            </Box>
          )}
        >
          {availableGenres.map((genre) => (
            <MenuItem key={genre} value={genre}>
              {genre}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      {/* Release Year Range */}
      <Box sx={{ mt: 3, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Release Year
        </Typography>
        <Slider
          value={yearRange}
          onChange={(_, newValue) => setYearRange(newValue as number[])}
          valueLabelDisplay="auto"
          min={yearBounds.min}
          max={yearBounds.max}
          step={1}
        />
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
          <Typography variant="body2">
            {yearRange[0]} - {yearRange[1]}
          </Typography>
          <Button 
            size="small" 
            variant="outlined" 
            onClick={handleYearRangeApply}
          >
            Apply
          </Button>
        </Box>
      </Box>
      
      {/* Price Range */}
      <Box sx={{ mt: 3, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Price Range
        </Typography>
        <Slider
          value={priceRange}
          onChange={(_, newValue) => setPriceRange(newValue as number[])}
          valueLabelDisplay="auto"
          min={priceBounds.min}
          max={priceBounds.max}
          step={1}
        />
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
          <Typography variant="body2">
            {formatCurrency(priceRange[0])} - {formatCurrency(priceRange[1])}
          </Typography>
          <Button 
            size="small" 
            variant="outlined" 
            onClick={handlePriceRangeApply}
          >
            Apply
          </Button>
        </Box>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Blockchain Filters */}
      <Typography variant="subtitle2" gutterBottom>
        Blockchain Filters
      </Typography>
      
      <FormControl fullWidth margin="normal">
        <InputLabel>Blockchain</InputLabel>
        <Select
          value={filters.blockchain || ''}
          label="Blockchain"
          onChange={(e) => handleFilterChange({ blockchain: e.target.value || undefined })}
          displayEmpty
        >
          <MenuItem value="">Any Blockchain</MenuItem>
          {availableBlockchains.map((chain) => (
            <MenuItem key={chain} value={chain}>
              {chain}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <FormControl fullWidth margin="normal">
        <InputLabel>Token Standard</InputLabel>
        <Select
          value={filters.tokenStandard || ''}
          label="Token Standard"
          onChange={(e) => handleFilterChange({ tokenStandard: e.target.value || undefined })}
          displayEmpty
          disabled={!filters.blockchain}
        >
          <MenuItem value="">Any Standard</MenuItem>
          {availableTokenStandards
            .filter(std => !filters.blockchain || std.includes(filters.blockchain.substring(0, 3)))
            .map((standard) => (
              <MenuItem key={standard} value={standard}>
                {standard}
              </MenuItem>
            ))}
        </Select>
      </FormControl>
      
      {/* License Type */}
      <FormControl fullWidth margin="normal">
        <InputLabel>License Type</InputLabel>
        <Select
          multiple
          value={filters.licenseType || []}
          onChange={(e) => handleFilterChange({ licenseType: e.target.value as any })}
          input={<OutlinedInput label="License Type" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {(selected as string[]).map((value) => (
                <Chip key={value} label={value} size="small" />
              ))}
            </Box>
          )}
        >
          <MenuItem value="perpetual">Perpetual</MenuItem>
          <MenuItem value="limited">Limited</MenuItem>
          <MenuItem value="personal">Personal</MenuItem>
          <MenuItem value="commercial">Commercial</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
  
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Content Discovery
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Search and filter through our decentralized content marketplace.
        </Typography>
      </Box>
      
      {/* Search Bar */}
      <Box component="form" onSubmit={handleSearch} mb={4}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={9} md={10}>
            <TextField
              fullWidth
              placeholder="Search for movies, shows, creators..."
              variant="outlined"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={3} md={2}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ height: '100%' }}
            >
              Search
            </Button>
          </Grid>
        </Grid>
      </Box>
      
      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Filters - Desktop */}
        {!isMobile && (
          <Grid item xs={12} md={3}>
            {filtersOpen && (
              <Card>
                {filterDrawer}
              </Card>
            )}
          </Grid>
        )}
        
        {/* Search Results */}
        <Grid item xs={12} md={filtersOpen && !isMobile ? 9 : 12}>
          {/* Toggle Filters Button */}
          <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems="center" 
            mb={3}
          >
            <Box display="flex" alignItems="center">
              <Button
                startIcon={<FilterListIcon />}
                onClick={() => {
                  isMobile ? setFiltersOpen(true) : setFiltersOpen(!filtersOpen);
                }}
                variant="outlined"
                sx={{ mr: 2 }}
              >
                {isMobile ? 'Filters' : (filtersOpen ? 'Hide Filters' : 'Show Filters')}
              </Button>
              
              {/* Active Filter Chips */}
              <Box display="flex" flexWrap="wrap" gap={1}>
                {filters.genre && filters.genre.length > 0 && (
                  <Chip 
                    label={`Genres: ${filters.genre.length}`}
                    onDelete={() => handleFilterChange({ genre: [] })}
                    size="small"
                  />
                )}
                
                {(filters.releaseYear?.min !== undefined || filters.releaseYear?.max !== undefined) && (
                  <Chip 
                    label={`Year: ${filters.releaseYear?.min || 'Any'} - ${filters.releaseYear?.max || 'Any'}`}
                    onDelete={() => handleFilterChange({ releaseYear: undefined })}
                    size="small"
                  />
                )}
                
                {(filters.priceRange?.min !== undefined || filters.priceRange?.max !== undefined) && (
                  <Chip 
                    label={`Price: ${formatCurrency(filters.priceRange?.min || 0)} - ${formatCurrency(filters.priceRange?.max || 100)}`}
                    onDelete={() => handleFilterChange({ priceRange: undefined })}
                    size="small"
                  />
                )}
                
                {filters.blockchain && (
                  <Chip 
                    label={`Chain: ${filters.blockchain}`}
                    onDelete={() => handleFilterChange({ blockchain: undefined })}
                    size="small"
                  />
                )}
              </Box>
            </Box>
            
            {searchResults && (
              <Typography variant="body2" color="text.secondary">
                {searchResults.totalResults} results
              </Typography>
            )}
          </Box>
          
          {/* Error Message */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {/* Loading Indicator */}
          {loading && (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          )}
          
          {/* Empty Results */}
          {!loading && searchResults && searchResults.results.length === 0 && (
            <Box 
              display="flex" 
              flexDirection="column" 
              alignItems="center" 
              justifyContent="center"
              p={6}
              textAlign="center"
              bgcolor="background.paper"
              borderRadius={2}
            >
              <Typography variant="h6" gutterBottom>
                No results found
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Try different search terms or adjust your filters
              </Typography>
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                startIcon={<ClearIcon />}
              >
                Clear Filters
              </Button>
            </Box>
          )}
          
          {/* Results Grid */}
          {!loading && searchResults && searchResults.results.length > 0 && (
            <Grid container spacing={3}>
              {searchResults.results.map((result) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={result.contentId}>
                  <EnhancedContentCard
                    content={{
                      id: result.contentId,
                      title: result.title,
                      description: result.description,
                      contentType: result.genre[0] || 'Unknown',
                      creator: result.creator,
                      creatorAddress: '',
                      mainFileCid: '',
                      image: result.thumbnailUrl,
                      tokenized: !!result.token,
                      tokenId: result.token?.tokenId,
                      price: result.price,
                      available: 1,
                      totalSupply: 10,
                      metadata: {
                        genres: result.genre,
                        releaseYear: result.releaseYear,
                        duration: '120 min'
                      },
                      createdAt: new Date().toISOString(),
                      status: 'active',
                      visibility: 'public',
                      views: result.totalReviews * 10,
                      sales: Math.floor(result.totalReviews / 2)
                    }}
                    context="search"
                    onFavorite={(id) => {
                      console.log('Favorite toggled for', id);
                      // Add your favorite toggle logic here
                    }}
                    onPlay={result.availability === 'owned' ? (id) => {
                      console.log('Play clicked for', id);
                      // Add your play logic here
                    } : undefined}
                    onBuy={result.availability === 'forSale' ? (id) => {
                      console.log('Buy clicked for', id);
                      // Add your buy logic here
                    } : undefined}
                    onRent={result.availability === 'forLending' ? (id) => {
                      console.log('Rent clicked for', id);
                      // Add your rent logic here
                    } : undefined}
                  />
                </Grid>
              ))}
            </Grid>
          )}
          
          {/* Pagination */}
          {!loading && searchResults && searchResults.totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={searchResults.totalPages}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
              />
            </Box>
          )}
        </Grid>
      </Grid>
      
      {/* Mobile Filter Drawer */}
      {isMobile && (
        <Drawer
          anchor="right"
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
        >
          {filterDrawer}
        </Drawer>
      )}
    </Container>
  );
};

export default SearchPage; 