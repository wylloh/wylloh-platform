import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  InputAdornment, 
  IconButton, 
  Paper, 
  Box 
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Clear as ClearIcon 
} from '@mui/icons-material';

interface SearchBarProps {
  initialValue?: string;
  placeholder?: string;
  onSearch: (query: string) => void;
  fullWidth?: boolean;
  autoFocus?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  initialValue = '',
  placeholder = 'Search...',
  onSearch,
  fullWidth = true,
  autoFocus = false
}) => {
  const [searchTerm, setSearchTerm] = useState<string>(initialValue);
  
  // Update search term when initialValue changes (e.g., when URL params change)
  useEffect(() => {
    setSearchTerm(initialValue);
  }, [initialValue]);

  // Handle input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Handle clear button
  const handleClearSearch = () => {
    setSearchTerm('');
    onSearch('');
  };

  // Handle form submission
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSearch(searchTerm.trim());
  };

  // Handle keypress events
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      onSearch(searchTerm.trim());
    }
  };

  return (
    <Paper
      component="form"
      elevation={1}
      onSubmit={handleSubmit}
      sx={{
        p: '2px 4px',
        display: 'flex',
        alignItems: 'center',
        width: fullWidth ? '100%' : 'auto'
      }}
    >
      <TextField
        fullWidth
        variant="standard"
        value={searchTerm}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        autoFocus={autoFocus}
        InputProps={{
          disableUnderline: true,
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: searchTerm ? (
            <InputAdornment position="end">
              <IconButton
                aria-label="clear search"
                onClick={handleClearSearch}
                edge="end"
                size="small"
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null
        }}
        sx={{ ml: 1, flex: 1 }}
      />
      <Box component="input" type="submit" sx={{ display: 'none' }} />
    </Paper>
  );
};

export default SearchBar;