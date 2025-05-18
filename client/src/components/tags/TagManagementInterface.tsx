import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Divider,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Label as LabelIcon,
  Category as CategoryIcon,
  Search as SearchIcon,
  Sort as SortIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { TagCategory, Tag, TagWithCategory } from '../../types/Tag';
import tagService from '../../services/tag.service';

/**
 * Props for the TagManagementInterface component
 */
interface TagManagementInterfaceProps {
  /**
   * Optional callback when tags are updated
   */
  onTagsUpdated?: () => void;
}

/**
 * Tag Management Interface component
 * Allows users to create, edit, delete, and categorize tags
 */
const TagManagementInterface: React.FC<TagManagementInterfaceProps> = ({ 
  onTagsUpdated
}) => {
  // States for tags and categories
  const [tags, setTags] = useState<TagWithCategory[]>([]);
  const [categories, setCategories] = useState<TagCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'created'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Dialog states
  const [tagDialogOpen, setTagDialogOpen] = useState<boolean>(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState<boolean>(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [currentTag, setCurrentTag] = useState<Partial<Tag> | null>(null);
  const [currentCategory, setCurrentCategory] = useState<Partial<TagCategory> | null>(null);
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Fetch tags and categories on component mount
  useEffect(() => {
    fetchTagsAndCategories();
  }, []);
  
  // Fetch tags when filters change
  useEffect(() => {
    fetchTags();
  }, [searchTerm, selectedCategory, sortBy, sortOrder]);
  
  /**
   * Fetch tags and categories from the API
   */
  const fetchTagsAndCategories = async () => {
    setLoading(true);
    try {
      const [tagsResponse, categoriesResponse] = await Promise.all([
        tagService.getTags(),
        tagService.getCategories()
      ]);
      
      setTags(tagsResponse);
      setCategories(categoriesResponse);
      setError(null);
    } catch (err) {
      console.error('Error fetching tag data:', err);
      setError('Failed to load tags and categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Fetch tags with current filters
   */
  const fetchTags = async () => {
    setLoading(true);
    try {
      const filteredTags = await tagService.getTags({
        search: searchTerm,
        categoryId: selectedCategory || undefined,
        sort: sortBy,
        order: sortOrder
      });
      setTags(filteredTags);
      setError(null);
    } catch (err) {
      console.error('Error fetching tags:', err);
      setError('Failed to load tags. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Open tag dialog for creating or editing a tag
   */
  const openTagDialog = (tag?: TagWithCategory) => {
    setCurrentTag(tag || { name: '', description: '', categoryId: '', usageCount: 0 });
    setTagDialogOpen(true);
  };
  
  /**
   * Open category dialog for creating or editing a category
   */
  const openCategoryDialog = (category?: TagCategory) => {
    setCurrentCategory(category || { name: '', description: '', color: '#3f51b5' });
    setCategoryDialogOpen(true);
  };
  
  /**
   * Open delete confirmation dialog
   */
  const openDeleteConfirm = (tag: TagWithCategory) => {
    setCurrentTag(tag);
    setDeleteConfirmOpen(true);
  };
  
  /**
   * Handle tag form submission
   */
  const handleTagSubmit = async () => {
    if (!currentTag || !currentTag.name) return;
    
    try {
      if (currentTag.id) {
        // Update existing tag
        await tagService.updateTag(currentTag.id, currentTag);
        showSnackbar('Tag updated successfully', 'success');
      } else {
        // Create new tag
        await tagService.createTag(currentTag);
        showSnackbar('Tag created successfully', 'success');
      }
      
      setTagDialogOpen(false);
      fetchTags();
      if (onTagsUpdated) onTagsUpdated();
    } catch (err) {
      console.error('Error saving tag:', err);
      showSnackbar('Failed to save tag. Please try again.', 'error');
    }
  };
  
  /**
   * Handle category form submission
   */
  const handleCategorySubmit = async () => {
    if (!currentCategory || !currentCategory.name) return;
    
    try {
      if (currentCategory.id) {
        // Update existing category
        await tagService.updateCategory(currentCategory.id, currentCategory);
        showSnackbar('Category updated successfully', 'success');
      } else {
        // Create new category
        await tagService.createCategory(currentCategory);
        showSnackbar('Category created successfully', 'success');
      }
      
      setCategoryDialogOpen(false);
      await fetchTagsAndCategories();
    } catch (err) {
      console.error('Error saving category:', err);
      showSnackbar('Failed to save category. Please try again.', 'error');
    }
  };
  
  /**
   * Handle tag deletion
   */
  const handleDeleteTag = async () => {
    if (!currentTag || !currentTag.id) return;
    
    try {
      // Check if tag is in use
      if (currentTag.usageCount > 0) {
        showSnackbar(`Cannot delete tag "${currentTag.name}" as it is used by ${currentTag.usageCount} content items.`, 'error');
        setDeleteConfirmOpen(false);
        return;
      }
      
      await tagService.deleteTag(currentTag.id);
      showSnackbar('Tag deleted successfully', 'success');
      setDeleteConfirmOpen(false);
      fetchTags();
      if (onTagsUpdated) onTagsUpdated();
    } catch (err) {
      console.error('Error deleting tag:', err);
      showSnackbar('Failed to delete tag. Please try again.', 'error');
    }
  };
  
  /**
   * Show snackbar with message
   */
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };
  
  /**
   * Close snackbar
   */
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };
  
  /**
   * Handle change in category for a tag
   */
  const handleCategoryChange = (tagId: string, categoryId: string) => {
    const tag = tags.find(t => t.id === tagId);
    if (tag) {
      tagService.updateTag(tagId, { ...tag, categoryId })
        .then(() => {
          fetchTags();
          showSnackbar('Tag category updated', 'success');
          if (onTagsUpdated) onTagsUpdated();
        })
        .catch(err => {
          console.error('Error updating tag category:', err);
          showSnackbar('Failed to update tag category', 'error');
        });
    }
  };
  
  /**
   * Render tag filter toolbar
   */
  const renderFilterToolbar = () => (
    <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
      {/* Search field */}
      <TextField
        placeholder="Search tags..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        variant="outlined"
        size="small"
        fullWidth
        InputProps={{
          startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
        }}
        sx={{ flexGrow: 1 }}
      />
      
      {/* Category filter */}
      <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
        <InputLabel id="category-filter-label">Category</InputLabel>
        <Select
          labelId="category-filter-label"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as string)}
          label="Category"
        >
          <MenuItem value="">All Categories</MenuItem>
          {categories.map((category) => (
            <MenuItem key={category.id} value={category.id}>
              {category.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      {/* Sort options */}
      <FormControl variant="outlined" size="small" sx={{ minWidth: 160 }}>
        <InputLabel id="sort-by-label">Sort By</InputLabel>
        <Select
          labelId="sort-by-label"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'usage' | 'created')}
          label="Sort By"
        >
          <MenuItem value="name">Name</MenuItem>
          <MenuItem value="usage">Usage Count</MenuItem>
          <MenuItem value="created">Creation Date</MenuItem>
        </Select>
      </FormControl>
      
      {/* Sort order toggle */}
      <Tooltip title={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}>
        <IconButton onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
          <SortIcon sx={{ transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none' }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
  
  /**
   * Render tag list
   */
  const renderTagList = () => (
    <List>
      {tags.map((tag) => (
        <ListItem
          key={tag.id}
          divider
          secondaryAction={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 120, mr: 1 }}>
                <Select
                  value={tag.categoryId || ''}
                  onChange={(e) => handleCategoryChange(tag.id, e.target.value as string)}
                  displayEmpty
                  variant="outlined"
                  size="small"
                >
                  <MenuItem value="">No Category</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Tooltip title="Edit Tag">
                <IconButton edge="end" onClick={() => openTagDialog(tag)}>
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete Tag">
                <IconButton edge="end" onClick={() => openDeleteConfirm(tag)}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
          }
        >
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LabelIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="subtitle1">{tag.name}</Typography>
                <Chip 
                  size="small" 
                  label={`${tag.usageCount} ${tag.usageCount === 1 ? 'use' : 'uses'}`}
                  sx={{ ml: 1 }}
                />
              </Box>
            }
            secondary={tag.description}
          />
        </ListItem>
      ))}
      {tags.length === 0 && !loading && (
        <ListItem>
          <ListItemText
            primary="No tags found"
            secondary="Create a new tag or adjust your filters"
          />
        </ListItem>
      )}
    </List>
  );
  
  /**
   * Render category list
   */
  const renderCategoryList = () => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Categories
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {categories.map((category) => (
          <Chip
            key={category.id}
            label={category.name}
            onClick={() => openCategoryDialog(category)}
            onDelete={() => {/* Handle delete */}}
            deleteIcon={<EditIcon />}
            color="primary"
            variant="outlined"
            sx={{ 
              backgroundColor: category.color,
              color: '#fff',
              '& .MuiChip-deleteIcon': {
                color: '#fff'
              }
            }}
          />
        ))}
        <Chip
          icon={<AddIcon />}
          label="New Category"
          onClick={() => openCategoryDialog()}
          variant="outlined"
        />
      </Box>
    </Box>
  );
  
  /**
   * Render tag dialog
   */
  const renderTagDialog = () => (
    <Dialog open={tagDialogOpen} onClose={() => setTagDialogOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>
        {currentTag?.id ? 'Edit Tag' : 'Create New Tag'}
      </DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ mt: 1 }}>
          <TextField
            label="Tag Name"
            fullWidth
            required
            margin="normal"
            value={currentTag?.name || ''}
            onChange={(e) => setCurrentTag({ ...currentTag!, name: e.target.value })}
          />
          
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            margin="normal"
            value={currentTag?.description || ''}
            onChange={(e) => setCurrentTag({ ...currentTag!, description: e.target.value })}
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="tag-category-label">Category</InputLabel>
            <Select
              labelId="tag-category-label"
              value={currentTag?.categoryId || ''}
              onChange={(e) => setCurrentTag({ ...currentTag!, categoryId: e.target.value })}
              label="Category"
            >
              <MenuItem value="">No Category</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setTagDialogOpen(false)}>
          Cancel
        </Button>
        <Button 
          onClick={handleTagSubmit} 
          color="primary" 
          variant="contained"
          disabled={!currentTag?.name}
        >
          {currentTag?.id ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
  
  /**
   * Render category dialog
   */
  const renderCategoryDialog = () => (
    <Dialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>
        {currentCategory?.id ? 'Edit Category' : 'Create New Category'}
      </DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ mt: 1 }}>
          <TextField
            label="Category Name"
            fullWidth
            required
            margin="normal"
            value={currentCategory?.name || ''}
            onChange={(e) => setCurrentCategory({ ...currentCategory!, name: e.target.value })}
          />
          
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            margin="normal"
            value={currentCategory?.description || ''}
            onChange={(e) => setCurrentCategory({ ...currentCategory!, description: e.target.value })}
          />
          
          <TextField
            label="Color"
            fullWidth
            margin="normal"
            type="color"
            value={currentCategory?.color || '#3f51b5'}
            onChange={(e) => setCurrentCategory({ ...currentCategory!, color: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setCategoryDialogOpen(false)}>
          Cancel
        </Button>
        <Button 
          onClick={handleCategorySubmit} 
          color="primary" 
          variant="contained"
          disabled={!currentCategory?.name}
        >
          {currentCategory?.id ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
  
  /**
   * Render delete confirmation dialog
   */
  const renderDeleteConfirmDialog = () => (
    <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
      <DialogTitle>Delete Tag</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete the tag "{currentTag?.name}"?
          {currentTag?.usageCount ? (
            <Typography color="error" sx={{ mt: 1 }}>
              This tag is used by {currentTag.usageCount} content items and cannot be deleted.
            </Typography>
          ) : (
            <Typography sx={{ mt: 1 }}>
              This action cannot be undone.
            </Typography>
          )}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDeleteConfirmOpen(false)}>
          Cancel
        </Button>
        <Button 
          onClick={handleDeleteTag} 
          color="error" 
          variant="contained" 
          disabled={currentTag?.usageCount ? true : false}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Tag Management</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => openTagDialog()}
        >
          New Tag
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {renderCategoryList()}
      
      <Divider sx={{ mb: 3 }} />
      
      <Typography variant="h6" gutterBottom>
        Tags
      </Typography>
      
      {renderFilterToolbar()}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        renderTagList()
      )}
      
      {/* Dialogs */}
      {renderTagDialog()}
      {renderCategoryDialog()}
      {renderDeleteConfirmDialog()}
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
        action={
          <IconButton size="small" color="inherit" onClick={handleCloseSnackbar}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </Box>
  );
};

export default TagManagementInterface;