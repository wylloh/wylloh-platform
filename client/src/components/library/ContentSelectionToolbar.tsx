import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Toolbar,
  Typography,
  Checkbox,
  IconButton,
  Button,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  FormControlLabel,
  Badge,
} from '@mui/material';
import {
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  IndeterminateCheckBox as IndeterminateCheckBoxIcon,
  SelectAll as SelectAllIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  Sell as SellIcon,
  Send as SendIcon,
  Archive as ArchiveIcon,
  PlaylistAdd as PlaylistAddIcon,
  Tag as TagIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { LibraryItem } from '../../services/library.service';
import { Content } from '../../services/content.service';

// Define a token collection type
export interface TokenCollection {
  contentId: string;
  title: string;
  totalTokens: number;
  selectedTokens: number;
  items: LibraryItem[];
  value: number;
}

export interface ContentSelectionToolbarProps {
  items: LibraryItem[];
  collections?: TokenCollection[];
  selectedItems: string[]; // Array of selected content IDs
  onSelectionChange: (selectedIds: string[]) => void;
  onBatchLend?: (selectedIds: string[]) => void;
  onBatchSell?: (selectedIds: string[]) => void;
  onBatchTag?: (selectedIds: string[]) => void;
  onBatchAddToLibrary?: (selectedIds: string[]) => void;
  onBatchCreateCollection?: (selectedIds: string[]) => void;
  onBatchDelete?: (selectedIds: string[]) => void;
  userIsPro?: boolean;
  collectionView?: boolean;
  onToggleCollectionView?: () => void;
}

/**
 * A toolbar component that provides batch selection and operations for content items,
 * with special handling for token collections.
 */
const ContentSelectionToolbar: React.FC<ContentSelectionToolbarProps> = ({
  items,
  collections = [],
  selectedItems,
  onSelectionChange,
  onBatchLend,
  onBatchSell,
  onBatchTag,
  onBatchAddToLibrary,
  onBatchCreateCollection,
  onBatchDelete,
  userIsPro = false,
  collectionView = false,
  onToggleCollectionView,
}) => {
  // Menu state
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectionMenuAnchorEl, setSelectionMenuAnchorEl] = useState<null | HTMLElement>(null);
  
  // Selection state
  const totalItems = items.length;
  const isAllSelected = totalItems > 0 && selectedItems.length === totalItems;
  const isPartiallySelected = selectedItems.length > 0 && selectedItems.length < totalItems;
  
  // Collection stats
  const collectionStats = useMemo(() => {
    if (!collections || collections.length === 0) return null;
    
    // Calculate total tokens and selected tokens
    const total = collections.reduce((acc, collection) => acc + collection.totalTokens, 0);
    const selected = collections.reduce((acc, collection) => acc + collection.selectedTokens, 0);
    const collectionsWithSelections = collections.filter(c => c.selectedTokens > 0).length;
    
    return {
      totalCollections: collections.length,
      collectionsWithSelections,
      totalTokens: total,
      selectedTokens: selected,
      isPartialCollectionSelection: selected > 0 && selected < total,
      isAllCollectionsSelected: selected === total && total > 0,
      totalValue: collections.reduce((acc, c) => acc + c.value, 0),
      selectedValue: collections
        .filter(c => c.selectedTokens > 0)
        .reduce((acc, c) => {
          // Calculate proportional value based on selected/total tokens
          const proportion = c.selectedTokens / c.totalTokens;
          return acc + (c.value * proportion);
        }, 0),
    };
  }, [collections]);
  
  // Group selected items by their parent collection
  const selectedByCollection = useMemo(() => {
    if (!collections || collections.length === 0) return {};
    
    return selectedItems.reduce((acc: Record<string, string[]>, itemId) => {
      // Find which collection this item belongs to
      for (const collection of collections) {
        const items = collection.items.map(item => item.contentId);
        if (items.includes(itemId)) {
          if (!acc[collection.contentId]) {
            acc[collection.contentId] = [];
          }
          acc[collection.contentId].push(itemId);
        }
      }
      return acc;
    }, {});
  }, [selectedItems, collections]);
  
  // Handle selection menu open
  const handleSelectionMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setSelectionMenuAnchorEl(event.currentTarget);
  };
  
  // Handle selection menu close
  const handleSelectionMenuClose = () => {
    setSelectionMenuAnchorEl(null);
  };
  
  // Handle action menu open
  const handleActionMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setActionMenuAnchorEl(event.currentTarget);
  };
  
  // Handle action menu close
  const handleActionMenuClose = () => {
    setActionMenuAnchorEl(null);
  };
  
  // Handle toggle selection for all items
  const handleToggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      // Deselect all
      onSelectionChange([]);
    } else {
      // Select all
      onSelectionChange(items.map(item => item.contentId));
    }
    handleSelectionMenuClose();
  }, [isAllSelected, items, onSelectionChange]);
  
  // Handle selection inversion
  const handleInvertSelection = useCallback(() => {
    const allIds = items.map(item => item.contentId);
    const invertedSelection = allIds.filter(id => !selectedItems.includes(id));
    onSelectionChange(invertedSelection);
    handleSelectionMenuClose();
  }, [items, selectedItems, onSelectionChange]);
  
  // Handle selecting by collection
  const handleSelectByCollection = useCallback((collectionId: string) => {
    const collection = collections.find(c => c.contentId === collectionId);
    if (!collection) return;
    
    const collectionItemIds = collection.items.map(item => item.contentId);
    
    // If all items in the collection are already selected, deselect them
    const allAlreadySelected = collectionItemIds.every(id => selectedItems.includes(id));
    
    if (allAlreadySelected) {
      // Remove these items from selection
      const newSelection = selectedItems.filter(id => !collectionItemIds.includes(id));
      onSelectionChange(newSelection);
    } else {
      // Add all collection items to selection
      const newSelection = Array.from(new Set([...selectedItems, ...collectionItemIds]));
      onSelectionChange(newSelection);
    }
  }, [collections, selectedItems, onSelectionChange]);
  
  // Handle selecting by tokenized status
  const handleSelectByTokenized = useCallback((tokenized: boolean) => {
    const tokenizedItems = items.filter(item => !!item.tokenData === tokenized);
    const tokenizedItemIds = tokenizedItems.map(item => item.contentId);
    onSelectionChange(tokenizedItemIds);
    handleSelectionMenuClose();
  }, [items, onSelectionChange]);
  
  // Handle clear selection
  const handleClearSelection = useCallback(() => {
    onSelectionChange([]);
  }, [onSelectionChange]);
  
  // Calculate the selection indicator icon
  const getSelectionIcon = () => {
    if (isAllSelected) return <CheckBoxIcon />;
    if (isPartiallySelected) return <IndeterminateCheckBoxIcon />;
    return <CheckBoxOutlineBlankIcon />;
  };
  
  const renderCollectionStats = () => {
    if (!collectionStats) return null;
    
    return (
      <>
        <Divider orientation="vertical" flexItem />
        <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
          <Chip 
            label={`${collectionStats.selectedTokens} of ${collectionStats.totalTokens} tokens`}
            color="primary"
            variant="outlined"
            size="small"
            sx={{ mr: 1 }}
          />
          {collectionStats.selectedValue > 0 && (
            <Chip 
              label={`${collectionStats.selectedValue.toFixed(3)} ETH value`}
              color="secondary"
              variant="outlined"
              size="small"
              sx={{ mr: 1 }}
            />
          )}
          <Chip 
            label={`${collectionStats.collectionsWithSelections} of ${collectionStats.totalCollections} collections`}
            color="info"
            variant="outlined"
            size="small"
          />
        </Box>
      </>
    );
  };
  
  return (
    <Paper elevation={2} sx={{ mb: 2 }}>
      <Toolbar
        sx={{
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
          bgcolor: selectedItems.length > 0 ? 'primary.light' : 'background.paper',
          color: selectedItems.length > 0 ? 'primary.contrastText' : 'text.primary',
        }}
      >
        {/* Selection controls */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title={isAllSelected ? "Deselect all" : "Select all"}>
            <IconButton
              onClick={handleToggleSelectAll}
              edge="start"
              color="inherit"
            >
              {getSelectionIcon()}
            </IconButton>
          </Tooltip>
          
          <Box>
            <Button
              color="inherit"
              startIcon={<SelectAllIcon />}
              onClick={handleSelectionMenuOpen}
              size="small"
            >
              Select
            </Button>
            <Menu
              anchorEl={selectionMenuAnchorEl}
              open={Boolean(selectionMenuAnchorEl)}
              onClose={handleSelectionMenuClose}
            >
              <MenuItem onClick={handleToggleSelectAll}>
                <ListItemIcon>
                  {isAllSelected ? <CheckBoxOutlineBlankIcon /> : <CheckBoxIcon />}
                </ListItemIcon>
                <ListItemText primary={isAllSelected ? "Deselect All" : "Select All"} />
              </MenuItem>
              <MenuItem onClick={handleInvertSelection}>
                <ListItemIcon>
                  <IndeterminateCheckBoxIcon />
                </ListItemIcon>
                <ListItemText primary="Invert Selection" />
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => handleSelectByTokenized(true)}>
                <ListItemIcon>
                  <CheckBoxIcon />
                </ListItemIcon>
                <ListItemText primary="Select Tokenized" />
              </MenuItem>
              <MenuItem onClick={() => handleSelectByTokenized(false)}>
                <ListItemIcon>
                  <CheckBoxIcon />
                </ListItemIcon>
                <ListItemText primary="Select Non-Tokenized" />
              </MenuItem>
              
              {collections.length > 0 && (
                <>
                  <Divider />
                  <Typography variant="caption" sx={{ px: 2, py: 1, display: 'block' }}>
                    Select by Collection
                  </Typography>
                  {collections.map(collection => (
                    <MenuItem 
                      key={collection.contentId}
                      onClick={() => handleSelectByCollection(collection.contentId)}
                    >
                      <ListItemIcon>
                        <Badge badgeContent={collection.totalTokens} color="primary">
                          <GroupIcon />
                        </Badge>
                      </ListItemIcon>
                      <ListItemText 
                        primary={collection.title} 
                        secondary={`${collection.totalTokens} tokens`} 
                      />
                    </MenuItem>
                  ))}
                </>
              )}
            </Menu>
          </Box>
        </Box>
        
        {/* Selection count */}
        {selectedItems.length > 0 && (
          <>
            <Typography 
              sx={{ flex: '1 1 100%' }} 
              color="inherit" 
              variant="subtitle1" 
              component="div"
            >
              {selectedItems.length} selected
            </Typography>
            
            {/* Collection stats (if available) */}
            {renderCollectionStats()}
            
            {/* Batch actions */}
            <Box>
              {/* Common actions for all users */}
              {onBatchLend && (
                <Tooltip title="Lend selected items">
                  <IconButton color="inherit" onClick={() => onBatchLend(selectedItems)}>
                    <SendIcon />
                  </IconButton>
                </Tooltip>
              )}
              
              {onBatchSell && (
                <Tooltip title="Sell selected items">
                  <IconButton color="inherit" onClick={() => onBatchSell(selectedItems)}>
                    <SellIcon />
                  </IconButton>
                </Tooltip>
              )}
              
              {/* Pro-only actions */}
              {userIsPro && (
                <>
                  {onBatchTag && (
                    <Tooltip title="Tag selected items">
                      <IconButton color="inherit" onClick={() => onBatchTag(selectedItems)}>
                        <TagIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  {onBatchCreateCollection && (
                    <Tooltip title="Create collection from selected">
                      <IconButton color="inherit" onClick={() => onBatchCreateCollection(selectedItems)}>
                        <GroupIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </>
              )}
              
              {/* More actions menu */}
              <Button
                color="inherit"
                endIcon={<ArchiveIcon />}
                onClick={handleActionMenuOpen}
                size="small"
                sx={{ ml: 1 }}
              >
                More
              </Button>
              
              <Menu
                anchorEl={actionMenuAnchorEl}
                open={Boolean(actionMenuAnchorEl)}
                onClose={handleActionMenuClose}
              >
                {onBatchAddToLibrary && (
                  <MenuItem 
                    onClick={() => {
                      onBatchAddToLibrary(selectedItems);
                      handleActionMenuClose();
                    }}
                  >
                    <ListItemIcon>
                      <PlaylistAddIcon />
                    </ListItemIcon>
                    <ListItemText primary="Add to Library" />
                  </MenuItem>
                )}
                
                {onBatchDelete && (
                  <MenuItem 
                    onClick={() => {
                      onBatchDelete(selectedItems);
                      handleActionMenuClose();
                    }}
                  >
                    <ListItemIcon>
                      <DeleteIcon />
                    </ListItemIcon>
                    <ListItemText primary="Remove from Library" />
                  </MenuItem>
                )}
              </Menu>
              
              {/* Cancel selection */}
              <Tooltip title="Cancel selection">
                <IconButton color="inherit" onClick={handleClearSelection} edge="end">
                  <CancelIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </>
        )}
        
        {/* When nothing is selected */}
        {selectedItems.length === 0 && (
          <>
            <Typography variant="subtitle1" component="div" sx={{ flex: '1 1 100%' }}>
              {items.length} items
            </Typography>
            
            {collections.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Chip 
                  label={`${collections.length} Collections`}
                  color="info"
                  variant="outlined"
                  size="small"
                  sx={{ mr: 1 }}
                />
                <Chip 
                  label={`${collectionStats?.totalTokens || 0} Total Tokens`}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              </Box>
            )}
            
            {/* View toggle */}
            {onToggleCollectionView && (
              <Tooltip title={collectionView ? "Show individual tokens" : "Group by collection"}>
                <IconButton 
                  color={collectionView ? "primary" : "default"} 
                  onClick={onToggleCollectionView}
                >
                  <GroupIcon />
                </IconButton>
              </Tooltip>
            )}
            
            <Tooltip title="Selection help">
              <IconButton color="inherit">
                <InfoIcon />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Toolbar>
    </Paper>
  );
};

export default ContentSelectionToolbar; 