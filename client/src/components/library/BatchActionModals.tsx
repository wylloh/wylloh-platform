import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Grid,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
} from '@mui/material';
import {
  Send as SendIcon,
  Sell as SellIcon,
  LocalOffer as TagIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { LibraryItem } from '../../services/library.service';
import { TokenCollection } from './ContentSelectionToolbar';

interface BatchActionModalsProps {
  selectedItems: string[];
  items: LibraryItem[];
  collections?: TokenCollection[];
  
  // Batch lend
  batchLendOpen: boolean;
  onCloseBatchLend: () => void;
  onSubmitBatchLend: (email: string, duration: number, price: number) => void;
  
  // Batch sell
  batchSellOpen: boolean;
  onCloseBatchSell: () => void;
  onSubmitBatchSell: (price: number, buyerEmail?: string) => void;
  
  // Batch tag
  batchTagOpen: boolean;
  onCloseBatchTag: () => void;
  onSubmitBatchTag: (tags: string[]) => void;
  
  // Batch create collection
  batchCreateCollectionOpen: boolean;
  onCloseBatchCreateCollection: () => void;
  onSubmitBatchCreateCollection: (name: string, description: string) => void;
  
  // Batch delete
  batchDeleteOpen: boolean;
  onCloseBatchDelete: () => void;
  onSubmitBatchDelete: () => void;
  
  // Optional props
  isProcessing?: boolean;
  processingProgress?: number;
  processingMessage?: string;
  availableTags?: string[];
}

/**
 * A component that provides modals for batch operations on content items.
 */
const BatchActionModals: React.FC<BatchActionModalsProps> = ({
  selectedItems,
  items,
  collections = [],
  
  batchLendOpen,
  onCloseBatchLend,
  onSubmitBatchLend,
  
  batchSellOpen,
  onCloseBatchSell,
  onSubmitBatchSell,
  
  batchTagOpen,
  onCloseBatchTag,
  onSubmitBatchTag,
  
  batchCreateCollectionOpen,
  onCloseBatchCreateCollection,
  onSubmitBatchCreateCollection,
  
  batchDeleteOpen,
  onCloseBatchDelete,
  onSubmitBatchDelete,
  
  isProcessing = false,
  processingProgress = 0,
  processingMessage = 'Processing...',
  availableTags = [],
}) => {
  // Form state for batch lend
  const [lendToEmail, setLendToEmail] = useState('');
  const [lendDuration, setLendDuration] = useState(7);
  const [lendPrice, setLendPrice] = useState(0.01);
  
  // Form state for batch sell
  const [sellPrice, setSellPrice] = useState(0);
  const [buyerEmail, setBuyerEmail] = useState('');
  
  // Form state for batch tag
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  
  // Form state for batch create collection
  const [collectionName, setCollectionName] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  
  // Reset form state when modals open/close
  useEffect(() => {
    if (!batchLendOpen) {
      setLendToEmail('');
      setLendDuration(7);
      setLendPrice(0.01);
    }
  }, [batchLendOpen]);
  
  useEffect(() => {
    if (!batchSellOpen) {
      setSellPrice(0);
      setBuyerEmail('');
    }
  }, [batchSellOpen]);
  
  useEffect(() => {
    if (!batchTagOpen) {
      setSelectedTags([]);
      setNewTag('');
    }
  }, [batchTagOpen]);
  
  useEffect(() => {
    if (!batchCreateCollectionOpen) {
      setCollectionName('');
      setCollectionDescription('');
    }
  }, [batchCreateCollectionOpen]);
  
  // Calculate stats about selected items
  const selectedItemsData = React.useMemo(() => {
    const selectedItemObjects = items.filter(item => selectedItems.includes(item.contentId));
    
    const totalValue = selectedItemObjects.reduce((sum, item) => sum + (item.currentValue || 0), 0);
    const tokenizedCount = selectedItemObjects.filter(item => !!item.tokenData).length;
    const nonTokenizedCount = selectedItemObjects.length - tokenizedCount;
    
    return {
      count: selectedItemObjects.length,
      totalValue,
      tokenizedCount,
      nonTokenizedCount,
    };
  }, [items, selectedItems]);
  
  // Handle adding a new tag
  const handleAddTag = () => {
    if (newTag && !selectedTags.includes(newTag)) {
      setSelectedTags([...selectedTags, newTag]);
      setNewTag('');
    }
  };
  
  // Handle removing a tag
  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };
  
  // Handle toggling an existing tag
  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  // Render selection summary
  const renderSelectionSummary = () => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Selection Summary
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6} sm={3}>
          <Typography variant="body2" color="text.secondary">
            Items
          </Typography>
          <Typography variant="body1" fontWeight="medium">
            {selectedItemsData.count}
          </Typography>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Typography variant="body2" color="text.secondary">
            Total Value
          </Typography>
          <Typography variant="body1" fontWeight="medium">
            {selectedItemsData.totalValue.toFixed(3)} ETH
          </Typography>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Typography variant="body2" color="text.secondary">
            Tokenized
          </Typography>
          <Typography variant="body1" fontWeight="medium">
            {selectedItemsData.tokenizedCount}
          </Typography>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Typography variant="body2" color="text.secondary">
            Non-tokenized
          </Typography>
          <Typography variant="body1" fontWeight="medium">
            {selectedItemsData.nonTokenizedCount}
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
  
  // Render processing state
  const renderProcessingState = () => (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Typography variant="body2" gutterBottom>
        {processingMessage}
      </Typography>
      <LinearProgress 
        variant={processingProgress > 0 ? "determinate" : "indeterminate"} 
        value={processingProgress} 
      />
      {processingProgress > 0 && (
        <Typography variant="body2" color="text.secondary" align="right" sx={{ mt: 1 }}>
          {Math.round(processingProgress)}%
        </Typography>
      )}
    </Box>
  );
  
  return (
    <>
      {/* Batch Lend Modal */}
      <Dialog 
        open={batchLendOpen} 
        onClose={isProcessing ? undefined : onCloseBatchLend}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <SendIcon sx={{ mr: 1 }} />
            Lend {selectedItems.length} Items
          </Box>
        </DialogTitle>
        <DialogContent>
          {renderSelectionSummary()}
          
          <TextField
            label="Recipient Email"
            type="email"
            fullWidth
            margin="normal"
            value={lendToEmail}
            onChange={(e) => setLendToEmail(e.target.value)}
            disabled={isProcessing}
          />
          
          <FormControl fullWidth margin="normal" disabled={isProcessing}>
            <InputLabel>Lending Duration</InputLabel>
            <Select
              value={lendDuration}
              onChange={(e) => setLendDuration(Number(e.target.value))}
            >
              <MenuItem value={3}>3 days</MenuItem>
              <MenuItem value={7}>1 week</MenuItem>
              <MenuItem value={14}>2 weeks</MenuItem>
              <MenuItem value={30}>1 month</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            label="Lending Fee (ETH)"
            type="number"
            fullWidth
            margin="normal"
            value={lendPrice}
            onChange={(e) => setLendPrice(Number(e.target.value))}
            inputProps={{ step: 0.001, min: 0 }}
            disabled={isProcessing}
          />
          
          {selectedItemsData.nonTokenizedCount > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {selectedItemsData.nonTokenizedCount} of the selected items are not tokenized and cannot be lent.
              Only tokenized content will be included in this operation.
            </Alert>
          )}
          
          {isProcessing && renderProcessingState()}
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseBatchLend} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={() => onSubmitBatchLend(lendToEmail, lendDuration, lendPrice)} 
            variant="contained" 
            color="primary"
            disabled={!lendToEmail || isProcessing}
            startIcon={<SendIcon />}
          >
            Send Lending Offers
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Batch Sell Modal */}
      <Dialog 
        open={batchSellOpen} 
        onClose={isProcessing ? undefined : onCloseBatchSell}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <SellIcon sx={{ mr: 1 }} />
            Sell {selectedItems.length} Items
          </Box>
        </DialogTitle>
        <DialogContent>
          {renderSelectionSummary()}
          
          <TextField
            label="Selling Price per Item (ETH)"
            type="number"
            fullWidth
            margin="normal"
            value={sellPrice}
            onChange={(e) => setSellPrice(Number(e.target.value))}
            inputProps={{ step: 0.001, min: 0 }}
            disabled={isProcessing}
            helperText={`Total value: ${(sellPrice * selectedItems.length).toFixed(3)} ETH`}
          />
          
          <TextField
            label="Buyer Email (Optional)"
            type="email"
            fullWidth
            margin="normal"
            value={buyerEmail}
            onChange={(e) => setBuyerEmail(e.target.value)}
            disabled={isProcessing}
            helperText="Leave empty to list on the marketplace"
          />
          
          {selectedItemsData.nonTokenizedCount > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {selectedItemsData.nonTokenizedCount} of the selected items are not tokenized and cannot be sold.
              Only tokenized content will be included in this operation.
            </Alert>
          )}
          
          {isProcessing && renderProcessingState()}
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseBatchSell} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={() => onSubmitBatchSell(sellPrice, buyerEmail || undefined)} 
            variant="contained" 
            color="primary"
            disabled={sellPrice <= 0 || isProcessing}
            startIcon={<SellIcon />}
          >
            List For Sale
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Batch Tag Modal */}
      <Dialog 
        open={batchTagOpen} 
        onClose={isProcessing ? undefined : onCloseBatchTag}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <TagIcon sx={{ mr: 1 }} />
            Tag {selectedItems.length} Items
          </Box>
        </DialogTitle>
        <DialogContent>
          {renderSelectionSummary()}
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Selected Tags
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {selectedTags.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No tags selected
                </Typography>
              ) : (
                selectedTags.map(tag => (
                  <Chip 
                    key={tag} 
                    label={tag} 
                    onDelete={() => handleRemoveTag(tag)}
                    disabled={isProcessing}
                  />
                ))
              )}
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              label="Add Tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              disabled={isProcessing}
              size="small"
              sx={{ flexGrow: 1 }}
            />
            <Button 
              onClick={handleAddTag} 
              variant="outlined"
              disabled={!newTag || isProcessing}
            >
              Add
            </Button>
          </Box>
          
          {availableTags.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Available Tags
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {availableTags.map(tag => (
                  <Chip 
                    key={tag} 
                    label={tag} 
                    onClick={() => handleToggleTag(tag)}
                    color={selectedTags.includes(tag) ? "primary" : "default"}
                    variant={selectedTags.includes(tag) ? "filled" : "outlined"}
                    disabled={isProcessing}
                  />
                ))}
              </Box>
            </Box>
          )}
          
          {isProcessing && renderProcessingState()}
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseBatchTag} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={() => onSubmitBatchTag(selectedTags)} 
            variant="contained" 
            color="primary"
            disabled={selectedTags.length === 0 || isProcessing}
            startIcon={<TagIcon />}
          >
            Apply Tags
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Batch Create Collection Modal */}
      <Dialog 
        open={batchCreateCollectionOpen} 
        onClose={isProcessing ? undefined : onCloseBatchCreateCollection}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <GroupIcon sx={{ mr: 1 }} />
            Create Collection from {selectedItems.length} Items
          </Box>
        </DialogTitle>
        <DialogContent>
          {renderSelectionSummary()}
          
          <TextField
            label="Collection Name"
            fullWidth
            margin="normal"
            value={collectionName}
            onChange={(e) => setCollectionName(e.target.value)}
            disabled={isProcessing}
          />
          
          <TextField
            label="Collection Description"
            fullWidth
            margin="normal"
            value={collectionDescription}
            onChange={(e) => setCollectionDescription(e.target.value)}
            multiline
            rows={3}
            disabled={isProcessing}
          />
          
          {isProcessing && renderProcessingState()}
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseBatchCreateCollection} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={() => onSubmitBatchCreateCollection(collectionName, collectionDescription)} 
            variant="contained" 
            color="primary"
            disabled={!collectionName || isProcessing}
            startIcon={<GroupIcon />}
          >
            Create Collection
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Batch Delete Modal */}
      <Dialog 
        open={batchDeleteOpen} 
        onClose={isProcessing ? undefined : onCloseBatchDelete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <DeleteIcon sx={{ mr: 1 }} />
            Remove {selectedItems.length} Items
          </Box>
        </DialogTitle>
        <DialogContent>
          {renderSelectionSummary()}
          
          <Alert severity="warning" sx={{ mt: 2 }}>
            Are you sure you want to remove these {selectedItems.length} items from your library?
            This action cannot be undone.
          </Alert>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Note: This will only remove the items from your library, not delete them from the blockchain.
            If these are tokenized items, you will still own the tokens.
          </Typography>
          
          {isProcessing && renderProcessingState()}
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseBatchDelete} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={onSubmitBatchDelete} 
            variant="contained" 
            color="error"
            disabled={isProcessing}
            startIcon={<DeleteIcon />}
          >
            Remove Items
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BatchActionModals; 