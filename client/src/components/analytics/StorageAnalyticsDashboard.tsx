import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Storage,
  CloudQueue,
  Speed,
  CheckCircle,
  Error,
  Warning,
  Info,
  Backup,
  NetworkCheck,
} from '@mui/icons-material';
import storageAnalyticsService, {
  StorageAnalyticsSummary,
  NodePerformanceMetrics,
  ContentReplicationStatus,
} from '../../services/storageAnalytics.service';
import MetricCard from './MetricCard';

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
      id={`storage-tabpanel-${index}`}
      aria-labelledby={`storage-tab-${index}`}
      {...other}
      style={{ paddingTop: '24px' }}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const StorageAnalyticsDashboard: React.FC = () => {
  const theme = useTheme();
  
  const [tabValue, setTabValue] = useState(0);
  const [analyticsSummary, setAnalyticsSummary] = useState<StorageAnalyticsSummary | null>(null);
  const [nodeMetrics, setNodeMetrics] = useState<NodePerformanceMetrics[]>([]);
  const [contentStatus, setContentStatus] = useState<ContentReplicationStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch analytics data on component mount
  useEffect(() => {
    fetchAnalyticsData();
    
    // Set up periodic refresh every 30 seconds
    const interval = setInterval(fetchAnalyticsData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setError(null);
      
      const [summary, nodes, content] = await Promise.all([
        storageAnalyticsService.getStorageAnalyticsSummary(),
        storageAnalyticsService.getNodePerformanceMetrics(),
        storageAnalyticsService.getContentReplicationStatus(),
      ]);

      setAnalyticsSummary(summary);
      setNodeMetrics(nodes);
      setContentStatus(content);
    } catch (err) {
      console.error('Error fetching storage analytics:', err);
      setError('Failed to load storage analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Chart colors
  const chartColors = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    success: theme.palette.success.main,
    error: theme.palette.error.main,
    warning: theme.palette.warning.main,
    info: theme.palette.info.main,
  };

  // Render overview metrics
  const renderOverviewMetrics = () => {
    if (!analyticsSummary) return null;

    const { overview, performance } = analyticsSummary;

    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="System Health"
            value={`${overview.systemHealth}%`}
            type="percentage"
            icon={<CheckCircle />}
            iconColor={overview.systemHealth > 80 ? chartColors.success : overview.systemHealth > 60 ? chartColors.warning : chartColors.error}
            tooltip="Overall system health score based on node and content status"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Healthy Nodes"
            value={`${overview.healthyNodes}/${overview.totalNodes}`}
            icon={<NetworkCheck />}
            iconColor={chartColors.primary}
            tooltip="Number of healthy IPFS nodes out of total nodes"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Content Health"
            value={`${overview.healthyContent}/${overview.totalContent}`}
            icon={<Storage />}
            iconColor={chartColors.info}
            tooltip="Number of properly replicated content items"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Avg Latency"
            value={`${performance.averageLatency}ms`}
            icon={<Speed />}
            iconColor={chartColors.secondary}
            tooltip="Average response latency across all nodes"
          />
        </Grid>
      </Grid>
    );
  };

  // Render system health trends
  const renderHealthTrends = () => {
    if (!analyticsSummary?.trends) return null;

    const nodeHealthData = analyticsSummary.trends.nodeHealth.map(point => ({
      time: new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      healthyNodes: point.healthyNodes,
      totalNodes: point.totalNodes,
      healthPercentage: (point.healthyNodes / point.totalNodes) * 100
    }));

    const contentHealthData = analyticsSummary.trends.contentHealth.map(point => ({
      time: new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      healthyContent: point.healthyContent,
      totalContent: point.totalContent,
      healthPercentage: (point.healthyContent / point.totalContent) * 100
    }));

    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Node Health Trends (24h)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={nodeHealthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Health']} />
                  <Line
                    type="monotone"
                    dataKey="healthPercentage"
                    stroke={chartColors.primary}
                    strokeWidth={2}
                    dot={false}
                    name="Node Health %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Content Health Trends (24h)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={contentHealthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Health']} />
                  <Line
                    type="monotone"
                    dataKey="healthPercentage"
                    stroke={chartColors.success}
                    strokeWidth={2}
                    dot={false}
                    name="Content Health %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Render node performance table
  const renderNodePerformance = () => {
    if (!nodeMetrics.length) return null;

    return (
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Node Performance Details
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Node ID</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Latency</TableCell>
                  <TableCell>Uptime</TableCell>
                  <TableCell>Throughput</TableCell>
                  <TableCell>Error Rate</TableCell>
                  <TableCell>Peers</TableCell>
                  <TableCell>Storage</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {nodeMetrics.map((node) => (
                  <TableRow key={node.nodeId}>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {node.nodeId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={node.health.isHealthy ? 'Healthy' : 'Unhealthy'}
                        color={node.health.isHealthy ? 'success' : 'error'}
                        icon={node.health.isHealthy ? <CheckCircle /> : <Error />}
                      />
                    </TableCell>
                    <TableCell>
                      {node.performance.latency === Infinity ? 'N/A' : `${Math.round(node.performance.latency)}ms`}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={node.performance.uptime}
                          sx={{ width: 60, height: 6 }}
                          color={node.performance.uptime > 95 ? 'success' : node.performance.uptime > 90 ? 'warning' : 'error'}
                        />
                        <Typography variant="body2">
                          {node.performance.uptime.toFixed(1)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {node.performance.throughput.toFixed(1)} MB/s
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color={node.performance.errorRate < 2 ? 'success.main' : node.performance.errorRate < 5 ? 'warning.main' : 'error.main'}
                      >
                        {node.performance.errorRate.toFixed(1)}%
                      </Typography>
                    </TableCell>
                    <TableCell>{node.storage.peerCount}</TableCell>
                    <TableCell>
                      {node.storage.repoSize > 0 ? `${(node.storage.repoSize / 1024 / 1024 / 1024).toFixed(1)} GB` : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  // Render content replication status
  const renderContentReplication = () => {
    if (!contentStatus.length) return null;

    const statusCounts = contentStatus.reduce((acc, content) => {
      acc[content.status] = (acc[content.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const pieData = Object.entries(statusCounts).map(([status, count]) => ({
      name: status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: count,
      color: status === 'healthy' ? chartColors.success :
             status === 'under-replicated' ? chartColors.warning :
             status === 'over-replicated' ? chartColors.info :
             chartColors.error
    }));

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Content Status Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Content Replication Details
              </Typography>
              <TableContainer sx={{ maxHeight: 300 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Content ID</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Replicas</TableCell>
                      <TableCell>Target</TableCell>
                      <TableCell>Available Nodes</TableCell>
                      <TableCell>Last Checked</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contentStatus.slice(0, 10).map((content) => (
                      <TableRow key={content.cid}>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {content.cid.slice(0, 12)}...
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={content.status.replace('-', ' ')}
                            color={
                              content.status === 'healthy' ? 'success' :
                              content.status === 'under-replicated' ? 'warning' :
                              content.status === 'over-replicated' ? 'info' :
                              'error'
                            }
                          />
                        </TableCell>
                        <TableCell>{content.replicationFactor}</TableCell>
                        <TableCell>{content.targetReplicas}</TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {content.availableNodes.join(', ')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(content.lastChecked).toLocaleTimeString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Render loading state
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Storage Analytics
        </Typography>
        <Chip
          label={`Last updated: ${new Date().toLocaleTimeString()}`}
          color="primary"
          variant="outlined"
          size="small"
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Overview" />
          <Tab label="Node Performance" />
          <Tab label="Content Replication" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {renderOverviewMetrics()}
          {renderHealthTrends()}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {renderNodePerformance()}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {renderContentReplication()}
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default StorageAnalyticsDashboard; 