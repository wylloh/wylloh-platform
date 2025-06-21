import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Link,
  TextField,
  Alert
} from '@mui/material';
import {
  VerifiedUser,
  Block,
  CheckCircle,
  Person,
  Launch
} from '@mui/icons-material';
import { ProVerificationData } from '../../contexts/AuthContext';

interface PendingUser {
  id: string;
  username: string;
  email: string;
  dateProRequested: string;
  walletAddress: string;
  proStatus: 'pending';
  proVerificationData: ProVerificationData;
}

const ProVerificationPanel: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [actionCompleted, setActionCompleted] = useState<{id: string, action: 'approved' | 'rejected'} | null>(null);

  // Load pending Pro verification requests from API
  useEffect(() => {
    const loadPendingUsers = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'https://api.wylloh.com'}/users/pro-status/pending`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to load pending requests');
        }
        
        const data = await response.json();
        
        if (data.success) {
          const users: PendingUser[] = data.data.map((user: any) => ({
            id: user._id,
            username: user.username,
            email: user.email,
            dateProRequested: user.dateProRequested || new Date().toISOString(),
            walletAddress: user.walletAddress,
            proStatus: 'pending',
            proVerificationData: user.proVerificationData
          }));
          
          setPendingUsers(users);
        }
      } catch (error) {
        console.error('Error loading pending users:', error);
      }
    };

    loadPendingUsers();
    
    // Set up interval to refresh pending users
    const interval = setInterval(loadPendingUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenUserDetails = (user: PendingUser) => {
    setSelectedUser(user);
    setActionCompleted(null);
  };

  const handleCloseUserDetails = () => {
    setSelectedUser(null);
    setRejectionReason('');
    setActionCompleted(null);
  };

  const handleApprove = async (userId: string) => {
    const user = pendingUsers.find(u => u.id === userId);
    if (!user) return;
    
    try {
      console.log(`Approving Pro status for user: ${user.username} (${user.walletAddress})`);
      
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'https://api.wylloh.com'}/users/pro-status/${userId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to approve Pro status');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update UI
        setActionCompleted({id: userId, action: 'approved'});
        
        // Refresh pending users list
        setTimeout(() => {
          setPendingUsers(prev => prev.filter(u => u.id !== userId));
          handleCloseUserDetails();
        }, 2000);
      }
    } catch (error) {
      console.error('Error approving Pro status:', error);
    }
  };

  const handleOpenRejectionDialog = () => {
    setShowRejectionDialog(true);
  };

  const handleCloseRejectionDialog = () => {
    setShowRejectionDialog(false);
    setRejectionReason('');
  };

  const handleReject = async (userId: string) => {
    const user = pendingUsers.find(u => u.id === userId);
    if (!user) return;
    
    try {
      console.log(`Rejecting Pro status for user: ${user.username} (${user.walletAddress}). Reason: ${rejectionReason}`);
      
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'https://api.wylloh.com'}/users/pro-status/${userId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: rejectionReason
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to reject Pro status');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update UI
        setActionCompleted({id: userId, action: 'rejected'});
        setShowRejectionDialog(false);
        
        // Refresh pending users list
        setTimeout(() => {
          setPendingUsers(prev => prev.filter(u => u.id !== userId));
          handleCloseUserDetails();
        }, 2000);
      }
    } catch (error) {
      console.error('Error rejecting Pro status:', error);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: '1000px', margin: '0 auto' }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <VerifiedUser color="secondary" />
        Pro Status Verification Requests
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Review and verify professional filmmaker accounts. Approved users will receive the Pro badge and access to professional features.
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      {pendingUsers.length === 0 ? (
        <Alert severity="info">No pending verification requests</Alert>
      ) : (
        <List sx={{ width: '100%' }}>
          {pendingUsers.map((user) => (
            <Paper 
              key={user.id} 
              elevation={0}
              sx={{ 
                mb: 2, 
                p: 2, 
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1
              }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={7}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <Person />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1">{user.proVerificationData.fullName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {user.username} • {user.email}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={3}>
                  <Chip 
                    label="Pending Review" 
                    color="warning" 
                    size="small"
                    icon={<VerifiedUser fontSize="small" />}
                  />
                  <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                    Requested: {new Date(user.dateProRequested).toLocaleDateString()}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={2}>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    fullWidth
                    onClick={() => handleOpenUserDetails(user)}
                  >
                    Review
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          ))}
        </List>
      )}
      
      {/* User Detail Dialog */}
      <Dialog 
        open={Boolean(selectedUser)} 
        onClose={handleCloseUserDetails}
        maxWidth="md"
        fullWidth
      >
        {selectedUser && (
          <>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Pro Verification Request</Typography>
                <Chip 
                  label="Pending Review" 
                  color="warning" 
                  size="small"
                  icon={<VerifiedUser fontSize="small" />}
                />
              </Box>
            </DialogTitle>
            <Divider />
            <DialogContent>
              {actionCompleted && actionCompleted.id === selectedUser.id && (
                <Alert 
                  severity={actionCompleted.action === 'approved' ? 'success' : 'info'}
                  sx={{ mb: 2 }}
                >
                  {actionCompleted.action === 'approved' 
                    ? 'Pro status has been approved!' 
                    : 'Pro status request has been rejected.'}
                </Alert>
              )}
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" fontWeight="bold">User Information</Typography>
                  <Box sx={{ mt: 1, mb: 3 }}>
                    <Typography variant="body1">{selectedUser.proVerificationData.fullName}</Typography>
                    <Typography variant="body2">Username: {selectedUser.username}</Typography>
                    <Typography variant="body2">Email: {selectedUser.email}</Typography>
                    <Typography variant="body2">Wallet: {selectedUser.walletAddress}</Typography>
                    <Typography variant="body2">
                      Requested: {new Date(selectedUser.dateProRequested).toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" fontWeight="bold">Professional Links</Typography>
                  <Box sx={{ mt: 1, mb: 3 }}>
                    {Object.entries(selectedUser.proVerificationData.professionalLinks).map(([key, value]) => 
                      value ? (
                        <Box key={key} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" sx={{ minWidth: 80, textTransform: 'capitalize' }}>
                            {key}:
                          </Typography>
                          <Link href={value as string} target="_blank" rel="noopener" underline="hover" sx={{ display: 'flex', alignItems: 'center' }}>
                            {value as string} <Launch fontSize="small" sx={{ ml: 0.5 }} />
                          </Link>
                        </Box>
                      ) : null
                    )}
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold">Professional Biography</Typography>
                  <Typography variant="body1" paragraph sx={{ mt: 1, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    {selectedUser.proVerificationData.biography}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold">Filmography Highlights</Typography>
                  <Typography variant="body1" component="pre" sx={{ 
                    mt: 1, 
                    p: 2, 
                    bgcolor: 'background.paper', 
                    borderRadius: 1,
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit'
                  }}>
                    {selectedUser.proVerificationData.filmographyHighlights || 'No filmography provided'}
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button 
                variant="outlined" 
                color="error" 
                startIcon={<Block />}
                onClick={handleOpenRejectionDialog}
                disabled={Boolean(actionCompleted)}
              >
                Reject
              </Button>
              <Button 
                variant="contained" 
                color="success" 
                startIcon={<CheckCircle />}
                onClick={() => handleApprove(selectedUser.id)}
                disabled={Boolean(actionCompleted)}
              >
                Approve Pro Status
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Rejection Reason Dialog */}
      <Dialog 
        open={showRejectionDialog} 
        onClose={handleCloseRejectionDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Provide Rejection Reason</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            Please provide a reason for rejecting this Pro verification request. 
            This information will be shared with the user.
          </Typography>
          <TextField
            label="Rejection Reason"
            multiline
            rows={4}
            fullWidth
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Example: Unable to verify professional credentials. Please provide additional information about your film experience or links to your professional work."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRejectionDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={() => selectedUser && handleReject(selectedUser.id)} 
            color="error"
            variant="contained"
            disabled={!rejectionReason.trim()}
          >
            Submit Rejection
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ProVerificationPanel; 