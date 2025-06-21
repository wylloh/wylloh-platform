import React from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Divider,
  Chip,
  Avatar,
  Button,
  Tab,
  Tabs,
  Card,
  CardContent,
  CardMedia,
  Stack,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  VerifiedUser,
  Person,
  Wallet,
  MovieCreation,
  Edit,
  BarChart,
  Settings
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import RequestProStatusButton from '../components/profile/RequestProStatusButton';
import { useNavigate } from 'react-router-dom';

// 🧹 PRODUCTION CLEANUP: Removed mock content data - this will be populated by real user content

const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { account, active } = useWallet(); // Get actual wallet state
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = React.useState(0);
  
  // 🔧 Profile editing states
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    username: user?.username || '',
    email: user?.email || ''
  });

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">Please log in to view your profile.</Alert>
      </Container>
    );
  }

  const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  // 🔧 Profile editing handlers
  const handleEditProfile = () => {
    setEditForm({
      username: user.username,
      email: user.email
    });
    setEditDialogOpen(true);
  };

  const handleAccountSettings = () => {
    setSettingsDialogOpen(true);
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile(editForm);
      setEditDialogOpen(false);
      // Show success feedback here if needed
    } catch (error) {
      console.error('Error updating profile:', error);
      // Show error feedback here if needed
    }
  };

  // 🎨 Enhanced wallet connection detection
  const isWalletConnected = active && account && user.walletAddress;
  const walletDisplayAddress = account || user.walletAddress;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* Profile Header */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={2}>
                <Avatar 
                  sx={{ 
                    width: 100, 
                    height: 100, 
                    bgcolor: 'primary.main',
                    fontSize: '2.5rem'
                  }}
                >
                  {user.username.charAt(0).toUpperCase()}
                </Avatar>
              </Grid>
              <Grid item xs={12} sm={7}>
                <Typography variant="h4" gutterBottom>
                  {user.username}
                  {user.proStatus === 'verified' && (
                    <VerifiedUser 
                      color="secondary" 
                      sx={{ 
                        ml: 1, 
                        verticalAlign: 'middle',
                        fontSize: '1.5rem'
                      }} 
                    />
                  )}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                  <Chip 
                    icon={<Person />} 
                    label={user.email} 
                    size="small" 
                    variant="outlined" 
                  />
                  {walletDisplayAddress && (
                    <Chip 
                      icon={<Wallet />} 
                      label={`${walletDisplayAddress.substring(0, 6)}...${walletDisplayAddress.substring(walletDisplayAddress.length - 4)}`} 
                      size="small" 
                      variant="outlined" 
                      color={isWalletConnected ? 'success' : 'default'}
                    />
                  )}
                  {user.proStatus === 'verified' && (
                    <Chip 
                      icon={<MovieCreation />} 
                      label="Creator" 
                      size="small" 
                      color="primary" 
                    />
                  )}
                </Box>
                <Box sx={{ mt: 2 }}>
                  <RequestProStatusButton />
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button 
                  variant="outlined" 
                  startIcon={<Edit />} 
                  fullWidth
                  sx={{ mb: 1 }}
                  onClick={handleEditProfile}
                >
                  Edit Profile
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<Settings />} 
                  fullWidth
                  onClick={handleAccountSettings}
                >
                  Account Settings
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Tabs Section */}
        <Grid item xs={12}>
          <Paper sx={{ borderRadius: 2 }}>
            <Tabs 
              value={selectedTab} 
              onChange={handleChangeTab}
              variant="fullWidth"
              sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                '& .MuiTab-root': {
                  py: 2
                }
              }}
            >
              <Tab 
                label={user.proStatus === 'verified' ? "My Content" : "Manage Library"} 
                icon={<MovieCreation />} 
                iconPosition="start" 
              />
              <Tab label="Analytics" icon={<BarChart />} iconPosition="start" />
              <Tab label="Wallet" icon={<Wallet />} iconPosition="start" />
            </Tabs>
            
            {/* Content Tab */}
            {selectedTab === 0 && (
              <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6">
                    {user.proStatus === 'verified' ? "Your Content" : "Your Collection"}
                  </Typography>
                  {user.proStatus === 'verified' && (
                    <Button 
                      variant="contained" 
                      color="primary"
                      startIcon={<MovieCreation />}
                      onClick={() => navigate('/creator/upload')}
                    >
                      Upload Film Package
                    </Button>
                  )}
                </Box>
                
                {/* 🎬 PRODUCTION READY: Real content will be loaded here */}
                <Alert severity="info">
                  {user.proStatus === 'verified' 
                    ? "You haven't uploaded any content yet. Get started by clicking 'Upload Film Package'."
                    : "Your purchased content will appear here once you make your first purchase."
                  }
                </Alert>
              </Box>
            )}
            
            {/* Analytics Tab */}
            {selectedTab === 1 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Analytics</Typography>
                <Alert severity="info">
                  Analytics features will be available once you have published content.
                </Alert>
              </Box>
            )}
            
            {/* Wallet Tab */}
            {selectedTab === 2 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Wallet Information</Typography>
                {isWalletConnected ? (
                  <Box>
                    <Typography variant="body1" gutterBottom>
                      🟢 Wallet Connected: {walletDisplayAddress}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Network: Polygon (Chain ID: 137)
                    </Typography>
                    <Alert severity="success" sx={{ mt: 2 }}>
                      Your wallet is connected and ready for transactions. NFT balance and transaction history will be displayed here.
                    </Alert>
                  </Box>
                ) : (
                  <Alert severity="warning">
                    You don't have a wallet connected to your account yet. Connect a wallet to access all features.
                  </Alert>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* 🔧 Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Username"
              value={editForm.username}
              onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              margin="normal"
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              margin="normal"
              variant="outlined"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveProfile} variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* 🔧 Account Settings Dialog */}
      <Dialog open={settingsDialogOpen} onClose={() => setSettingsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Account Settings</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mt: 1 }}>
            Advanced account settings and security options will be available here.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialogOpen(false)} variant="contained">Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProfilePage; 