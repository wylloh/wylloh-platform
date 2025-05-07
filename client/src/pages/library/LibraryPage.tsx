import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Button,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LibraryAnalytics from '../../components/library/LibraryAnalytics';
import LibraryContent from '../../components/library/LibraryContent';

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
      id={`library-tabpanel-${index}`}
      aria-labelledby={`library-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const LibraryPage: React.FC = () => {
  const { libraryId } = useParams<{ libraryId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const tabFromUrl = queryParams.get('tab');
  
  // Set initial tab value based on URL query param
  const initialTabValue = tabFromUrl === 'analytics' ? 1 : 0;
  const [tabValue, setTabValue] = useState(initialTabValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [libraryData, setLibraryData] = useState<any>(null);

  useEffect(() => {
    const fetchLibraryData = async () => {
      try {
        const response = await fetch(`/api/libraries/${libraryId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch library data');
        }
        const data = await response.json();
        setLibraryData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (libraryId) {
      fetchLibraryData();
    }
  }, [libraryId]);

  // Update tabValue when URL query changes
  useEffect(() => {
    const newTabValue = tabFromUrl === 'analytics' ? 1 : 0;
    setTabValue(newTabValue);
  }, [tabFromUrl]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Update URL query parameter
    const tabQuery = newValue === 1 ? '?tab=analytics' : '';
    navigate(`/library/${libraryId}${tabQuery}`);
  };

  const navigateToLibraries = () => {
    navigate('/library');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  if (!libraryData) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={navigateToLibraries} 
        sx={{ mb: 2 }}
      >
        Back to Libraries
      </Button>
      
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          {libraryData.name}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {libraryData.description}
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Content" />
          <Tab label="Analytics" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <LibraryContent libraryId={libraryId!} />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <LibraryAnalytics libraryId={libraryId!} />
      </TabPanel>
    </Container>
  );
};

export default LibraryPage; 