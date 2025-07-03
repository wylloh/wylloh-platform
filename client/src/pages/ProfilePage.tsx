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
  Settings,
  Email,
  EmailOutlined,
  FlashOn,
  AccountBalanceWallet,
  Refresh,
  History,
  TrendingUp
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import RequestProStatusButton from '../components/profile/RequestProStatusButton';
import AdminBadge from '../components/common/AdminBadge';
import { useNavigate, useLocation } from 'react-router-dom';
import { StripeOnrampModal } from '../components/payment/StripeOnrampModal';
import { enhancedBlockchainService } from '../services/enhancedBlockchain.service';

// 🧹 PRODUCTION CLEANUP: Removed mock content data - this will be populated by real user content

const ProfilePage: React.FC = () => {
  const { user, updateProfile, refreshUser } = useAuth();
  const { account, active } = useWallet(); // Get actual wallet state
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedTab, setSelectedTab] = React.useState(0);
  
  // 🔧 Profile editing states
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    username: user?.username || '',
    email: user?.email && !user.email.includes('@wallet.local') ? user.email : ''
  });

  // 💰 Wallet management states
  const [balances, setBalances] = React.useState({
    matic: '0.00',
    usdc: '0.00'
  });
  const [loadingBalances, setLoadingBalances] = React.useState(false);
  const [stripeModalOpen, setStripeModalOpen] = React.useState(false);
  const [chargeUpCurrency, setChargeUpCurrency] = React.useState<'MATIC' | 'USDC'>('USDC');

  // Note: Pro status refresh moved to HomePage for immediate access after login

  // Check if user was redirected here for Pro verification
  const needsProVerification = location.state?.needsProVerification;
  const redirectedFrom = location.state?.from?.pathname;

  // 🎨 Enhanced wallet connection detection  
  const isWalletConnected = active && account && user?.walletAddress;
  const walletDisplayAddress = account || user?.walletAddress;

  // 💰 Wallet balance fetching
  const fetchWalletBalances = React.useCallback(async () => {
    if (!account || !active) return;
    
    setLoadingBalances(true);
    try {
      // Get MATIC balance using ethers provider
      let maticBalance = '0.00';
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const provider = new (await import('ethers')).ethers.providers.Web3Provider((window as any).ethereum);
        const balance = await provider.getBalance(account);
        maticBalance = (await import('ethers')).ethers.utils.formatEther(balance);
        // Round to 4 decimal places
        maticBalance = parseFloat(maticBalance).toFixed(4);
      }
      
      // Get USDC balance
      const usdcBalance = await enhancedBlockchainService.getUSDCBalance(account);
      
      setBalances({
        matic: maticBalance,
        usdc: usdcBalance
      });
    } catch (error) {
      console.error('Error fetching wallet balances:', error);
    } finally {
      setLoadingBalances(false);
    }
  }, [account, active]);

  // Fetch balances when wallet connects or tab is selected
  React.useEffect(() => {
    if (selectedTab === 2 && isWalletConnected) {
      fetchWalletBalances();
    }
  }, [selectedTab, isWalletConnected, fetchWalletBalances]);

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
      email: user.email && !user.email.includes('@wallet.local') ? user.email : ''
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

  // 💰 Wallet handlers
  const handleChargeUp = (currency: 'MATIC' | 'USDC') => {
    setChargeUpCurrency(currency);
    setStripeModalOpen(true);
  };

  const handleStripeSuccess = () => {
    // Refresh balances after successful charge up
    fetchWalletBalances();
  };



  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* Pro Verification Alert */}
        {needsProVerification && (
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body1" gutterBottom>
                <strong>Pro Verification Required</strong>
              </Typography>
              <Typography variant="body2">
                You need verified Pro status to access {redirectedFrom ? redirectedFrom.replace('/pro/', '') : 'Pro features'}. 
                {user.proStatus === 'pending' 
                  ? ' Your verification request is pending admin approval.' 
                  : ' Click "Request Pro Status" below to get started.'
                }
              </Typography>
            </Alert>
          </Grid>
        )}
        
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
                  {user?.roles?.includes('admin') && (
                    <Box component="span" sx={{ ml: 1, verticalAlign: 'middle' }}>
                      <AdminBadge variant="chip" size="small" />
                    </Box>
                  )}
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
                  {user.email && !user.email.includes('@wallet.local') ? (
                    <Chip 
                      icon={<Email />} 
                      label={user.email} 
                      size="small" 
                      variant="outlined" 
                    />
                  ) : (
                    <Chip 
                      icon={<EmailOutlined />} 
                      label="No email • On-platform messaging only" 
                      size="small" 
                      variant="outlined"
                      color="default"
                      sx={{ opacity: 0.7 }}
                    />
                  )}
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
                      onClick={() => navigate('/pro/upload')}
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6">⚡ Wallet Management</Typography>
                  {isWalletConnected && (
                    <Button 
                      variant="outlined" 
                      startIcon={<Refresh />}
                      onClick={fetchWalletBalances}
                      disabled={loadingBalances}
                      size="small"
                    >
                      Refresh
                    </Button>
                  )}
                </Box>

                {isWalletConnected ? (
                  <Grid container spacing={3}>
                    {/* Connection Status */}
                    <Grid item xs={12}>
                      <Card sx={{ mb: 2 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <AccountBalanceWallet color="success" sx={{ mr: 1 }} />
                            <Typography variant="h6" color="success.main">
                              🟢 Wallet Connected
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Address: {walletDisplayAddress}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Network: Polygon (Chain ID: 137)
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>

                    {user.proStatus === 'verified' ? (
                      // Full wallet management for Pro users
                      <>
                        {/* Balance Cards for Pro Users */}
                        <Grid item xs={12} md={6}>
                          <Card>
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                                  <TrendingUp sx={{ mr: 1, color: 'primary.main' }} />
                                  MATIC Balance
                                </Typography>
                                <Chip label="Gas Fees" size="small" color="primary" variant="outlined" />
                              </Box>
                              <Typography variant="h4" color="primary.main" gutterBottom>
                                {loadingBalances ? '...' : balances.matic} MATIC
                              </Typography>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                For film uploads & contract creation
                              </Typography>
                              <Button 
                                variant="contained" 
                                color="primary"
                                startIcon={<FlashOn />}
                                fullWidth
                                sx={{ mt: 2 }}
                                onClick={() => handleChargeUp('MATIC')}
                              >
                                ⚡ Charge Up MATIC
                              </Button>
                            </CardContent>
                          </Card>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Card>
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                                  <AccountBalanceWallet sx={{ mr: 1, color: 'success.main' }} />
                                  USDC Balance
                                </Typography>
                                <Chip label="Film Purchases" size="small" color="success" variant="outlined" />
                              </Box>
                              <Typography variant="h4" color="success.main" gutterBottom>
                                ${loadingBalances ? '...' : balances.usdc}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                For film purchases & marketplace transactions
                              </Typography>
                              <Button 
                                variant="contained" 
                                color="success"
                                startIcon={<FlashOn />}
                                fullWidth
                                sx={{ mt: 2 }}
                                onClick={() => handleChargeUp('USDC')}
                              >
                                ⚡ Charge Up USDC
                              </Button>
                            </CardContent>
                          </Card>
                        </Grid>
                      </>
                    ) : (
                      // Simplified view for standard users
                      <Grid item xs={12}>
                        <Card>
                          <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="h6" gutterBottom>
                              Ready for Film Purchases
                            </Typography>
                            <Typography variant="body1" color="text.secondary" paragraph>
                              Your wallet is connected and ready! When you purchase films, we'll automatically handle 
                              any payment details in the background.
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                              Current USDC Balance: <strong>${loadingBalances ? '...' : balances.usdc}</strong>
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                              <Button 
                                variant="contained" 
                                color="primary"
                                href="/store"
                              >
                                Browse Films
                              </Button>
                              <Button 
                                variant="outlined" 
                                color="success"
                                startIcon={<FlashOn />}
                                onClick={() => handleChargeUp('USDC')}
                              >
                                Add Funds
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}

                    {/* Currency Information */}
                    <Grid item xs={12}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                            <History sx={{ mr: 1 }} />
                            How Payments Work
                          </Typography>
                          
                          {/* Simplified explanation for all users */}
                          <Alert severity="info" sx={{ mb: 3 }}>
                            <Typography variant="body2">
                              <strong>🎬 Simple Film Purchases:</strong> When you buy films, our platform automatically handles the payment flow. 
                              If you need more crypto, we'll guide you through a quick credit card top-up process.
                            </Typography>
                          </Alert>

                          {user.proStatus === 'verified' ? (
                            // Detailed currency info for Pro users only
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={6}>
                                <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 1, color: 'primary.contrastText' }}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    ∞ MATIC (Polygon)
                                  </Typography>
                                  <Typography variant="body2">
                                    • Required for blockchain transactions<br/>
                                    • Gas fees for uploads, contracts, purchases<br/>
                                    • Recommended: Keep 2-5 MATIC minimum<br/>
                                    • Current rate: ~$0.40-0.60 per MATIC
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1, color: 'success.contrastText' }}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    💵 USDC (USD Coin)
                                  </Typography>
                                  <Typography variant="body2">
                                    • 1:1 USD-backed stablecoin<br/>
                                    • Used for film purchases ($19.99, etc.)<br/>
                                    • Stable value, no volatility<br/>
                                    • Accepted globally on Wylloh platform
                                  </Typography>
                                </Box>
                              </Grid>
                              
                              {/* Pro Tips for verified users */}
                              <Grid item xs={12}>
                                <Alert severity="warning" sx={{ mt: 2 }}>
                                  <Typography variant="body2" gutterBottom>
                                    <strong>💡 Pro Account Features:</strong>
                                  </Typography>
                                  <Typography variant="body2">
                                    • <strong>Manual wallet management:</strong> Proactive charging for large uploads<br/>
                                    • <strong>Gas fee planning:</strong> Upload packages require MATIC for contract creation<br/>
                                    • <strong>Bulk operations:</strong> Multiple film tokenization needs both currencies<br/>
                                    • <strong>Advanced analytics:</strong> Track exactly where your crypto is spent
                                  </Typography>
                                </Alert>
                              </Grid>
                            </Grid>
                          ) : (
                            // Simplified explanation for standard users
                            <Box sx={{ textAlign: 'center', py: 2 }}>
                              <Typography variant="body1" color="text.secondary" paragraph>
                                <strong>Focus on the films, not the crypto!</strong>
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                When you're ready to purchase a film, our checkout flow will automatically detect if you need 
                                to add funds and guide you through a simple credit card payment. No need to worry about 
                                different currency types or gas fees—we handle the technical details.
                              </Typography>
                              <Button
                                variant="outlined"
                                size="small"
                                href="/store"
                                sx={{ mt: 2 }}
                              >
                                Browse Films
                              </Button>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Simplified Pro Tips - only for verified Pro users */}
                    {user.proStatus === 'verified' && (
                      <Grid item xs={12}>
                        <Alert severity="info" sx={{ mt: 2 }}>
                          <Typography variant="body2" gutterBottom>
                            <strong>💡 Pro Account Advantages:</strong>
                          </Typography>
                          <Typography variant="body2">
                            • <strong>Proactive wallet management:</strong> Charge up in advance for smoother operations<br/>
                            • <strong>Bulk upload preparation:</strong> Ensure sufficient MATIC before large tokenization projects<br/>
                            • <strong>Professional workflow:</strong> Manage both currencies independently for complex distribution strategies
                          </Typography>
                        </Alert>
                      </Grid>
                    )}
                  </Grid>
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
              label="Email (Optional)"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              margin="normal"
              variant="outlined"
              helperText="Only used for important platform notifications. Leave blank to use on-platform messaging only."
              placeholder="your.email@example.com"
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

      {/* Stripe Onramp Modal */}
      <StripeOnrampModal
        open={stripeModalOpen}
        onClose={() => setStripeModalOpen(false)}
        walletAddress={account || ''}
        requiredAmount="50"
        contentTitle={`${chargeUpCurrency} Wallet Charge Up`}
        onSuccess={handleStripeSuccess}
        onError={(error) => console.error('Stripe onramp error:', error)}
      />
    </Container>
  );
};

export default ProfilePage; 