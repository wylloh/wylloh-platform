import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Card,
  CardMedia,
  CardContent,
  Grid,
  useMediaQuery,
  useTheme,
  Divider,
} from '@mui/material';
import {
  Article as ArticleIcon,
  OpenInNew as OpenInNewIcon,
  Info as InfoIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Transaction, transactionService } from '../../services/transaction.service';
import { formatAddress, getBlockchainExplorerUrl } from '../../utils/blockchainDataUtils';

interface TransactionHistoryProps {
  userId?: string; // Optional user ID, defaults to current user
  contentId?: string; // Optional content ID to filter transactions
  compact?: boolean; // Whether to use compact view
  maxItems?: number; // Max number of items to display
  transactions?: Transaction[]; // Optional transactions to display (if not provided, will fetch from API)
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  userId,
  contentId,
  compact = false,
  maxItems,
  transactions: propTransactions,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(propTransactions ? false : true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Tab options
  const tabs = [
    { label: 'All Transactions', value: 'all' },
    { label: 'Purchases', value: 'purchase' },
    { label: 'Sales', value: 'sale' },
    { label: 'Lending', value: 'lend,borrow,return' },
  ];
  
  useEffect(() => {
    // If transactions are provided as a prop, use them directly
    if (propTransactions) {
      setTransactions(propTransactions);
      setLoading(false);
      return;
    }
    
    // Otherwise fetch them from the API
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        
        let data: Transaction[];
        if (contentId) {
          data = await transactionService.getContentTransactions(contentId);
        } else {
          data = await transactionService.getAllTransactions();
        }
        
        // Sort by date descending (newest first)
        data.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
        
        // Limit if maxItems specified
        if (maxItems && data.length > maxItems) {
          data = data.slice(0, maxItems);
        }
        
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
  }, [contentId, maxItems, propTransactions]);
  
  const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Filter transactions based on selected tab
  const getFilteredTransactions = () => {
    const tabFilter = tabs[tabValue].value;
    
    if (tabFilter === 'all') {
      return transactions;
    }
    
    const transactionTypes = tabFilter.split(',');
    return transactions.filter(tx => transactionTypes.includes(tx.transactionType));
  };
  
  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  };
  
  // Get color for transaction type chip
  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'primary';
      case 'sale':
        return 'success';
      case 'lend':
        return 'info';
      case 'borrow':
        return 'secondary';
      case 'return':
        return 'warning';
      default:
        return 'default';
    }
  };
  
  // Get label for transaction type
  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'Purchased';
      case 'sale':
        return 'Sold';
      case 'lend':
        return 'Lent Out';
      case 'borrow':
        return 'Borrowed';
      case 'return':
        return 'Returned';
      default:
        return type;
    }
  };
  
  // Card view for mobile or compact mode
  const renderCardView = () => {
    const filteredTransactions = getFilteredTransactions();
    
    if (filteredTransactions.length === 0) {
      return (
        <Box p={3} textAlign="center">
          <Typography variant="body1" color="text.secondary">
            No transactions found.
          </Typography>
        </Box>
      );
    }
    
    return (
      <Grid container spacing={2}>
        {filteredTransactions.map((transaction) => (
          <Grid item xs={12} key={transaction.id}>
            <Card sx={{ display: 'flex', height: '100%' }}>
              <CardMedia
                component="img"
                sx={{ width: 100, height: '100%', objectFit: 'cover' }}
                image={transaction.thumbnailUrl}
                alt={transaction.contentTitle}
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <CardContent sx={{ flex: '1 0 auto', py: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Typography component="div" variant="subtitle1" noWrap>
                      {transaction.contentTitle}
                    </Typography>
                    <Chip
                      label={getTransactionTypeLabel(transaction.transactionType)}
                      color={getTransactionTypeColor(transaction.transactionType) as any}
                      size="small"
                    />
                  </Box>
                  
                  <Box mt={1}>
                    <Typography variant="body2" color="text.secondary" component="div">
                      {formatDate(transaction.transactionDate)} • {transaction.platform}
                    </Typography>
                    <Typography variant="body2" component="div" fontWeight="bold">
                      {formatCurrency(transaction.transactionValue)}
                    </Typography>
                  </Box>
                  
                  {transaction.blockchain && (
                    <Box mt={1} display="flex" alignItems="center" gap={1}>
                      <Chip 
                        label={transaction.blockchain} 
                        size="small" 
                        variant="outlined"
                      />
                      {transaction.blockchainTxHash && (
                        <Tooltip title="View on blockchain explorer">
                          <IconButton
                            size="small"
                            href={getBlockchainExplorerUrl(
                              transaction.blockchain, 
                              transaction.contractAddress || '',
                              transaction.tokenId
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };
  
  // Table view for desktop
  const renderTableView = () => {
    const filteredTransactions = getFilteredTransactions();
    
    if (filteredTransactions.length === 0) {
      return (
        <Box p={3} textAlign="center">
          <Typography variant="body1" color="text.secondary">
            No transactions found.
          </Typography>
        </Box>
      );
    }
    
    return (
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="transaction history">
          <TableHead>
            <TableRow>
              <TableCell>Content</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Platform</TableCell>
              <TableCell>Blockchain</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTransactions.map((transaction) => (
              <TableRow
                key={transaction.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      component="img"
                      sx={{
                        width: 40,
                        height: 40,
                        objectFit: 'cover',
                        borderRadius: 1,
                      }}
                      src={transaction.thumbnailUrl}
                      alt={transaction.contentTitle}
                    />
                    <Typography variant="body2">{transaction.contentTitle}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getTransactionTypeLabel(transaction.transactionType)}
                    color={getTransactionTypeColor(transaction.transactionType) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>{formatDate(transaction.transactionDate)}</TableCell>
                <TableCell>{formatCurrency(transaction.transactionValue)}</TableCell>
                <TableCell>{transaction.platform}</TableCell>
                <TableCell>
                  {transaction.blockchain && (
                    <Chip label={transaction.blockchain} size="small" variant="outlined" />
                  )}
                </TableCell>
                <TableCell>
                  {transaction.blockchainTxHash && (
                    <Tooltip title="View on blockchain explorer">
                      <IconButton
                        size="small"
                        href={getBlockchainExplorerUrl(
                          transaction.blockchain || '', 
                          transaction.contractAddress || '',
                          transaction.tokenId
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }
  
  return (
    <Box>
      {!compact && (
        <Paper sx={{ mb: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleChangeTab}
            indicatorColor="primary"
            textColor="primary"
          >
            {tabs.map((tab, index) => (
              <Tab key={index} label={tab.label} sx={{ minWidth: 'auto' }} />
            ))}
          </Tabs>
        </Paper>
      )}
      
      {(isMobile || compact) ? renderCardView() : renderTableView()}
    </Box>
  );
};

export default TransactionHistory; 