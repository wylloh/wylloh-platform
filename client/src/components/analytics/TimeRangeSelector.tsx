import React from 'react';
import { 
  Box, 
  Button, 
  ButtonGroup, 
  useMediaQuery, 
  useTheme, 
  Menu, 
  MenuItem,
  IconButton
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export type TimeRange = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  availableRanges?: TimeRange[];
  size?: 'small' | 'medium' | 'large';
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'primary' | 'secondary' | 'inherit';
}

/**
 * A consistent time range selector for all analytics components
 */
const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  value,
  onChange,
  availableRanges = ['day', 'week', 'month', 'quarter', 'year', 'all'],
  size = 'small',
  variant = 'outlined',
  color = 'primary'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const rangeLabels: Record<TimeRange, string> = {
    day: '24h',
    week: '7d',
    month: '30d',
    quarter: '90d',
    year: '1y',
    all: 'All'
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isMobile) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleRangeChange = (range: TimeRange) => {
    onChange(range);
    handleClose();
  };

  // Mobile dropdown menu
  if (isMobile) {
    return (
      <Box>
        <Button
          variant={variant}
          color={color}
          size={size}
          endIcon={<ExpandMoreIcon />}
          onClick={handleClick}
        >
          {rangeLabels[value]}
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          {availableRanges.map((range) => (
            <MenuItem
              key={range}
              onClick={() => handleRangeChange(range)}
              selected={value === range}
            >
              {rangeLabels[range]}
            </MenuItem>
          ))}
        </Menu>
      </Box>
    );
  }

  // Desktop button group
  return (
    <ButtonGroup variant={variant} size={size} color={color}>
      {availableRanges.map((range) => (
        <Button
          key={range}
          onClick={() => onChange(range)}
          variant={value === range ? 'contained' : variant}
          color={value === range ? color : 'inherit'}
        >
          {rangeLabels[range]}
        </Button>
      ))}
    </ButtonGroup>
  );
};

export default TimeRangeSelector; 