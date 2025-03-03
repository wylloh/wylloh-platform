import React from 'react';
import {
  Paper,
  Typography,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  Chip
} from '@mui/material';

interface FilterPanelProps {
  selectedContentType: string;
  selectedSort: string;
  onContentTypeChange: (type: string) => void;
  onSortChange: (sort: string) => void;
}

// Content type options
const contentTypes = [
  { value: '', label: 'All Types' },
  { value: 'movie', label: 'Movies' },
  { value: 'series', label: 'Series' },
  { value: 'short', label: 'Short Films' },
  { value: 'music', label: 'Music' },
  { value: 'podcast', label: 'Podcasts' },
  { value: 'ebook', label: 'E-Books' },
  { value: 'art', label: 'Art' },
];

// Sort options
const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'priceAsc', label: 'Price: Low to High' },
  { value: 'priceDesc', label: 'Price: High to Low' },
];

const FilterPanel: React.FC<FilterPanelProps> = ({
  selectedContentType,
  selectedSort,
  onContentTypeChange,
  onSortChange
}) => {
  // Handle content type change
  const handleContentTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onContentTypeChange(event.target.value);
  };

  // Handle sort change
  const handleSortChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSortChange(event.target.value);
  };

  // Handle chip selection
  const handleChipClick = (type: string) => {
    onContentTypeChange(type === selectedContentType ? '' : type);
  };

  return (
    <Paper elevation={1} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Filters
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Content Type Filter - Chip version */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Content Type
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {contentTypes.map((type) => (
            <Chip
              key={type.value}
              label={type.label}
              clickable
              onClick={() => handleChipClick(type.value)}
              color={type.value === selectedContentType ? 'primary' : 'default'}
              variant={type.value === selectedContentType ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Sort Options */}
      <FormControl component="fieldset">
        <FormLabel component="legend">Sort By</FormLabel>
        <RadioGroup 
          value={selectedSort} 
          onChange={handleSortChange}
        >
          {sortOptions.map((option) => (
            <FormControlLabel
              key={option.value}
              value={option.value}
              control={<Radio size="small" />}
              label={option.label}
            />
          ))}
        </RadioGroup>
      </FormControl>
      
      {/* Price Range Filter could be added here */}
      
      {/* Other filters could be added here */}
    </Paper>
  );
};

export default FilterPanel;