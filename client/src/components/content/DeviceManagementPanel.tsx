import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Divider
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import {
  getDeviceInfo,
  getBoundDevices,
  bindDeviceToContent,
  unbindDevice,
  rotateContentKey
} from '../../utils/deviceManagement';
import { generateContentKey } from '../../utils/encryption';

interface DeviceManagementPanelProps {
  contentId: string;
  onDeviceChange?: () => void;
}

const DeviceManagementPanel: React.FC<DeviceManagementPanelProps> = ({
  contentId,
  onDeviceChange
}) => {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rotateDialogOpen, setRotateDialogOpen] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [rotating, setRotating] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    loadDevices();
  }, [contentId]);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const boundDevices = await getBoundDevices(contentId);
      setDevices(boundDevices);
      setError(null);
    } catch (err) {
      console.error('Failed to load devices:', err);
      setError('Failed to load devices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnbindDevice = async (deviceId: string) => {
    try {
      await unbindDevice(contentId, deviceId);
      await loadDevices();
      enqueueSnackbar('Device unbound successfully', { variant: 'success' });
      onDeviceChange?.();
    } catch (err) {
      console.error('Failed to unbind device:', err);
      enqueueSnackbar('Failed to unbind device', { variant: 'error' });
    }
  };

  const handleRotateKey = async () => {
    try {
      setRotating(true);
      const oldKey = await getDeviceInfo();
      const newKey = await generateContentKey();
      
      await rotateContentKey(contentId, oldKey.publicKey, newKey);
      await loadDevices();
      
      setRotateDialogOpen(false);
      enqueueSnackbar('Content key rotated successfully', { variant: 'success' });
      onDeviceChange?.();
    } catch (err) {
      console.error('Failed to rotate key:', err);
      enqueueSnackbar('Failed to rotate key', { variant: 'error' });
    } finally {
      setRotating(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2">
          Device Management
        </Typography>
        <Box>
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadDevices}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            startIcon={<SecurityIcon />}
            onClick={() => setRotateDialogOpen(true)}
            color="warning"
          >
            Rotate Key
          </Button>
        </Box>
      </Box>

      <List>
        {devices.map((device) => (
          <React.Fragment key={device.deviceId}>
            <ListItem>
              <ListItemText
                primary={device.deviceId}
                secondary={
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" display="block">
                      Bound: {new Date(device.boundAt).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Last Active: {new Date(device.lastActive).toLocaleString()}
                    </Typography>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  aria-label="unbind"
                  onClick={() => handleUnbindDevice(device.deviceId)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>

      <Dialog open={rotateDialogOpen} onClose={() => setRotateDialogOpen(false)}>
        <DialogTitle>Rotate Content Key</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This will generate a new encryption key for this content. All devices will need to be re-bound.
          </Alert>
          <Typography variant="body2" color="text.secondary" paragraph>
            Are you sure you want to rotate the content key? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRotateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRotateKey}
            color="warning"
            disabled={rotating}
            startIcon={rotating ? <CircularProgress size={20} /> : null}
          >
            {rotating ? 'Rotating...' : 'Rotate Key'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeviceManagementPanel; 