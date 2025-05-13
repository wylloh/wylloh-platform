import React, { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  PlayArrow as PlayArrowIcon,
  TokenOutlined as TokenIcon,
  CloudUpload as CloudUploadIcon,
  Sell as SellIcon,
  Share as ShareIcon,
  ContentCopy as DuplicateIcon,
  Archive as ArchiveIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Content } from '../../services/content.service';

interface ContentQuickActionsProps {
  content: Content;
  onDelete?: (contentId: string) => void;
  onTokenize?: (contentId: string) => void;
  onSetVisibility?: (contentId: string, visibility: 'public' | 'private' | 'unlisted') => void;
  onSetStatus?: (contentId: string, status: 'draft' | 'pending' | 'active') => void;
  onShare?: (contentId: string) => void;
  onDuplicate?: (contentId: string) => void;
  onView?: (contentId: string) => void;
  orientation?: 'horizontal' | 'vertical';
  showLabels?: boolean;
}

/**
 * Component for displaying quick action buttons for content management
 */
const ContentQuickActions: React.FC<ContentQuickActionsProps> = ({
  content,
  onDelete,
  onTokenize,
  onSetVisibility,
  onSetStatus,
  onShare,
  onDuplicate,
  onView,
  orientation = 'horizontal',
  showLabels = false,
}) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tokenizeDialogOpen, setTokenizeDialogOpen] = useState(false);
  
  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  // Delete dialog handlers
  const handleOpenDeleteDialog = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };
  
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };
  
  const handleConfirmDelete = () => {
    if (onDelete) {
      onDelete(content.id);
    }
    handleCloseDeleteDialog();
  };
  
  // Tokenize dialog handlers
  const handleOpenTokenizeDialog = () => {
    setTokenizeDialogOpen(true);
    handleMenuClose();
  };
  
  const handleCloseTokenizeDialog = () => {
    setTokenizeDialogOpen(false);
  };
  
  const handleConfirmTokenize = () => {
    if (onTokenize) {
      onTokenize(content.id);
    }
    handleCloseTokenizeDialog();
  };
  
  // Edit handler
  const handleEdit = () => {
    navigate(`/pro/edit/${content.id}`);
    handleMenuClose();
  };
  
  // View handler
  const handleView = () => {
    if (onView) {
      onView(content.id);
    } else {
      navigate(`/content/${content.id}`);
    }
    handleMenuClose();
  };
  
  // Visibility handler
  const handleSetVisibility = (visibility: 'public' | 'private' | 'unlisted') => {
    if (onSetVisibility) {
      onSetVisibility(content.id, visibility);
    }
    handleMenuClose();
  };
  
  // Share handler
  const handleShare = () => {
    if (onShare) {
      onShare(content.id);
    }
    handleMenuClose();
  };
  
  // Duplicate handler
  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate(content.id);
    }
    handleMenuClose();
  };
  
  // Primary buttons to show directly
  const primaryButtons = (
    <>
      <Tooltip title="View content">
        <IconButton 
          onClick={handleView}
          color="primary"
          size="small"
        >
          <PlayArrowIcon />
        </IconButton>
      </Tooltip>
      
      <Tooltip title="Edit content">
        <IconButton 
          onClick={handleEdit}
          color="info"
          size="small"
        >
          <EditIcon />
        </IconButton>
      </Tooltip>
      
      {!content.tokenized && (
        <Tooltip title="Tokenize content">
          <IconButton 
            onClick={handleOpenTokenizeDialog}
            color="secondary"
            size="small"
          >
            <TokenIcon />
          </IconButton>
        </Tooltip>
      )}
      
      <Tooltip title="More actions">
        <IconButton 
          onClick={handleMenuOpen}
          size="small"
        >
          <MoreVertIcon />
        </IconButton>
      </Tooltip>
    </>
  );
  
  return (
    <>
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: orientation === 'horizontal' ? 'row' : 'column',
          gap: 0.5
        }}
      >
        {primaryButtons}
      </Box>
      
      {/* More actions menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleView}>
          <ListItemIcon>
            <PlayArrowIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Content</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Content</ListItemText>
        </MenuItem>
        
        {content.visibility !== 'public' ? (
          <MenuItem onClick={() => handleSetVisibility('public')}>
            <ListItemIcon>
              <VisibilityIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Make Public</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem onClick={() => handleSetVisibility('private')}>
            <ListItemIcon>
              <VisibilityOffIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Make Private</ListItemText>
          </MenuItem>
        )}
        
        {content.visibility !== 'unlisted' && (
          <MenuItem onClick={() => handleSetVisibility('unlisted')}>
            <ListItemIcon>
              <LinkIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Make Unlisted</ListItemText>
          </MenuItem>
        )}
        
        {!content.tokenized && (
          <MenuItem onClick={handleOpenTokenizeDialog}>
            <ListItemIcon>
              <TokenIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Tokenize Content</ListItemText>
          </MenuItem>
        )}
        
        {content.tokenized && (
          <MenuItem onClick={() => onTokenize && onTokenize(content.id)}>
            <ListItemIcon>
              <SellIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>List for Sale</ListItemText>
          </MenuItem>
        )}
        
        <MenuItem onClick={handleShare}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share Content</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleDuplicate}>
          <ListItemIcon>
            <DuplicateIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleOpenDeleteDialog} sx={{ color: 'error.main' }}>
          <ListItemIcon sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete Content</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Delete Content</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{content.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Tokenize confirmation dialog */}
      <Dialog
        open={tokenizeDialogOpen}
        onClose={handleCloseTokenizeDialog}
      >
        <DialogTitle>Tokenize Content</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Would you like to tokenize "{content.title}" on the blockchain? This will let you sell access tokens and set up royalties.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTokenizeDialog}>Cancel</Button>
          <Button onClick={handleConfirmTokenize} color="secondary" variant="contained">
            Go to Tokenization
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ContentQuickActions; 