import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Check as CheckIcon,
  Info as InfoIcon,
  Lightbulb as LightbulbIcon
} from '@mui/icons-material';
import { TagSuggestion } from '../../types/Tag';
import tagService from '../../services/tag.service';

interface TagSuggestionSystemProps {
  contentId: string;
  currentTags: string[];
  onAddTag: (tag: string) => void;
  onAddMultipleTags: (tags: string[]) => void;
}

/**
 * System that suggests relevant tags for content
 */
const TagSuggestionSystem: React.FC<TagSuggestionSystemProps> = ({
  contentId,
  currentTags,
  onAddTag,
  onAddMultipleTags
}) => {
  // States
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  
  // Fetch suggestions on component mount or contentId change
  useEffect(() => {
    if (contentId) {
      fetchSuggestions();
    }
  }, [contentId]);
  
  /**
   * Fetch tag suggestions from API
   */
  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const suggestionsData = await tagService.getSuggestions(contentId);
      
      // Filter out suggestions that are already applied
      const filteredSuggestions = suggestionsData.filter(
        suggestion => !currentTags.includes(suggestion.name)
      );
      
      setSuggestions(filteredSuggestions);
      setSelectedSuggestions([]);
    } catch (err) {
      console.error('Error fetching tag suggestions:', err);
      setError('Failed to load tag suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Toggle suggestion selection
   */
  const toggleSuggestion = (tagName: string) => {
    setSelectedSuggestions(prev => {
      if (prev.includes(tagName)) {
        return prev.filter(tag => tag !== tagName);
      } else {
        return [...prev, tagName];
      }
    });
  };
  
  /**
   * Apply selected suggestions
   */
  const applySelectedSuggestions = () => {
    if (selectedSuggestions.length > 0) {
      onAddMultipleTags(selectedSuggestions);
      setSelectedSuggestions([]);
      
      // Filter out applied suggestions
      setSuggestions(prev => 
        prev.filter(suggestion => !selectedSuggestions.includes(suggestion.name))
      );
    }
  };
  
  /**
   * Group suggestions by source
   */
  const groupedSuggestions = suggestions.reduce<Record<string, TagSuggestion[]>>((groups, suggestion) => {
    const source = suggestion.source;
    if (!groups[source]) {
      groups[source] = [];
    }
    groups[source].push(suggestion);
    return groups;
  }, {});
  
  /**
   * Get source display name
   */
  const getSourceDisplayName = (source: string): string => {
    switch (source) {
      case 'ai': return 'AI Analysis';
      case 'history': return 'Your History';
      case 'popular': return 'Popular Tags';
      case 'similar-content': return 'Similar Content';
      default: return source;
    }
  };
  
  /**
   * Get color for source
   */
  const getSourceColor = (source: string): string => {
    switch (source) {
      case 'ai': return '#2196f3'; // blue
      case 'history': return '#4caf50'; // green
      case 'popular': return '#ff9800'; // orange
      case 'similar-content': return '#9c27b0'; // purple
      default: return '#757575'; // gray
    }
  };
  
  /**
   * Render suggestions by source
   */
  const renderSuggestionsBySource = () => {
    return Object.entries(groupedSuggestions).map(([source, sourceSuggestions]) => (
      <Box key={source} sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography
            variant="subtitle1"
            sx={{ 
              color: getSourceColor(source),
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <LightbulbIcon sx={{ mr: 1 }} />
            {getSourceDisplayName(source)}
          </Typography>
          <Tooltip title={`These tags were suggested based on ${getSourceDisplayName(source).toLowerCase()}`}>
            <IconButton size="small">
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {sourceSuggestions.map(suggestion => (
            <Chip
              key={suggestion.name}
              label={suggestion.name}
              clickable
              onClick={() => toggleSuggestion(suggestion.name)}
              onDelete={() => onAddTag(suggestion.name)}
              deleteIcon={<AddIcon />}
              color={selectedSuggestions.includes(suggestion.name) ? 'primary' : 'default'}
              variant={selectedSuggestions.includes(suggestion.name) ? 'filled' : 'outlined'}
              sx={{ 
                '& .MuiChip-deleteIcon': {
                  color: selectedSuggestions.includes(suggestion.name) ? 'inherit' : getSourceColor(source)
                }
              }}
            />
          ))}
        </Box>
      </Box>
    ));
  };
  
  return (
    <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Tag Suggestions
        </Typography>
        
        <Box>
          <Tooltip title="Refresh Suggestions">
            <IconButton onClick={fetchSuggestions} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          {selectedSuggestions.length > 0 && (
            <Button
              startIcon={<CheckIcon />}
              variant="contained"
              size="small"
              onClick={applySelectedSuggestions}
            >
              Apply Selected ({selectedSuggestions.length})
            </Button>
          )}
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={30} />
        </Box>
      ) : suggestions.length > 0 ? (
        renderSuggestionsBySource()
      ) : (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="textSecondary">
            No suggestions available for this content
          </Typography>
          <Button
            startIcon={<RefreshIcon />}
            variant="outlined"
            size="small"
            onClick={fetchSuggestions}
            sx={{ mt: 1 }}
          >
            Refresh
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default TagSuggestionSystem; 