import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Paper,
  FormControlLabel,
  Switch,
  IconButton,
  Tooltip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  Alert,
  Menu,
  Badge
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkOutlineIcon,
  MoreVert as MoreIcon,
  Star as StarIcon,
  KeyboardArrowDown as ExpandMoreIcon
} from '@mui/icons-material';
import { Tag, TagCategory, TagFilter } from '../../types/Tag';
import tagService from '../../services/tag.service';

interface TagFilterInterfaceProps {
  /**
   * Callback when filters change
   */
  onFilterChange: (filter: TagFilter) => void;
  
  /**
   * Initial filter (optional)
   */
  initialFilter?: TagFilter;
  
  /**
   * Whether to show saved filters
   */
  showSavedFilters?: boolean;
}

/**
 * Tag Filter Interface component
 * Allows filtering content by tags and categories
 */
const TagFilterInterface: React.FC<TagFilterInterfaceProps> = ({
  onFilterChange,
  initialFilter,
  showSavedFilters = true
}) => {
  // States
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<TagCategory[]>([]);
  const [savedFilters, setSavedFilters] = useState<TagFilter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Current filter state with default values for potentially undefined properties
  const [filter, setFilter] = useState<TagFilter>({
    includeTags: initialFilter?.includeTags || [],
    excludeTags: initialFilter?.excludeTags || [],
    matchAllTags: initialFilter?.matchAllTags ?? true,
    categories: initialFilter?.categories || []
  });
  
  // UI states
  const [saveDialogOpen, setSaveDialogOpen] = useState<boolean>(false);
  const [filterName, setFilterName] = useState<string>('');
  const [expandedSettings, setExpandedSettings] = useState<boolean>(false);
  const [categoryMenuAnchor, setCategoryMenuAnchor] = useState<null | HTMLElement>(null);
  const [popularTagsExpanded, setPopularTagsExpanded] = useState<boolean>(true);
  
  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);
  
  // Update filter when initialFilter changes
  useEffect(() => {
    if (initialFilter) {
      setFilter({
        includeTags: initialFilter.includeTags || [],
        excludeTags: initialFilter.excludeTags || [],
        matchAllTags: initialFilter.matchAllTags ?? true,
        categories: initialFilter.categories || [],
        id: initialFilter.id,
        name: initialFilter.name,
        isFavorite: initialFilter.isFavorite,
        createdAt: initialFilter.createdAt,
        createdBy: initialFilter.createdBy
      });
    }
  }, [initialFilter]);
  
  /**
   * Load tags, categories, and saved filters
   */
  const loadData = async () => {
    setLoading(true);
    try {
      const [tagsData, categoriesData, filtersData] = await Promise.all([
        tagService.getPopularTags(30),
        tagService.getCategories(),
        showSavedFilters ? tagService.getSavedFilters() : Promise.resolve([])
      ]);
      
      setTags(tagsData);
      setCategories(categoriesData);
      setSavedFilters(filtersData);
      setError(null);
    } catch (err) {
      console.error('Error loading filter data:', err);
      setError('Failed to load filter data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Toggle include tag
   */
  const toggleIncludeTag = (tagName: string) => {
    setFilter(prev => {
      const newIncludeTags = prev.includeTags.includes(tagName)
        ? prev.includeTags.filter(t => t !== tagName)
        : [...prev.includeTags, tagName];
      
      // If tag was in excludeTags, remove it
      const newExcludeTags = (prev.excludeTags || []).filter(t => t !== tagName);
      
      const updatedFilter = {
        ...prev,
        includeTags: newIncludeTags,
        excludeTags: newExcludeTags
      };
      
      onFilterChange(updatedFilter);
      return updatedFilter;
    });
  };
  
  /**
   * Toggle exclude tag
   */
  const toggleExcludeTag = (tagName: string) => {
    setFilter(prev => {
      const excludeTags = prev.excludeTags || [];
      const newExcludeTags = excludeTags.includes(tagName)
        ? excludeTags.filter(t => t !== tagName)
        : [...excludeTags, tagName];
      
      // If tag was in includeTags, remove it
      const newIncludeTags = prev.includeTags.filter(t => t !== tagName);
      
      const updatedFilter = {
        ...prev,
        includeTags: newIncludeTags,
        excludeTags: newExcludeTags
      };
      
      onFilterChange(updatedFilter);
      return updatedFilter;
    });
  };
  
  /**
   * Toggle match all tags
   */
  const toggleMatchAllTags = () => {
    setFilter(prev => {
      const updatedFilter = {
        ...prev,
        matchAllTags: !prev.matchAllTags
      };
      
      onFilterChange(updatedFilter);
      return updatedFilter;
    });
  };
  
  /**
   * Toggle category filter
   */
  const toggleCategory = (categoryId: string) => {
    setFilter(prev => {
      const newCategories = prev.categories?.includes(categoryId)
        ? prev.categories.filter(c => c !== categoryId)
        : [...(prev.categories || []), categoryId];
      
      const updatedFilter = {
        ...prev,
        categories: newCategories
      };
      
      onFilterChange(updatedFilter);
      return updatedFilter;
    });
  };
  
  /**
   * Clear all filters
   */
  const clearFilters = () => {
    const emptyFilter = {
      includeTags: [],
      excludeTags: [],
      matchAllTags: true,
      categories: []
    };
    
    setFilter(emptyFilter);
    onFilterChange(emptyFilter);
  };
  
  /**
   * Save current filter
   */
  const saveFilter = async () => {
    if (!filterName.trim()) return;
    
    try {
      const filterToSave: TagFilter = {
        ...filter,
        name: filterName.trim(),
        isFavorite: false,
        createdAt: new Date().toISOString()
      };
      
      const savedFilter = await tagService.saveFilter(filterToSave);
      setSavedFilters(prev => [...prev, savedFilter]);
      setSaveDialogOpen(false);
      setFilterName('');
    } catch (err) {
      console.error('Error saving filter:', err);
      setError('Failed to save filter. Please try again.');
    }
  };
  
  /**
   * Load saved filter
   */
  const loadSavedFilter = (savedFilter: TagFilter) => {
    setFilter({
      ...savedFilter,
      includeTags: savedFilter.includeTags || [],
      excludeTags: savedFilter.excludeTags || [],
      categories: savedFilter.categories || []
    });
    onFilterChange(savedFilter);
  };
  
  /**
   * Delete saved filter
   */
  const deleteSavedFilter = async (filterId: string) => {
    try {
      await tagService.deleteFilter(filterId);
      setSavedFilters(prev => prev.filter(f => f.id !== filterId));
    } catch (err) {
      console.error('Error deleting filter:', err);
      setError('Failed to delete filter. Please try again.');
    }
  };
  
  /**
   * Toggle filter favorite status
   */
  const toggleFavorite = async (filterId: string) => {
    const filterToUpdate = savedFilters.find(f => f.id === filterId);
    if (!filterToUpdate) return;
    
    try {
      const updatedFilter = {
        ...filterToUpdate,
        isFavorite: !filterToUpdate.isFavorite
      };
      
      await tagService.saveFilter(updatedFilter);
      setSavedFilters(prev => 
        prev.map(f => f.id === filterId ? updatedFilter : f)
      );
    } catch (err) {
      console.error('Error updating filter:', err);
      setError('Failed to update filter. Please try again.');
    }
  };
  
  /**
   * Render active filters
   */
  const renderActiveFilters = () => {
    const hasActiveFilters = 
      filter.includeTags.length > 0 || 
      (filter.excludeTags?.length || 0) > 0 || 
      (filter.categories?.length || 0) > 0;
    
    if (!hasActiveFilters) {
      return (
        <Box sx={{ p: 1, textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            No active filters
          </Typography>
        </Box>
      );
    }
    
    return (
      <Box>
        {filter.includeTags.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Including Tags:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {filter.includeTags.map(tag => (
                <Chip
                  key={`include-${tag}`}
                  label={tag}
                  color="primary"
                  onDelete={() => toggleIncludeTag(tag)}
                />
              ))}
            </Box>
          </Box>
        )}
        
        {(filter.excludeTags?.length || 0) > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Excluding Tags:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {(filter.excludeTags || []).map(tag => (
                <Chip
                  key={`exclude-${tag}`}
                  label={tag}
                  color="error"
                  onDelete={() => toggleExcludeTag(tag)}
                />
              ))}
            </Box>
          </Box>
        )}
        
        {(filter.categories?.length || 0) > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Categories:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {filter.categories?.map(categoryId => {
                const category = categories.find(c => c.id === categoryId);
                return (
                  <Chip
                    key={`category-${categoryId}`}
                    label={category?.name || categoryId}
                    style={{ 
                      backgroundColor: category?.color || '#757575',
                      color: '#fff'
                    }}
                    onDelete={() => toggleCategory(categoryId)}
                  />
                );
              })}
            </Box>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={filter.matchAllTags}
                onChange={toggleMatchAllTags}
                size="small"
              />
            }
            label={
              <Typography variant="body2">
                {filter.matchAllTags ? 'Match all tags' : 'Match any tag'}
              </Typography>
            }
          />
          
          <Button
            variant="outlined"
            size="small"
            startIcon={<CloseIcon />}
            onClick={clearFilters}
          >
            Clear Filters
          </Button>
        </Box>
      </Box>
    );
  };
  
  /**
   * Render category filter
   */
  const renderCategoryFilter = () => (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2">
          Filter by Category
        </Typography>
        
        <IconButton 
          size="small"
          onClick={(e) => setCategoryMenuAnchor(e.currentTarget)}
        >
          <FilterIcon fontSize="small" />
        </IconButton>
      </Box>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {categories.slice(0, 8).map(category => (
          <Chip
            key={category.id}
            label={category.name}
            onClick={() => toggleCategory(category.id)}
            color={filter.categories?.includes(category.id) ? 'primary' : 'default'}
            variant={filter.categories?.includes(category.id) ? 'filled' : 'outlined'}
            sx={{
              backgroundColor: filter.categories?.includes(category.id) 
                ? category.color 
                : 'transparent',
              color: filter.categories?.includes(category.id) ? '#fff' : 'inherit',
              borderColor: category.color
            }}
          />
        ))}
        
        {categories.length > 8 && (
          <Chip
            label={`+${categories.length - 8} more`}
            variant="outlined"
            onClick={(e) => setCategoryMenuAnchor(e.currentTarget)}
          />
        )}
      </Box>
      
      <Menu
        anchorEl={categoryMenuAnchor}
        open={Boolean(categoryMenuAnchor)}
        onClose={() => setCategoryMenuAnchor(null)}
        PaperProps={{
          style: {
            maxHeight: 300,
            width: 250
          }
        }}
      >
        {categories.map(category => (
          <MenuItem
            key={category.id}
            onClick={() => {
              toggleCategory(category.id);
              setCategoryMenuAnchor(null);
            }}
            selected={filter.categories?.includes(category.id)}
          >
            <ListItemText 
              primary={category.name} 
              secondary={category.description}
            />
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
  
  /**
   * Render popular tags
   */
  const renderPopularTags = () => (
    <Box sx={{ mb: 3 }}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 1,
          cursor: 'pointer'
        }}
        onClick={() => setPopularTagsExpanded(!popularTagsExpanded)}
      >
        <Typography variant="subtitle2">
          Popular Tags
        </Typography>
        
        <IconButton size="small">
          <ExpandMoreIcon 
            sx={{ 
              transform: popularTagsExpanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.3s'
            }} 
          />
        </IconButton>
      </Box>
      
      <Collapse in={popularTagsExpanded}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {tags.map(tag => {
            const isIncluded = filter.includeTags.includes(tag.name);
            const isExcluded = filter.excludeTags?.includes(tag.name) || false;
            
            return (
              <Tooltip
                key={tag.id}
                title={
                  <Box>
                    <Typography variant="body2">
                      {tag.name} ({tag.usageCount} uses)
                    </Typography>
                    <Typography variant="caption">
                      Click to include, right-click to exclude
                    </Typography>
                  </Box>
                }
              >
                <Chip
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {tag.name}
                      <Typography variant="caption" sx={{ ml: 0.5, opacity: 0.7 }}>
                        ({tag.usageCount})
                      </Typography>
                    </Box>
                  }
                  onClick={() => toggleIncludeTag(tag.name)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    toggleExcludeTag(tag.name);
                  }}
                  color={isIncluded ? 'primary' : isExcluded ? 'error' : 'default'}
                  variant={isIncluded || isExcluded ? 'filled' : 'outlined'}
                />
              </Tooltip>
            );
          })}
        </Box>
      </Collapse>
    </Box>
  );
  
  /**
   * Render saved filters
   */
  const renderSavedFilters = () => {
    if (!showSavedFilters) return null;
    
    return (
      <Box sx={{ mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2 
        }}>
          <Typography variant="subtitle2">
            Saved Filters
          </Typography>
          
          <Button
            size="small"
            startIcon={<SaveIcon />}
            variant="outlined"
            onClick={() => setSaveDialogOpen(true)}
          >
            Save Current
          </Button>
        </Box>
        
        {savedFilters.length === 0 ? (
          <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', p: 1 }}>
            No saved filters
          </Typography>
        ) : (
          <List>
            {savedFilters.map(savedFilter => (
              <ListItem
                key={savedFilter.id}
                button
                onClick={() => loadSavedFilter(savedFilter)}
                selected={savedFilter.id === filter.id}
                sx={{ borderRadius: 1 }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {savedFilter.isFavorite && (
                        <StarIcon 
                          fontSize="small" 
                          color="warning" 
                          sx={{ mr: 1 }} 
                        />
                      )}
                      {savedFilter.name}
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption">
                      {savedFilter.includeTags.length > 0 && 
                        `${savedFilter.includeTags.length} included tags${
                          (savedFilter.excludeTags?.length || 0) > 0 ? ', ' : ''
                        }`
                      }
                      {(savedFilter.excludeTags?.length || 0) > 0 && 
                        `${savedFilter.excludeTags?.length} excluded tags`
                      }
                    </Typography>
                  }
                />
                <ListItemSecondaryAction>
                  <Tooltip title={savedFilter.isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                    <IconButton 
                      edge="end" 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(savedFilter.id!);
                      }}
                      size="small"
                    >
                      {savedFilter.isFavorite ? (
                        <BookmarkIcon fontSize="small" color="warning" />
                      ) : (
                        <BookmarkOutlineIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete filter">
                    <IconButton 
                      edge="end" 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSavedFilter(savedFilter.id!);
                      }}
                      size="small"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    );
  };
  
  /**
   * Render save dialog
   */
  const renderSaveDialog = () => (
    <Dialog 
      open={saveDialogOpen} 
      onClose={() => setSaveDialogOpen(false)}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>Save Filter</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          label="Filter Name"
          fullWidth
          margin="dense"
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          placeholder="My Custom Filter"
        />
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2">
            {filter.includeTags.length > 0 && (
              <>Including: {filter.includeTags.join(', ')}<br /></>
            )}
            {(filter.excludeTags?.length || 0) > 0 && (
              <>Excluding: {(filter.excludeTags || []).join(', ')}<br /></>
            )}
            {(filter.categories?.length || 0) > 0 && (
              <>
                Categories: {filter.categories?.map(categoryId => {
                  const category = categories.find(c => c.id === categoryId);
                  return category?.name || categoryId;
                }).join(', ')}
                <br />
              </>
            )}
            {filter.matchAllTags ? 'Matching all tags' : 'Matching any tag'}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setSaveDialogOpen(false)}>
          Cancel
        </Button>
        <Button 
          onClick={saveFilter}
          variant="contained"
          disabled={!filterName.trim()}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
  
  // Determine if filters are active
  const hasActiveFilters = 
    filter.includeTags.length > 0 || 
    (filter.excludeTags?.length || 0) > 0 || 
    (filter.categories?.length || 0) > 0;
  
  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2 
      }}>
        <Typography variant="h6">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FilterIcon sx={{ mr: 1 }} />
            Tag Filters
            {hasActiveFilters && (
              <Badge 
                badgeContent={
                  (filter.includeTags.length) + 
                  (filter.excludeTags?.length || 0) + 
                  (filter.categories?.length || 0)
                }
                color="primary"
                sx={{ ml: 1 }}
              />
            )}
          </Box>
        </Typography>
        
        {hasActiveFilters && (
          <Button
            variant="text"
            size="small"
            onClick={clearFilters}
          >
            Clear All
          </Button>
        )}
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box mb={3}>
        <Typography variant="subtitle2" gutterBottom>
          Active Filters
        </Typography>
        {renderActiveFilters()}
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      {loading ? (
        <Box sx={{ textAlign: 'center', p: 2 }}>
          <Typography>Loading filter options...</Typography>
        </Box>
      ) : (
        <>
          {renderCategoryFilter()}
          {renderPopularTags()}
          {renderSavedFilters()}
        </>
      )}
      
      {renderSaveDialog()}
    </Paper>
  );
};

export default TagFilterInterface; 