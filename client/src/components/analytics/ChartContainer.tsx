import React, { ReactNode } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  CircularProgress, 
  Alert, 
  Skeleton, 
  useTheme,
  Tooltip,
  IconButton
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import FullscreenIcon from '@mui/icons-material/Fullscreen';

interface ChartContainerProps {
  title: string;
  description?: string;
  height?: number | string;
  width?: number | string;
  loading?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  children: ReactNode;
  onFullscreen?: () => void;
}

/**
 * A consistent container for all chart components
 * Handles loading states, errors, and empty data scenarios
 */
const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  description,
  height = 300,
  width = '100%',
  loading = false,
  error = null,
  isEmpty = false,
  emptyMessage = 'No data available for this chart',
  children,
  onFullscreen
}) => {
  const theme = useTheme();

  const renderContent = () => {
    if (loading) {
      return (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            minHeight: 200
          }}
        >
          <CircularProgress size={40} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading chart data...
          </Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      );
    }

    if (isEmpty) {
      return (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            minHeight: 200
          }}
        >
          <Typography variant="body1" color="text.secondary">
            {emptyMessage}
          </Typography>
        </Box>
      );
    }

    return children;
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 2, 
        height, 
        width, 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" component="h3">
            {title}
          </Typography>
          
          {description && (
            <Tooltip title={description} arrow placement="top">
              <IconButton size="small" sx={{ ml: 0.5 }}>
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        
        {onFullscreen && (
          <IconButton onClick={onFullscreen} size="small">
            <FullscreenIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
      
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {renderContent()}
      </Box>
    </Paper>
  );
};

export default ChartContainer; 