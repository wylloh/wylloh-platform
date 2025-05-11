import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Divider,
  Button,
  Alert,
  Grid,
  Card,
  CardContent,
  TextField,
  MenuItem,
  CircularProgress
} from '@mui/material';
import MetadataEditor from '../../components/metadata/MetadataEditor';
import MetadataDisplay from '../../components/metadata/MetadataDisplay';
import MetadataSearch from '../../components/metadata/MetadataSearch';
import { ContentType, ContentMetadata } from '../../services/metadata.service';
import metadataService from '../../services/metadata.service';

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
      id={`metadata-tabpanel-${index}`}
      aria-labelledby={`metadata-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Sample content IDs for testing
const SAMPLE_CONTENT = [
  {
    id: 'content-1',
    name: 'The Matrix',
    type: ContentType.MOVIE
  },
  {
    id: 'content-2',
    name: 'Stranger Things',
    type: ContentType.SERIES
  },
  {
    id: 'content-3',
    name: 'Classical Music Collection',
    type: ContentType.MUSIC
  }
];

const MetadataTestPage: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [selectedContent, setSelectedContent] = useState(SAMPLE_CONTENT[0]);
  const [generatedMetadata, setGeneratedMetadata] = useState<ContentMetadata | null>(null);
  const [generating, setGenerating] = useState(false);
  const [searchResults, setSearchResults] = useState<ContentMetadata[]>([]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const handleContentSelect = (content: typeof SAMPLE_CONTENT[0]) => {
    setSelectedContent(content);
  };
  
  const handleGenerateRandomMetadata = async () => {
    setGenerating(true);
    
    try {
      // Generate random data based on content type
      const releaseYear = Math.floor(Math.random() * 30) + 1990;
      const duration = Math.floor(Math.random() * 7200) + 1800; // 30-150 minutes
      
      const genres = [
        'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 
        'Drama', 'Family', 'Fantasy', 'Horror', 'Mystery', 'Romance', 
        'Science Fiction', 'Thriller', 'War', 'Western', 'Musical', 'Biography'
      ];
      
      const selectedGenres = [];
      const genreCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < genreCount; i++) {
        const randomGenre = genres[Math.floor(Math.random() * genres.length)];
        if (!selectedGenres.includes(randomGenre)) {
          selectedGenres.push(randomGenre);
        }
      }
      
      const languages = ['English', 'Spanish', 'French', 'German', 'Japanese', 'Korean'];
      const randomLanguage = languages[Math.floor(Math.random() * languages.length)];
      
      const countries = ['US', 'UK', 'CA', 'FR', 'DE', 'JP', 'KR'];
      const randomCountry = countries[Math.floor(Math.random() * countries.length)];
      
      // Create metadata based on content type
      let metadata: ContentMetadata;
      
      if (selectedContent.type === ContentType.MOVIE) {
        metadata = {
          title: selectedContent.name,
          description: `This is a sample description for the movie "${selectedContent.name}". It's a great film released in ${releaseYear}.`,
          contentType: ContentType.MOVIE,
          releaseYear,
          duration,
          genre: selectedGenres,
          tags: ['sample', 'test', 'movie'],
          language: randomLanguage,
          country: randomCountry,
          director: 'Sample Director',
          producer: 'Sample Producer',
          writer: 'Sample Writer',
          cast: ['Actor 1', 'Actor 2', 'Actor 3'],
          studio: 'Sample Studios',
          version: '1.0.0'
        };
      } else if (selectedContent.type === ContentType.SERIES) {
        metadata = {
          title: selectedContent.name,
          description: `This is a sample description for the series "${selectedContent.name}". It's a great show that premiered in ${releaseYear}.`,
          contentType: ContentType.SERIES,
          releaseYear,
          duration: duration * 5, // Total duration for the series
          genre: selectedGenres,
          tags: ['sample', 'test', 'series'],
          language: randomLanguage,
          country: randomCountry,
          director: 'Sample Director',
          producer: 'Sample Producer',
          writer: 'Sample Writer',
          cast: ['Actor 1', 'Actor 2', 'Actor 3', 'Actor 4'],
          studio: 'Sample TV Studios',
          version: '1.0.0'
        };
      } else {
        metadata = {
          title: selectedContent.name,
          description: `This is a sample description for "${selectedContent.name}". It's great content released in ${releaseYear}.`,
          contentType: selectedContent.type,
          releaseYear,
          duration,
          genre: selectedGenres,
          tags: ['sample', 'test', selectedContent.type],
          language: randomLanguage,
          country: randomCountry,
          version: '1.0.0'
        };
      }
      
      setGeneratedMetadata(metadata);
    } catch (error) {
      console.error('Error generating sample metadata:', error);
    } finally {
      setGenerating(false);
    }
  };
  
  const handleMetadataSearch = (contentType?: ContentType, query?: string) => {
    // For the test page, we'll just use the generated metadata as a demo
    if (generatedMetadata) {
      setSearchResults([generatedMetadata]);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Metadata Management System
        </Typography>
        <Typography variant="body1" paragraph>
          This page demonstrates the comprehensive metadata management system for the Wylloh platform,
          allowing you to view, edit, and search content metadata with advanced capabilities.
        </Typography>
      </Paper>
      
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabIndex} 
            onChange={handleTabChange} 
            aria-label="metadata tabs"
          >
            <Tab label="View Metadata" />
            <Tab label="Edit Metadata" />
            <Tab label="Search Metadata" />
          </Tabs>
        </Box>
        
        {/* View Metadata Tab */}
        <TabPanel value={tabIndex} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Select Content
                </Typography>
                
                <Divider sx={{ mb: 2 }} />
                
                {SAMPLE_CONTENT.map((content) => (
                  <Button
                    key={content.id}
                    fullWidth
                    variant={content.id === selectedContent.id ? 'contained' : 'outlined'}
                    onClick={() => handleContentSelect(content)}
                    sx={{ mb: 1, justifyContent: 'flex-start' }}
                  >
                    {content.name}
                  </Button>
                ))}
                
                <Box mt={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={handleGenerateRandomMetadata}
                    disabled={generating}
                  >
                    {generating ? (
                      <CircularProgress size={24} />
                    ) : (
                      'Generate Sample Metadata'
                    )}
                  </Button>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={9}>
              {generatedMetadata ? (
                <MetadataDisplay 
                  contentId={selectedContent.id} 
                  metadata={generatedMetadata}
                  showEdit={() => setTabIndex(1)}
                />
              ) : (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body1" color="textSecondary">
                    No metadata available for this content.
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Generate sample metadata or select another content item.
                  </Typography>
                  
                  <Button
                    variant="contained"
                    onClick={handleGenerateRandomMetadata}
                    disabled={generating}
                    sx={{ mt: 2 }}
                  >
                    Generate Sample Metadata
                  </Button>
                </Paper>
              )}
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Edit Metadata Tab */}
        <TabPanel value={tabIndex} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Select Content
                </Typography>
                
                <Divider sx={{ mb: 2 }} />
                
                {SAMPLE_CONTENT.map((content) => (
                  <Button
                    key={content.id}
                    fullWidth
                    variant={content.id === selectedContent.id ? 'contained' : 'outlined'}
                    onClick={() => handleContentSelect(content)}
                    sx={{ mb: 1, justifyContent: 'flex-start' }}
                  >
                    {content.name}
                  </Button>
                ))}
                
                {!generatedMetadata && (
                  <Box mt={3}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Generate sample metadata first to enable editing.
                    </Alert>
                    
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={handleGenerateRandomMetadata}
                      disabled={generating}
                    >
                      {generating ? (
                        <CircularProgress size={24} />
                      ) : (
                        'Generate Sample Metadata'
                      )}
                    </Button>
                  </Box>
                )}
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={9}>
              {generatedMetadata ? (
                <MetadataEditor 
                  contentId={selectedContent.id} 
                  contentType={selectedContent.type}
                  onSave={(updatedMetadata) => setGeneratedMetadata(updatedMetadata)}
                />
              ) : (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body1" color="textSecondary">
                    No metadata available to edit.
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Generate sample metadata first.
                  </Typography>
                  
                  <Button
                    variant="contained"
                    onClick={handleGenerateRandomMetadata}
                    disabled={generating}
                    sx={{ mt: 2 }}
                  >
                    Generate Sample Metadata
                  </Button>
                </Paper>
              )}
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Search Metadata Tab */}
        <TabPanel value={tabIndex} index={2}>
          <Typography variant="body1" paragraph>
            Search for content by metadata fields.
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            For this demonstration, the search doesn't query a real database. Try generating sample metadata first,
            then search for it to see how the search results would appear.
          </Alert>
          
          <MetadataSearch 
            onSelectContent={(contentId, metadata) => {
              const content = SAMPLE_CONTENT.find(c => c.id === contentId) || SAMPLE_CONTENT[0];
              setSelectedContent(content);
              setGeneratedMetadata(metadata);
              setTabIndex(0);  // Switch to view tab
            }}
          />
        </TabPanel>
      </Box>
    </Container>
  );
};

export default MetadataTestPage; 