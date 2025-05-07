import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Button,
  useTheme
} from '@mui/material';
import {
  Movie as MovieIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box
          sx={{
            backgroundColor: `${color}15`,
            borderRadius: '50%',
            p: 1,
            mr: 2
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const DashboardPage: React.FC = () => {
  const theme = useTheme();

  // TODO: Replace with actual data fetching
  const stats = {
    totalContent: 0,
    activeUsers: 0,
    totalRevenue: '$0',
    growthRate: '0%'
  };

  return (
    <AdminLayout>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h4" sx={{ mb: 4 }}>
          Dashboard
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Content"
              value={stats.totalContent}
              icon={<MovieIcon sx={{ color: theme.palette.primary.main }} />}
              color={theme.palette.primary.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Users"
              value={stats.activeUsers}
              icon={<PeopleIcon sx={{ color: theme.palette.success.main }} />}
              color={theme.palette.success.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Revenue"
              value={stats.totalRevenue}
              icon={<MoneyIcon sx={{ color: theme.palette.warning.main }} />}
              color={theme.palette.warning.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Growth Rate"
              value={stats.growthRate}
              icon={<TrendingUpIcon sx={{ color: theme.palette.info.main }} />}
              color={theme.palette.info.main}
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button
                    component={Link}
                    to="/admin/featured-content"
                    variant="contained"
                    fullWidth
                    startIcon={<MovieIcon />}
                  >
                    Manage Featured Content
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    component={Link}
                    to="/admin/users"
                    variant="contained"
                    fullWidth
                    startIcon={<PeopleIcon />}
                  >
                    Manage Users
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Recent Activity
              </Typography>
              <Typography color="text.secondary">
                No recent activity to display
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </AdminLayout>
  );
};

export default DashboardPage; 