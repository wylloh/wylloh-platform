import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Switch, 
  Slider, 
  Button, 
  CircularProgress, 
  Paper, 
  Divider, 
  Grid,
  FormControlLabel,
  Alert,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  LinearProgress,
  Link
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import StorageIcon from '@mui/icons-material/Storage';
import SpeedIcon from '@mui/icons-material/Speed';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import PublishIcon from '@mui/icons-material/Publish';
import DownloadIcon from '@mui/icons-material/Download';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import { userNodeService, UserNodeConfig, NodeMetrics } from '../../services/userNode.service';
import { useWallet } from '../../hooks/useWallet';

// Helper function to format bytes to human-readable format
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Format seconds into human-readable time
const formatTime = (seconds: number) => {
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  return `${hours} hours, ${minutes} minutes`;
};

const NodeContribution: React.FC = () => {
  // State for node configuration
  const [config, setConfig] = useState<UserNodeConfig>(userNodeService.getConfig());
  
  // State for node status
  const [status, setStatus] = useState({
    initialized: false,
    running: false,
    peerId: '',
    isInitializing: false,
    error: ''
  });
  
  // State for metrics
  const [metrics, setMetrics] = useState<NodeMetrics>({
    uptime: 0,
    bytesUploaded: 0,
    bytesDownloaded: 0,
    contentServed: 0,
    peersConnected: 0,
    lastUpdated: 0
  });
  
  // State for connected peers
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  
  // Use wallet hook to get user's wallet address
  const { account } = useWallet();
  
  // Check browser support
  const [browserSupport, setBrowserSupport] = useState({
    supported: true,
    details: {} as Record<string, boolean>
  });
  
  // Initialize component
  useEffect(() => {
    // Check browser support
    checkBrowserSupport();
    
    // Load initial status
    updateStatus();
    
    // Load initial metrics
    updateMetrics();
    
    // Set up interval to refresh metrics when running
    const intervalId = setInterval(() => {
      if (status.running) {
        updateMetrics();
        updatePeers();
      }
    }, 5000);
    
    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [status.running]);
  
  // Check if browser supports the necessary features
  const checkBrowserSupport = () => {
    const hasWebRTC = 'RTCPeerConnection' in window;
    const hasWebCrypto = 'crypto' in window && 'subtle' in window.crypto;
    const hasIndexedDB = 'indexedDB' in window;
    const hasServiceWorker = 'serviceWorker' in navigator;
    
    setBrowserSupport({
      supported: hasWebRTC && hasWebCrypto,
      details: {
        WebRTC: hasWebRTC,
        WebCrypto: hasWebCrypto,
        IndexedDB: hasIndexedDB,
        ServiceWorker: hasServiceWorker
      }
    });
  };
  
  // Update node status
  const updateStatus = () => {
    const currentStatus = userNodeService.getStatus();
    setStatus(prev => ({
      ...prev,
      initialized: currentStatus.initialized,
      running: currentStatus.running,
      peerId: currentStatus.peerId || ''
    }));
  };
  
  // Update metrics
  const updateMetrics = () => {
    const currentMetrics = userNodeService.getMetrics();
    setMetrics(currentMetrics);
  };
  
  // Update connected peers list
  const updatePeers = async () => {
    if (status.running) {
      const peers = await userNodeService.getConnectedPeers();
      setConnectedPeers(peers);
    }
  };
  
  // Initialize node
  const handleInitialize = async () => {
    setStatus(prev => ({ ...prev, isInitializing: true, error: '' }));
    
    try {
      const success = await userNodeService.initialize(config);
      
      if (success) {
        updateStatus();
      } else {
        setStatus(prev => ({ 
          ...prev, 
          error: 'Failed to initialize node. Check console for details.'
        }));
      }
    } catch (error) {
      console.error('Error initializing node:', error);
      setStatus(prev => ({ 
        ...prev, 
        error: `Error: ${error instanceof Error ? error.message : String(error)}`
      }));
    } finally {
      setStatus(prev => ({ ...prev, isInitializing: false }));
    }
  };
  
  // Start node
  const handleStartNode = async () => {
    try {
      await userNodeService.startNode();
      updateStatus();
      updateMetrics();
      updatePeers();
    } catch (error) {
      console.error('Error starting node:', error);
      setStatus(prev => ({ 
        ...prev, 
        error: `Error: ${error instanceof Error ? error.message : String(error)}`
      }));
    }
  };
  
  // Stop node
  const handleStopNode = async () => {
    try {
      await userNodeService.stopNode();
      updateStatus();
      updateMetrics();
    } catch (error) {
      console.error('Error stopping node:', error);
      setStatus(prev => ({ 
        ...prev, 
        error: `Error: ${error instanceof Error ? error.message : String(error)}`
      }));
    }
  };
  
  // Handle config changes
  const handleConfigChange = (field: keyof UserNodeConfig, value: any) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    userNodeService.updateConfig({ [field]: value });
  };
  
  // If browser doesn't support required features, show warning
  if (!browserSupport.supported) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Browser Support Issue
        </Typography>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Your browser doesn't support all features needed for the IPFS node.
        </Alert>
        <Typography variant="body1" gutterBottom>
          To contribute to the network, you need a browser with the following:
        </Typography>
        <Box component="ul">
          <Box component="li" sx={{ color: browserSupport.details.WebRTC ? 'success.main' : 'error.main' }}>
            WebRTC: {browserSupport.details.WebRTC ? 'Supported' : 'Not Supported'}
          </Box>
          <Box component="li" sx={{ color: browserSupport.details.WebCrypto ? 'success.main' : 'error.main' }}>
            Web Crypto API: {browserSupport.details.WebCrypto ? 'Supported' : 'Not Supported'}
          </Box>
        </Box>
        <Typography variant="body2" sx={{ mt: 2 }}>
          We recommend using the latest version of Chrome, Firefox, or Edge.
        </Typography>
      </Paper>
    );
  }
  
  // Check if wallet is connected
  if (!account) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Connect Wallet to Contribute
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          Please connect your wallet to contribute to the network and earn rewards.
        </Alert>
        <Typography variant="body1">
          Connecting your wallet allows us to track your network contributions and distribute rewards accordingly.
        </Typography>
      </Paper>
    );
  }
  
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        <NetworkCheckIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Network Contribution
      </Typography>
      
      <Typography variant="body1" paragraph>
        Help strengthen the Wylloh network by contributing resources from your device. 
        Earn rewards based on your contribution level.
      </Typography>
      
      <Grid container spacing={3}>
        {/* Node Configuration */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Node Configuration
              <Tooltip title="Configure how much of your resources you want to share with the network">
                <IconButton size="small">
                  <HelpOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>
                <StorageIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                Storage Contribution: {config.maxStorage} MB
              </Typography>
              <Slider
                value={config.maxStorage}
                min={10}
                max={1000}
                step={10}
                onChange={(_, value) => handleConfigChange('maxStorage', value)}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value} MB`}
                disabled={status.running}
              />
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>
                <SpeedIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                Bandwidth Limit: {config.maxBandwidth} Mbps
              </Typography>
              <Slider
                value={config.maxBandwidth}
                min={0.1}
                max={10}
                step={0.1}
                onChange={(_, value) => handleConfigChange('maxBandwidth', value)}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value} Mbps`}
                disabled={status.running}
              />
            </Box>
            
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.allowSeeding}
                    onChange={(e) => handleConfigChange('allowSeeding', e.target.checked)}
                    disabled={status.running}
                  />
                }
                label="Allow seeding content to other users"
              />
            </Box>
            
            <Box sx={{ mt: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.enableWebRTC}
                    onChange={(e) => handleConfigChange('enableWebRTC', e.target.checked)}
                    disabled={status.running}
                  />
                }
                label="Enable WebRTC connections"
              />
            </Box>
            
            <Box sx={{ mt: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.enableMetrics}
                    onChange={(e) => handleConfigChange('enableMetrics', e.target.checked)}
                  />
                }
                label="Collect and report contribution metrics"
              />
            </Box>
            
            <Box sx={{ mt: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.autoStart}
                    onChange={(e) => handleConfigChange('autoStart', e.target.checked)}
                    disabled={status.running}
                  />
                }
                label="Auto-start node on page load"
              />
            </Box>
          </Paper>
        </Grid>
        
        {/* Node Status & Controls */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Node Status
            </Typography>
            
            {status.error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {status.error}
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                bgcolor: status.running ? 'success.main' : 'grey.500',
                mr: 1
              }} />
              <Typography>
                Status: {status.running ? 'Running' : (status.initialized ? 'Ready' : 'Not Initialized')}
              </Typography>
            </Box>
            
            {status.peerId && (
              <Typography variant="body2" sx={{ mb: 2, wordBreak: 'break-all' }}>
                Peer ID: {status.peerId}
              </Typography>
            )}
            
            <Box sx={{ mb: 3 }}>
              {!status.initialized ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleInitialize}
                  disabled={status.isInitializing}
                  startIcon={status.isInitializing ? <CircularProgress size={20} /> : <CloudSyncIcon />}
                  fullWidth
                >
                  {status.isInitializing ? 'Initializing...' : 'Initialize Node'}
                </Button>
              ) : status.running ? (
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleStopNode}
                  fullWidth
                >
                  Stop Node
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleStartNode}
                  fullWidth
                >
                  Start Node
                </Button>
              )}
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle1" gutterBottom>
              Contribution Metrics
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                    <Typography variant="body2" color="text.secondary">
                      Uptime
                    </Typography>
                    <Typography variant="body1">
                      {formatTime(metrics.uptime)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                    <Typography variant="body2" color="text.secondary">
                      Peers Connected
                    </Typography>
                    <Typography variant="body1">
                      {metrics.peersConnected}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                      <DownloadIcon fontSize="small" sx={{ mr: 0.5 }} /> Downloaded
                    </Typography>
                    <Typography variant="body1">
                      {formatBytes(metrics.bytesDownloaded)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                      <PublishIcon fontSize="small" sx={{ mr: 0.5 }} /> Uploaded
                    </Typography>
                    <Typography variant="body1">
                      {formatBytes(metrics.bytesUploaded)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Content Requests Served: {metrics.contentServed}
              </Typography>
            </Box>
            
            {status.running && metrics.bytesUploaded > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Network Contribution Ratio
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(100, (metrics.bytesUploaded / Math.max(1, metrics.bytesDownloaded) * 100))} 
                  sx={{ height: 8, borderRadius: 1 }}
                />
                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                  {(metrics.bytesUploaded / Math.max(1, metrics.bytesDownloaded)).toFixed(2)}x
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Connected Peers (Only shown when running) */}
        {status.running && connectedPeers.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Connected Peers ({connectedPeers.length})
              </Typography>
              <Box sx={{ maxHeight: 150, overflow: 'auto' }}>
                {connectedPeers.map((peerId, index) => (
                  <Typography key={index} variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                    {peerId}
                  </Typography>
                ))}
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
      
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Contributing to the network helps strengthen the delivery infrastructure and can earn you 
          Wylloh token rewards. Your contribution is calculated based on uptime, storage, and bandwidth provided.
          <Link href="#" sx={{ ml: 1 }}>
            Learn more about rewards
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
};

export default NodeContribution; 