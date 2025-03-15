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
  Alert
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
import RequestProStatusButton from '../components/profile/RequestProStatusButton';
import { useNavigate } from 'react-router-dom';

// Mock content data
const mockUserContent = [
  {
    id: '1',
    title: 'Ocean Wonders',
    description: 'A short documentary about marine life.',
    image: 'https://source.unsplash.com/random/300x200?ocean',
    contentType: 'movie',
    status: 'active',
    createdAt: '2023-05-10T14:30:00Z'
  },
  {
    id: '2',
    title: 'City Lights',
    description: 'Urban photography collection showcasing city nightlife.',
    image: 'https://source.unsplash.com/random/300x200?city',
    contentType: 'art',
    status: 'draft',
    createdAt: '2023-06-05T10:15:00Z'
  }
];

const ProfilePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [selectedTab, setSelectedTab] = React.useState(0);
  const navigate = useNavigate();

  if (!isAuthenticated || !user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">
          Please log in to view your profile.
        </Alert>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }}
          onClick={() => navigate('/login')}
        >
          Go to Login
        </Button>
      </Container>
    );
  }

  const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

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
                  {user.walletAddress && (
                    <Chip 
                      icon={<Wallet />} 
                      label={`${user.walletAddress.substring(0, 6)}...${user.walletAddress.substring(user.walletAddress.length - 4)}`} 
                      size="small" 
                      variant="outlined" 
                    />
                  )}
                  {user.roles.includes('creator') && (
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
                >
                  Edit Profile
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<Settings />} 
                  fullWidth
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
              <Tab label="My Content" icon={<MovieCreation />} iconPosition="start" />
              <Tab label="Analytics" icon={<BarChart />} iconPosition="start" />
              <Tab label="Wallet" icon={<Wallet />} iconPosition="start" />
            </Tabs>
            
            {/* Content Tab */}
            {selectedTab === 0 && (
              <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6">Your Content</Typography>
                  <Button 
                    variant="contained" 
                    color="primary"
                    startIcon={<MovieCreation />}
                    onClick={() => navigate('/creator/upload')}
                  >
                    Upload New Content
                  </Button>
                </Box>
                
                {mockUserContent.length > 0 ? (
                  <Grid container spacing={3}>
                    {mockUserContent.map((content) => (
                      <Grid item xs={12} sm={6} md={4} key={content.id}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                          <CardMedia
                            component="img"
                            height="140"
                            image={content.image}
                            alt={content.title}
                          />
                          <CardContent sx={{ flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Typography variant="h6" component="div">
                                {content.title}
                              </Typography>
                              <Chip 
                                label={content.status === 'active' ? 'Published' : 'Draft'} 
                                color={content.status === 'active' ? 'success' : 'default'}
                                size="small"
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {content.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                              Created: {new Date(content.createdAt).toLocaleDateString()}
                            </Typography>
                          </CardContent>
                          <Box sx={{ p: 2, pt: 0 }}>
                            <Button 
                              size="small" 
                              variant="outlined"
                              fullWidth
                              onClick={() => navigate(`/creator/content/${content.id}`)}
                            >
                              Manage
                            </Button>
                          </Box>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Alert severity="info">
                    You haven't uploaded any content yet. Get started by clicking the "Upload New Content" button.
                  </Alert>
                )}
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
                {user.walletAddress ? (
                  <Box>
                    <Typography variant="body1">
                      Connected Wallet: {user.walletAddress}
                    </Typography>
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Wallet transaction history and balance information will be displayed here.
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
    </Container>
  );
};

export default ProfilePage; 