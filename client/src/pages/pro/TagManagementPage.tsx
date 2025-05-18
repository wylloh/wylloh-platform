import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Tab,
  Tabs,
  Divider,
  Button,
  Alert,
  Snackbar
} from '@mui/material';
import TagManagementInterface from '../../components/tags/TagManagementInterface';
import TagFilterInterface from '../../components/tags/TagFilterInterface';
import TagSuggestionSystem from '../../components/tags/TagSuggestionSystem';
import { TagFilter } from '../../types/Tag';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

/**
 * Tab panel component
 */
const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tag-tabpanel-${index}`}
      aria-labelledby={`tag-tab-${index}`}
      {...other}
      style={{ paddingTop: 24 }}
    >
      {value === index && children}
    </div>
  );
};

/**
 * Tag Management Page
 * Combines all tag-related components in one place
 */
const TagManagementPage: React.FC = () => {
  // State
  const [tabValue, setTabValue] = useState<number>(0);
  const [currentFilter, setCurrentFilter] = useState<TagFilter>({
    includeTags: [],
    excludeTags: [],
    matchAllTags: true,
    categories: []
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Change tab
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Show snackbar
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };
  
  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  // Handle filter change
  const handleFilterChange = (filter: TagFilter) => {
    setCurrentFilter(filter);
  };
  
  // Handle tag update
  const handleTagsUpdated = () => {
    showSnackbar('Tags updated successfully', 'success');
  };
  
  // Add a tag (for suggestion demo)
  const handleAddTag = (tag: string) => {
    showSnackbar(`Added tag: ${tag}`, 'success');
  };
  
  // Add multiple tags (for suggestion demo)
  const handleAddMultipleTags = (tags: string[]) => {
    showSnackbar(`Added ${tags.length} tags`, 'success');
  };
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Tag Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create, manage, and organize your tags to better categorize and filter your content.
        </Typography>
      </Box>
      
      <Paper elevation={0} variant="outlined" sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Manage Tags" />
          <Tab label="Filter Interface" />
          <Tab label="Tag Suggestions" />
        </Tabs>
        
        <Divider />
        
        <TabPanel value={tabValue} index={0}>
          <Box p={3}>
            <TagManagementInterface onTagsUpdated={handleTagsUpdated} />
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box p={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Paper elevation={0} variant="outlined" sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Content Preview
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    This shows a preview of how the tag filter interface will appear to users browsing content.
                    Try filtering using the sidebar.
                  </Typography>
                  
                  <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography color="text.secondary">
                      {currentFilter.includeTags.length > 0 || 
                      (currentFilter.excludeTags?.length || 0) > 0 || 
                      (currentFilter.categories?.length || 0) > 0 ? (
                        `Showing content filtered by ${currentFilter.includeTags.length} included tags, 
                        ${currentFilter.excludeTags?.length || 0} excluded tags, and 
                        ${currentFilter.categories?.length || 0} categories`
                      ) : (
                        'No filters applied. Content would appear here.'
                      )}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TagFilterInterface onFilterChange={handleFilterChange} initialFilter={currentFilter} />
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Box p={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Paper elevation={0} variant="outlined" sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Content Metadata Editor
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    This is a simplified demo of how tag suggestions would appear in the content metadata editor.
                  </Typography>
                  
                  <Box sx={{ 
                    height: 300, 
                    border: '1px dashed #ccc', 
                    borderRadius: 1, 
                    p: 2,
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Typography color="text.secondary">
                      Content metadata form would appear here
                    </Typography>
                  </Box>
                  
                  <Alert severity="info" sx={{ mb: 2 }}>
                    In a real implementation, tag suggestions would be based on content analysis and user behavior.
                  </Alert>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={5}>
                <TagSuggestionSystem 
                  contentId="demo-content-123"
                  currentTags={['Film', 'Drama']}
                  onAddTag={handleAddTag}
                  onAddMultipleTags={handleAddMultipleTags}
                />
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Paper>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
      />
    </Container>
  );
};

export default TagManagementPage; 