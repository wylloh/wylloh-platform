import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  InputAdornment,
  TextField,
  IconButton,
  Tooltip,
  Chip,
  Stack,
  Paper,
  Button,
  Menu,
  Checkbox,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
  ViewComfy as CompactViewIcon,
  Sort as SortIcon,
  Apps as AppsIcon,
} from '@mui/icons-material';
import { Content } from '../../services/content.service';
import EnhancedContentCard from './EnhancedContentCard';

interface ContentGridProps {
  items: Content[];
  loading?: boolean;
  onDelete?: (contentId: string) => void;
  onTokenize?: (contentId: string) => void;
  onSetVisibility?: (contentId: string, visibility: 'public' | 'private' | 'unlisted') => void;
  onSetStatus?: (contentId: string, status: 'draft' | 'pending' | 'active') => void;
  onShare?: (contentId: string) => void;
  onDuplicate?: (contentId: string) => void;
  onView?: (contentId: string) => void;
  pageSize?: number;
  emptyMessage?: string;
  title?: string;
}

/**
 * A grid of content items with filtering, searching, and pagination
 */
const ContentGrid: React.FC<ContentGridProps> = ({
  items,
  loading = false,
  onDelete,
  onTokenize,
  onSetVisibility,
  onSetStatus,
  onShare,
  onDuplicate,
  onView,
  pageSize = 12,
  emptyMessage = 'No content found',
  title,
}) => {
  // State for view mode (grid, list, compact)
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  
  // State for search and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [tokenizedFilter, setTokenizedFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState('newest');
  
  // State for pagination
  const [page, setPage] = useState(1);
  
  // State for filter menu
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  
  // Get all available content types
  const contentTypes = Array.from(new Set(items.map(item => item.contentType)))
    .filter(Boolean) as string[];
  
  // Filter and sort items
  const filteredItems = items
    .filter(item => {
      // Search term filter
      if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !item.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Status filter
      if (statusFilter.length > 0 && !statusFilter.includes(item.status)) {
        return false;
      }
      
      // Type filter
      if (typeFilter.length > 0 && !typeFilter.includes(item.contentType)) {
        return false;
      }
      
      // Tokenized filter
      if (tokenizedFilter === 'tokenized' && !item.tokenized) {
        return false;
      }
      if (tokenizedFilter === 'non-tokenized' && item.tokenized) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort by selected option
      switch (sortBy) {
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'views-desc':
          return (b.views || 0) - (a.views || 0);
        case 'sales-desc':
          return (b.sales || 0) - (a.sales || 0);
        default:
          return 0;
      }
    });
  
  // Paginate items
  const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredItems.length / pageSize);
  
  // Handle search change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1); // Reset to first page when search changes
  };
  
  // Handle clear search
  const handleClearSearch = () => {
    setSearchTerm('');
  };
  
  // Handle filter menu
  const handleFilterMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };
  
  const handleFilterMenuClose = () => {
    setFilterAnchorEl(null);
  };
  
  // Handle sort menu
  const handleSortMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setSortAnchorEl(event.currentTarget);
  };
  
  const handleSortMenuClose = () => {
    setSortAnchorEl(null);
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setStatusFilter(typeof value === 'string' ? value.split(',') : value);
    setPage(1); // Reset to first page when filter changes
  };
  
  // Handle type filter change
  const handleTypeFilterChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setTypeFilter(typeof value === 'string' ? value.split(',') : value);
    setPage(1); // Reset to first page when filter changes
  };
  
  // Handle tokenized filter change
  const handleTokenizedFilterChange = (event: SelectChangeEvent<string>) => {
    setTokenizedFilter(event.target.value as string);
    setPage(1); // Reset to first page when filter changes
  };
  
  // Handle sort change
  const handleSortChange = (value: string) => {
    setSortBy(value);
    handleSortMenuClose();
  };
  
  // Handle page change
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };
  
  // Handle view mode change
  const handleViewModeChange = (mode: 'grid' | 'list' | 'compact') => {
    setViewMode(mode);
  };
  
  // Render active filters as chips
  const renderActiveFilters = () => {
    const activeFilters = [];
    
    if (statusFilter.length > 0) {
      activeFilters.push(
        <Chip
          key="status"
          label={`Status: ${statusFilter.join(', ')}`}
          onDelete={() => setStatusFilter([])}
          size="small"
          color="primary"
          variant="outlined"
        />
      );
    }
    
    if (typeFilter.length > 0) {
      activeFilters.push(
        <Chip
          key="type"
          label={`Type: ${typeFilter.join(', ')}`}
          onDelete={() => setTypeFilter([])}
          size="small"
          color="primary"
          variant="outlined"
        />
      );
    }
    
    if (tokenizedFilter !== 'all') {
      activeFilters.push(
        <Chip
          key="tokenized"
          label={`${tokenizedFilter === 'tokenized' ? 'Tokenized' : 'Non-tokenized'}`}
          onDelete={() => setTokenizedFilter('all')}
          size="small"
          color="primary"
          variant="outlined"
        />
      );
    }
    
    if (sortBy !== 'newest') {
      const sortLabels: Record<string, string> = {
        'title-asc': 'Title (A-Z)',
        'title-desc': 'Title (Z-A)',
        'newest': 'Newest',
        'oldest': 'Oldest',
        'views-desc': 'Most viewed',
        'sales-desc': 'Most sold',
      };
      
      activeFilters.push(
        <Chip
          key="sort"
          label={`Sort: ${sortLabels[sortBy]}`}
          onDelete={() => setSortBy('newest')}
          size="small"
          color="primary"
          variant="outlined"
        />
      );
    }
    
    if (activeFilters.length === 0) {
      return null;
    }
    
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2, mb: 2 }}>
        {activeFilters}
      </Box>
    );
  };
  
  // Determine card variant based on view mode
  const getCardVariant = () => {
    switch (viewMode) {
      case 'list':
        return 'detailed';
      case 'compact':
        return 'compact';
      default:
        return 'standard';
    }
  };

  return (
    <Box>
      {title && (
        <Typography variant="h5" component="h2" gutterBottom>
          {title}
        </Typography>
      )}
      
      {/* Search and filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {/* Search field */}
          <TextField
            placeholder="Search content..."
            value={searchTerm}
            onChange={handleSearchChange}
            variant="outlined"
            size="small"
            sx={{ flexGrow: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={handleClearSearch}
                    edge="end"
                    aria-label="clear search"
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          {/* View mode toggle */}
          <Box>
            <Tooltip title="Grid view">
              <IconButton
                onClick={() => handleViewModeChange('grid')}
                color={viewMode === 'grid' ? 'primary' : 'default'}
              >
                <GridViewIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="List view">
              <IconButton
                onClick={() => handleViewModeChange('list')}
                color={viewMode === 'list' ? 'primary' : 'default'}
              >
                <ListViewIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Compact view">
              <IconButton
                onClick={() => handleViewModeChange('compact')}
                color={viewMode === 'compact' ? 'primary' : 'default'}
              >
                <CompactViewIcon />
              </IconButton>
            </Tooltip>
          </Box>
          
          {/* Sort button */}
          <Tooltip title="Sort options">
            <Button
              variant="outlined"
              startIcon={<SortIcon />}
              onClick={handleSortMenuOpen}
              size="small"
            >
              Sort
            </Button>
          </Tooltip>
          
          {/* Filter button */}
          <Tooltip title="Filter options">
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={handleFilterMenuOpen}
              size="small"
            >
              Filter
            </Button>
          </Tooltip>
        </Box>
        
        {/* Active filters */}
        {renderActiveFilters()}
      </Paper>
      
      {/* Sort menu */}
      <Menu
        anchorEl={sortAnchorEl}
        open={Boolean(sortAnchorEl)}
        onClose={handleSortMenuClose}
      >
        <MenuItem onClick={() => handleSortChange('newest')} selected={sortBy === 'newest'}>
          Newest
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('oldest')} selected={sortBy === 'oldest'}>
          Oldest
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('title-asc')} selected={sortBy === 'title-asc'}>
          Title (A-Z)
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('title-desc')} selected={sortBy === 'title-desc'}>
          Title (Z-A)
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('views-desc')} selected={sortBy === 'views-desc'}>
          Most viewed
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('sales-desc')} selected={sortBy === 'sales-desc'}>
          Most sold
        </MenuItem>
      </Menu>
      
      {/* Filter menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterMenuClose}
        PaperProps={{
          style: {
            maxHeight: 400,
            width: 300,
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Status
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <Select
              multiple
              value={statusFilter}
              onChange={handleStatusFilterChange}
              renderValue={(selected) => selected.join(', ')}
              displayEmpty
            >
              <MenuItem value="draft">
                <Checkbox checked={statusFilter.includes('draft')} />
                <ListItemText primary="Draft" />
              </MenuItem>
              <MenuItem value="pending">
                <Checkbox checked={statusFilter.includes('pending')} />
                <ListItemText primary="Pending" />
              </MenuItem>
              <MenuItem value="active">
                <Checkbox checked={statusFilter.includes('active')} />
                <ListItemText primary="Active" />
              </MenuItem>
            </Select>
          </FormControl>
          
          <Typography variant="subtitle2" gutterBottom>
            Content Type
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <Select
              multiple
              value={typeFilter}
              onChange={handleTypeFilterChange}
              renderValue={(selected) => selected.join(', ')}
              displayEmpty
            >
              {contentTypes.map(type => (
                <MenuItem key={type} value={type}>
                  <Checkbox checked={typeFilter.includes(type)} />
                  <ListItemText primary={type} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Typography variant="subtitle2" gutterBottom>
            Tokenization
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <Select
              value={tokenizedFilter}
              onChange={handleTokenizedFilterChange}
              displayEmpty
            >
              <MenuItem value="all">All content</MenuItem>
              <MenuItem value="tokenized">Tokenized only</MenuItem>
              <MenuItem value="non-tokenized">Non-tokenized only</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            fullWidth
            onClick={() => {
              setStatusFilter([]);
              setTypeFilter([]);
              setTokenizedFilter('all');
              setSortBy('newest');
              handleFilterMenuClose();
            }}
          >
            Reset All Filters
          </Button>
        </Box>
      </Menu>
      
      {/* Content grid */}
      {paginatedItems.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            {loading ? 'Loading content...' : emptyMessage}
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {viewMode === 'list' || viewMode === 'compact' ? (
              // For list or compact view, use full width
              paginatedItems.map(item => (
                <Grid item key={item.id} xs={12}>
                  <EnhancedContentCard
                    content={item}
                    loading={loading}
                    onDelete={onDelete}
                    onTokenize={onTokenize}
                    onSetVisibility={onSetVisibility}
                    onSetStatus={onSetStatus}
                    onShare={onShare}
                    onDuplicate={onDuplicate}
                    onView={onView}
                    variant={getCardVariant()}
                  />
                </Grid>
              ))
            ) : (
              // For grid view, use responsive columns
              paginatedItems.map(item => (
                <Grid item key={item.id} xs={12} sm={6} md={4} lg={3}>
                  <EnhancedContentCard
                    content={item}
                    loading={loading}
                    onDelete={onDelete}
                    onTokenize={onTokenize}
                    onSetVisibility={onSetVisibility}
                    onSetStatus={onSetStatus}
                    onShare={onShare}
                    onDuplicate={onDuplicate}
                    onView={onView}
                    variant={getCardVariant()}
                  />
                </Grid>
              ))
            )}
          </Grid>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
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
        </>
      )}
    </Box>
  );
};

export default ContentGrid; 