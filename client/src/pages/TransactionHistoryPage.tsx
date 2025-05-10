import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  FilterList as FilterListIcon,
  Search as SearchIcon,
  CalendarToday as CalendarTodayIcon,
  SortByAlpha as SortByAlphaIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Transaction, transactionService } from '../services/transaction.service';
import TransactionHistory from '../components/transactions/TransactionHistory';

const TransactionHistoryPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [filterOpen, setFilterOpen] = useState(!isMobile);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<{start?: string; end?: string}>({});
  const [blockchain, setBlockchain] = useState<string>('');
  const [transactionType, setTransactionType] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('date_desc');
  
  // Tab options
  const tabs = [
    { label: 'All Transactions', value: 'all' },
    { label: 'Current Ownership', value: 'current' },
    { label: 'Previous Ownership', value: 'previous' },
  ];
  
  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        
        // Get all transactions
        const data = await transactionService.getAllTransactions();
        
        // Apply sorting
        sortTransactions(data, sortBy);
        
        setTransactions(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while fetching transactions');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, [sortBy]);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Toggle filter panel
  const toggleFilter = () => {
    setFilterOpen(!filterOpen);
  };
  
  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setDateRange({});
    setBlockchain('');
    setTransactionType('');
  };
  
  // Sort transactions
  const sortTransactions = (data: Transaction[], sortOption: string) => {
    switch (sortOption) {
      case 'date_asc':
        return data.sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime());
      case 'date_desc':
        return data.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
      case 'value_asc':
        return data.sort((a, b) => a.transactionValue - b.transactionValue);
      case 'value_desc':
        return data.sort((a, b) => b.transactionValue - a.transactionValue);
      case 'title_asc':
        return data.sort((a, b) => a.contentTitle.localeCompare(b.contentTitle));
      case 'title_desc':
        return data.sort((a, b) => b.contentTitle.localeCompare(a.contentTitle));
      default:
        return data;
    }
  };
  
  // Get filtered and sorted transactions
  const getFilteredTransactions = () => {
    // First filter by tab selection
    let filtered = [...transactions];
    
    if (tabs[tabValue].value === 'current') {
      // Show only items that were purchased and not sold
      const soldContentIds = new Set(
        transactions
          .filter(tx => tx.transactionType === 'sale')
          .map(tx => tx.contentId)
      );
      
      filtered = transactions.filter(tx => 
        tx.transactionType === 'purchase' && !soldContentIds.has(tx.contentId)
      );
    } else if (tabs[tabValue].value === 'previous') {
      // Show only items that were purchased and later sold
      const soldContentIds = new Set(
        transactions
          .filter(tx => tx.transactionType === 'sale')
          .map(tx => tx.contentId)
      );
      
      filtered = transactions.filter(tx => 
        (tx.transactionType === 'purchase' || tx.transactionType === 'sale') 
        && soldContentIds.has(tx.contentId)
      );
    }
    
    // Then apply additional filters
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.contentTitle.toLowerCase().includes(search) ||
        tx.contentId.toLowerCase().includes(search) ||
        (tx.counterpartyName && tx.counterpartyName.toLowerCase().includes(search))
      );
    }
    
    if (blockchain) {
      filtered = filtered.filter(tx => tx.blockchain === blockchain);
    }
    
    if (transactionType) {
      filtered = filtered.filter(tx => tx.transactionType === transactionType);
    }
    
    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      filtered = filtered.filter(tx => new Date(tx.transactionDate) >= startDate);
    }
    
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(tx => new Date(tx.transactionDate) <= endDate);
    }
    
    return filtered;
  };
  
  // Available blockchains from transactions
  const getAvailableBlockchains = () => {
    const blockchains = new Set<string>();
    transactions.forEach(tx => {
      if (tx.blockchain) blockchains.add(tx.blockchain);
    });
    return Array.from(blockchains);
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Transaction History
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Paper>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            {tabs.map((tab, index) => (
              <Tab key={index} label={tab.label} />
            ))}
          </Tabs>
        </Paper>
      </Box>
      
      <Grid container spacing={3}>
        {/* Filter Panel */}
        {filterOpen && (
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Filters</Typography>
                {isMobile && (
                  <IconButton onClick={toggleFilter}>
                    <CloseIcon />
                  </IconButton>
                )}
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              <Box mb={2}>
                <TextField
                  label="Search"
                  fullWidth
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              
              <Box mb={2}>
                <FormControl fullWidth>
                  <InputLabel>Transaction Type</InputLabel>
                  <Select
                    value={transactionType}
                    label="Transaction Type"
                    onChange={(e) => setTransactionType(e.target.value)}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="purchase">Purchase</MenuItem>
                    <MenuItem value="sale">Sale</MenuItem>
                    <MenuItem value="lend">Lending</MenuItem>
                    <MenuItem value="borrow">Borrowing</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              <Box mb={2}>
                <FormControl fullWidth>
                  <InputLabel>Blockchain</InputLabel>
                  <Select
                    value={blockchain}
                    label="Blockchain"
                    onChange={(e) => setBlockchain(e.target.value)}
                  >
                    <MenuItem value="">All Blockchains</MenuItem>
                    {getAvailableBlockchains().map(chain => (
                      <MenuItem key={chain} value={chain}>{chain}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Date Range
                </Typography>
                <TextField
                  label="From"
                  type="date"
                  fullWidth
                  margin="dense"
                  value={dateRange.start || ''}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="To"
                  type="date"
                  fullWidth
                  margin="dense"
                  value={dateRange.end || ''}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
              
              <Box mb={2}>
                <FormControl fullWidth>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort By"
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <MenuItem value="date_desc">Newest First</MenuItem>
                    <MenuItem value="date_asc">Oldest First</MenuItem>
                    <MenuItem value="value_desc">Highest Value</MenuItem>
                    <MenuItem value="value_asc">Lowest Value</MenuItem>
                    <MenuItem value="title_asc">Title A-Z</MenuItem>
                    <MenuItem value="title_desc">Title Z-A</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              <Button 
                fullWidth 
                variant="outlined" 
                onClick={resetFilters}
                startIcon={<CloseIcon />}
              >
                Clear Filters
              </Button>
            </Paper>
          </Grid>
        )}
        
        {/* Main Content */}
        <Grid item xs={12} md={filterOpen ? 9 : 12}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              {tabs[tabValue].label}
              {!loading && (
                <Chip 
                  label={`${getFilteredTransactions().length} items`} 
                  size="small" 
                  sx={{ ml: 1 }}
                />
              )}
            </Typography>
            
            {!filterOpen && (
              <Button
                startIcon={<FilterListIcon />}
                onClick={toggleFilter}
                variant="outlined"
                size="small"
              >
                Filters
              </Button>
            )}
          </Box>
          
          {loading ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : getFilteredTransactions().length === 0 ? (
            <Alert severity="info">
              No transactions found matching your criteria.
            </Alert>
          ) : (
            <TransactionHistory 
              transactions={getFilteredTransactions()} 
              compact={false}
            />
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default TransactionHistoryPage; 