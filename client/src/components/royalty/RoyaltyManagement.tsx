import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
  Divider,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccountBalanceWallet as WalletIcon,
  TrendingUp as TrendingUpIcon,
  History as HistoryIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import RoyaltyService, { RoyaltyRecipient, RoyaltyDistribution, RoyaltyBalance } from '../../services/royalty.service';

interface RoyaltyManagementProps {
  tokenContract: string;
  tokenId: string;
  userAddress: string;
  onTransactionSubmitted?: (txHash: string) => void;
  onError?: (error: string) => void;
}

interface RecipientFormData {
  address: string;
  sharePercentage: number;
  name: string;
  role: string;
}

const RoyaltyManagement: React.FC<RoyaltyManagementProps> = ({
  tokenContract,
  tokenId,
  userAddress,
  onTransactionSubmitted,
  onError
}) => {
  const [recipients, setRecipients] = useState<RoyaltyRecipient[]>([]);
  const [distributions, setDistributions] = useState<RoyaltyDistribution[]>([]);
  const [userBalance, setUserBalance] = useState<RoyaltyBalance | null>(null);
  const [totalShares, setTotalShares] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [distributionDialogOpen, setDistributionDialogOpen] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState<RecipientFormData>({
    address: '',
    sharePercentage: 0,
    name: '',
    role: 'Collaborator'
  });
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [distributionAmount, setDistributionAmount] = useState('');
  
  // Alert states
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const royaltyService = new RoyaltyService();

  useEffect(() => {
    loadData();
  }, [tokenContract, tokenId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load recipients and shares
      const recipientsData = await royaltyService.getRoyaltyRecipients(tokenContract, tokenId);
      setRecipients(recipientsData.recipients);
      setTotalShares(recipientsData.totalShares);
      
      // Load distribution history
      const historyData = await royaltyService.getDistributionHistory(tokenContract, tokenId);
      setDistributions(historyData.distributions);
      
      // Load user balance if they have an address
      if (userAddress) {
        try {
          const balance = await royaltyService.getRecipientBalance(userAddress);
          setUserBalance(balance);
        } catch (error) {
          // User might not be a recipient, which is fine
          setUserBalance(null);
        }
      }
    } catch (error) {
      console.error('Error loading royalty data:', error);
      setAlert({ type: 'error', message: 'Failed to load royalty data' });
      onError?.('Failed to load royalty data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecipient = async () => {
    if (!formData.address || formData.sharePercentage <= 0) {
      setAlert({ type: 'error', message: 'Please fill in all required fields' });
      return;
    }

    if (!RoyaltyService.isValidEthereumAddress(formData.address)) {
      setAlert({ type: 'error', message: 'Invalid Ethereum address format' });
      return;
    }

    if (totalShares + RoyaltyService.percentageToBasisPoints(formData.sharePercentage) > 10000) {
      setAlert({ type: 'error', message: 'Total royalty shares would exceed 100%' });
      return;
    }

    try {
      setSubmitting(true);
      
      const recipient: RoyaltyRecipient = {
        address: formData.address,
        sharePercentage: RoyaltyService.percentageToBasisPoints(formData.sharePercentage),
        name: formData.name,
        role: formData.role
      };

      // Note: In a real implementation, you'd get the private key from a secure wallet connection
      const result = await royaltyService.addRoyaltyRecipient(
        tokenContract,
        tokenId,
        recipient,
        'PLACEHOLDER_PRIVATE_KEY' // This should come from wallet integration
      );

      setAlert({ type: 'success', message: 'Royalty recipient added successfully!' });
      onTransactionSubmitted?.(result.transactionHash);
      setAddDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error adding recipient:', error);
      setAlert({ type: 'error', message: 'Failed to add royalty recipient' });
      onError?.('Failed to add royalty recipient');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditRecipient = async () => {
    if (editingIndex < 0 || formData.sharePercentage <= 0) {
      setAlert({ type: 'error', message: 'Invalid recipient data' });
      return;
    }

    try {
      setSubmitting(true);
      
      const result = await royaltyService.updateRoyaltyRecipient(
        tokenContract,
        tokenId,
        editingIndex,
        RoyaltyService.percentageToBasisPoints(formData.sharePercentage),
        'PLACEHOLDER_PRIVATE_KEY' // This should come from wallet integration
      );

      setAlert({ type: 'success', message: 'Royalty recipient updated successfully!' });
      onTransactionSubmitted?.(result.transactionHash);
      setEditDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error updating recipient:', error);
      setAlert({ type: 'error', message: 'Failed to update royalty recipient' });
      onError?.('Failed to update royalty recipient');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveRecipient = async (index: number) => {
    if (!window.confirm('Are you sure you want to remove this royalty recipient?')) {
      return;
    }

    try {
      setSubmitting(true);
      
      const result = await royaltyService.removeRoyaltyRecipient(
        tokenContract,
        tokenId,
        index,
        'PLACEHOLDER_PRIVATE_KEY' // This should come from wallet integration
      );

      setAlert({ type: 'success', message: 'Royalty recipient removed successfully!' });
      onTransactionSubmitted?.(result.transactionHash);
      loadData();
    } catch (error) {
      console.error('Error removing recipient:', error);
      setAlert({ type: 'error', message: 'Failed to remove royalty recipient' });
      onError?.('Failed to remove royalty recipient');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDistributeRoyalties = async () => {
    if (!distributionAmount || parseFloat(distributionAmount) <= 0) {
      setAlert({ type: 'error', message: 'Please enter a valid distribution amount' });
      return;
    }

    try {
      setSubmitting(true);
      
      const result = await royaltyService.distributeRoyalties(
        tokenContract,
        tokenId,
        distributionAmount,
        'PLACEHOLDER_PRIVATE_KEY' // This should come from wallet integration
      );

      setAlert({ type: 'success', message: 'Royalties distributed successfully!' });
      onTransactionSubmitted?.(result.transactionHash);
      setDistributionDialogOpen(false);
      setDistributionAmount('');
      loadData();
    } catch (error) {
      console.error('Error distributing royalties:', error);
      setAlert({ type: 'error', message: 'Failed to distribute royalties' });
      onError?.('Failed to distribute royalties');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdrawRoyalties = async () => {
    if (!userBalance || parseFloat(userBalance.balanceETH) <= 0) {
      setAlert({ type: 'error', message: 'No funds available for withdrawal' });
      return;
    }

    try {
      setSubmitting(true);
      
      const result = await royaltyService.withdrawRoyalties(
        'PLACEHOLDER_PRIVATE_KEY' // This should come from wallet integration
      );

      setAlert({ type: 'success', message: `Successfully withdrew ${result.amount} ETH!` });
      onTransactionSubmitted?.(result.transactionHash);
      setWithdrawDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error withdrawing royalties:', error);
      setAlert({ type: 'error', message: 'Failed to withdraw royalties' });
      onError?.('Failed to withdraw royalties');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (index: number) => {
    const recipient = recipients[index];
    setFormData({
      address: recipient.address,
      sharePercentage: RoyaltyService.basisPointsToPercentage(recipient.sharePercentage),
      name: recipient.name || '',
      role: recipient.role || 'Collaborator'
    });
    setEditingIndex(index);
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      address: '',
      sharePercentage: 0,
      name: '',
      role: 'Collaborator'
    });
    setEditingIndex(-1);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const remainingPercentage = (10000 - totalShares) / 100;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {alert && (
        <Alert 
          severity={alert.type} 
          onClose={() => setAlert(null)}
          sx={{ mb: 2 }}
        >
          {alert.message}
        </Alert>
      )}

      {/* Header with actions */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Royalty Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<TrendingUpIcon />}
            onClick={() => setDistributionDialogOpen(true)}
            sx={{ mr: 1 }}
            disabled={recipients.length === 0}
          >
            Distribute
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
            disabled={remainingPercentage <= 0}
          >
            Add Recipient
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Recipients
              </Typography>
              <Typography variant="h4">
                {recipients.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Allocated Shares
              </Typography>
              <Typography variant="h4">
                {(totalShares / 100).toFixed(1)}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(totalShares / 10000) * 100} 
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Distributions
              </Typography>
              <Typography variant="h4">
                {distributions.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Your Balance
              </Typography>
              <Typography variant="h4">
                {userBalance ? RoyaltyService.formatETH(userBalance.balanceETH) : '0 ETH'}
              </Typography>
              {userBalance && parseFloat(userBalance.balanceETH) > 0 && (
                <Button
                  size="small"
                  startIcon={<WalletIcon />}
                  onClick={() => setWithdrawDialogOpen(true)}
                  sx={{ mt: 1 }}
                >
                  Withdraw
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recipients Table */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Royalty Recipients
          </Typography>
          {recipients.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography color="textSecondary">
                No royalty recipients configured yet.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setAddDialogOpen(true)}
                sx={{ mt: 2 }}
              >
                Add First Recipient
              </Button>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Address</TableCell>
                    <TableCell>Name/Role</TableCell>
                    <TableCell align="right">Share %</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recipients.map((recipient, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Tooltip title={recipient.address}>
                          <Typography variant="body2" fontFamily="monospace">
                            {formatAddress(recipient.address)}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {recipient.name || 'Unnamed'}
                          </Typography>
                          <Chip 
                            label={recipient.role || 'Collaborator'} 
                            size="small" 
                            variant="outlined"
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          {RoyaltyService.basisPointsToPercentage(recipient.sharePercentage).toFixed(2)}%
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => openEditDialog(index)}
                          disabled={submitting}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveRecipient(index)}
                          disabled={submitting}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Distribution History */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Distribution History
          </Typography>
          {distributions.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography color="textSecondary">
                No distributions yet.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Recipients</TableCell>
                    <TableCell>Transaction</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {distributions.slice(0, 10).map((distribution, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {formatDate(distribution.timestamp)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {RoyaltyService.formatETH(distribution.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {distribution.recipients.length} recipients
                      </TableCell>
                      <TableCell>
                        <Tooltip title={distribution.transactionHash}>
                          <Typography variant="body2" fontFamily="monospace">
                            {formatAddress(distribution.transactionHash)}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add Recipient Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Royalty Recipient</DialogTitle>
        <DialogContent>
          <Box pt={1}>
            <TextField
              fullWidth
              label="Ethereum Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              margin="normal"
              required
              placeholder="0x..."
            />
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              placeholder="Collaborator name"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                label="Role"
              >
                <MenuItem value="Creator">Creator</MenuItem>
                <MenuItem value="Producer">Producer</MenuItem>
                <MenuItem value="Director">Director</MenuItem>
                <MenuItem value="Writer">Writer</MenuItem>
                <MenuItem value="Actor">Actor</MenuItem>
                <MenuItem value="Composer">Composer</MenuItem>
                <MenuItem value="Collaborator">Collaborator</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Share Percentage"
              type="number"
              value={formData.sharePercentage}
              onChange={(e) => setFormData({ ...formData, sharePercentage: parseFloat(e.target.value) || 0 })}
              margin="normal"
              required
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              inputProps={{
                min: 0.01,
                max: remainingPercentage,
                step: 0.01
              }}
              helperText={`Available: ${remainingPercentage.toFixed(2)}%`}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddRecipient} 
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} /> : 'Add Recipient'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Recipient Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Royalty Recipient</DialogTitle>
        <DialogContent>
          <Box pt={1}>
            <TextField
              fullWidth
              label="Ethereum Address"
              value={formData.address}
              margin="normal"
              disabled
              InputProps={{
                readOnly: true,
              }}
            />
            <TextField
              fullWidth
              label="Share Percentage"
              type="number"
              value={formData.sharePercentage}
              onChange={(e) => setFormData({ ...formData, sharePercentage: parseFloat(e.target.value) || 0 })}
              margin="normal"
              required
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              inputProps={{
                min: 0.01,
                max: 100,
                step: 0.01
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleEditRecipient} 
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} /> : 'Update Recipient'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Distribution Dialog */}
      <Dialog open={distributionDialogOpen} onClose={() => setDistributionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Distribute Royalties</DialogTitle>
        <DialogContent>
          <Box pt={1}>
            <TextField
              fullWidth
              label="Amount to Distribute"
              type="number"
              value={distributionAmount}
              onChange={(e) => setDistributionAmount(e.target.value)}
              margin="normal"
              required
              InputProps={{
                endAdornment: <InputAdornment position="end">ETH</InputAdornment>,
              }}
              inputProps={{
                min: 0.001,
                step: 0.001
              }}
              helperText="This amount will be distributed among all recipients according to their shares"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDistributionDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDistributeRoyalties} 
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} /> : 'Distribute'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialogOpen} onClose={() => setWithdrawDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Withdraw Royalties</DialogTitle>
        <DialogContent>
          <Box pt={1}>
            <Typography variant="body1" gutterBottom>
              Available Balance: <strong>{userBalance ? RoyaltyService.formatETH(userBalance.balanceETH) : '0 ETH'}</strong>
            </Typography>
            <Typography variant="body2" color="textSecondary">
              This will withdraw all available royalties to your connected wallet.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWithdrawDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleWithdrawRoyalties} 
            variant="contained"
            disabled={submitting || !userBalance || parseFloat(userBalance.balanceETH) <= 0}
          >
            {submitting ? <CircularProgress size={20} /> : 'Withdraw'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoyaltyManagement; 