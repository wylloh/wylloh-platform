import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Grid,
  Button,
  Divider,
  CircularProgress,
  Alert,
  useTheme,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { Content, contentService } from '../services/content.service';
import ContentPerformanceChart from '../components/analytics/ContentPerformanceChart';
import TokenHolderAnalytics from '../components/analytics/TokenHolderAnalytics';
import RevenueBreakdown from '../components/analytics/RevenueBreakdown';
import WalletAnalyticsDashboard from '../components/analytics/WalletAnalyticsDashboard';
import StorageAnalyticsDashboard from '../components/analytics/StorageAnalyticsDashboard';
import { TimeRange } from '../components/analytics/TimeRangeSelector';
import MetricCard from '../components/analytics/MetricCard';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
      style={{ paddingTop: '24px' }}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `analytics-tab-${index}`,
    'aria-controls': `analytics-tabpanel-${index}`,
  };
}

/**
 * Analytics Dashboard Page integrating all analytics components
 */
const AnalyticsDashboardPage: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [selectedContentId, setSelectedContentId] = useState<string>('');
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [userContent, setUserContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user content
  useEffect(() => {
    const fetchUserContent = async () => {
      setLoading(true);
      setError(null);
      try {
        const content = await contentService.getCreatorContent();
        setUserContent(content.filter(item => item.tokenized));
        
        // Select the first tokenized content by default
        if (content.length > 0 && !selectedContentId) {
          const tokenizedContent = content.find(item => item.tokenized);
          if (tokenizedContent) {
            setSelectedContentId(tokenizedContent.id);
          }
        }
      } catch (err) {
        console.error('Error fetching user content:', err);
        setError('Failed to load your content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserContent();
  }, []);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle content selection change
  const handleContentChange = (event: SelectChangeEvent<string>) => {
    setSelectedContentId(event.target.value);
  };

  // Handle export data
  const handleExportData = () => {
    // In a real implementation, this would generate a CSV or PDF report
    alert('This would export analytics data as CSV or PDF in a real implementation');
  };

  // Get selected content
  const getSelectedContent = () => {
    return userContent.find(content => content.id === selectedContentId);
  };

  // Render content selector (only for content-specific tabs)
  const renderContentSelector = () => {
    if (tabValue === 3 || tabValue === 4) return null; // Don't show for wallet/storage analytics tabs
    
    return (
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel id="content-select-label">Content</InputLabel>
        <Select
          labelId="content-select-label"
          id="content-select"
          value={selectedContentId}
          label="Content"
          onChange={handleContentChange}
          disabled={loading || userContent.length === 0}
        >
          {userContent.filter(item => item.tokenized).map(content => (
            <MenuItem key={content.id} value={content.id}>
              {content.title}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  };

  // Render loading state
  if (loading && tabValue !== 3 && tabValue !== 4) { // Don't show loading for wallet/storage analytics tabs
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Render error state
  if (error && tabValue !== 3 && tabValue !== 4) { // Don't show error for wallet/storage analytics tabs
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Container>
    );
  }

  // Render no content state (only for content-specific tabs)
  if (userContent.length === 0 && !userContent.some(item => item.tokenized) && tabValue !== 3 && tabValue !== 4) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            No Tokenized Content Found
          </Typography>
          <Typography variant="body1" paragraph>
            You need to tokenize your content before you can view analytics.
          </Typography>
          <Button variant="contained" href="/creator/dashboard">
            Go to Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }

  const selectedContent = getSelectedContent();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Analytics Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExportData}
        >
          Export Data
        </Button>
      </Box>

      {renderContentSelector()}

      {selectedContent && tabValue !== 3 && tabValue !== 4 && (
        <Box sx={{ mb: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={8}>
                <Typography variant="h5" component="h2">
                  {selectedContent.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {selectedContent.description.substring(0, 150)}
                  {selectedContent.description.length > 150 ? '...' : ''}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Box
                    component="img"
                    src={selectedContent.image || 'https://via.placeholder.com/150'}
                    alt={selectedContent.title}
                    sx={{ 
                      width: 150, 
                      height: 100, 
                      objectFit: 'cover',
                      borderRadius: 1
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      )}

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Performance" {...a11yProps(0)} />
          <Tab label="Token Holders" {...a11yProps(1)} />
          <Tab label="Revenue" {...a11yProps(2)} />
          <Tab label="Wallet Analytics" {...a11yProps(3)} />
          <Tab label="Storage Analytics" {...a11yProps(4)} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {selectedContentId && (
            <ContentPerformanceChart 
              contentId={selectedContentId} 
              initialTimeRange={timeRange}
            />
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {selectedContentId && (
            <TokenHolderAnalytics 
              contentId={selectedContentId}
              initialTimeRange={timeRange}
            />
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {selectedContentId && (
            <RevenueBreakdown 
              contentId={selectedContentId}
              initialTimeRange={timeRange}
            />
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <WalletAnalyticsDashboard />
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <StorageAnalyticsDashboard />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default AnalyticsDashboardPage; 