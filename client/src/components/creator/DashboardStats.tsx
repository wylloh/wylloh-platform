import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Button,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Dashboard as DashboardIcon,
  InsertChart as InsertChartIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

interface StatsSummary {
  totalContent: number;
  activeContent: number;
  tokenizedContent: number;
  totalViews: number;
  totalSales: number;
  estimatedRevenue: number;
}

interface DashboardStatsProps {
  stats: StatsSummary;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={4}>
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h6" color="text.secondary">
              Content Stats
            </Typography>
            <DashboardIcon color="primary" />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Total Content
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {stats.totalContent}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Active Content
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {stats.activeContent}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Tokenized
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {stats.tokenizedContent}
            </Typography>
          </Box>
        </Paper>
      </Grid>
      
      <Grid item xs={12} sm={6} md={4}>
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h6" color="text.secondary">
              Performance
            </Typography>
            <InsertChartIcon color="primary" />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Total Views
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {stats.totalViews}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Total Sales
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {stats.totalSales}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Revenue (est.)
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {stats.estimatedRevenue.toFixed(2)} USDC
            </Typography>
          </Box>
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140, justifyContent: 'center', alignItems: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<CloudUploadIcon />}
            component={Link}
            to="/creator/upload"
            sx={{ width: '80%', mb: 2 }}
          >
            Upload New Content
          </Button>
          
          <Button
            variant="outlined"
            component={Link}
            to="/marketplace"
            sx={{ width: '80%' }}
          >
            View Marketplace
          </Button>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default DashboardStats;