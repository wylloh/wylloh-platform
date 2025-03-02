import React, { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Typography, Box, CircularProgress } from '@mui/material';
import { AccountBalanceWallet as WalletIcon } from '@mui/icons-material';
import { useWallet } from '../../contexts/WalletContext';

const shortenAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const ConnectWalletButton: React.FC = () => {
  const { connect, disconnect, account, active, chainId, isCorrectNetwork, switchNetwork, connecting } = useWallet();
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleConnect = async () => {
    await connect();
    handleClose();
  };

  const handleDisconnect = () => {
    disconnect();
    handleClose();
  };

  const handleSwitchNetwork = async () => {
    await switchNetwork();
  };

  if (connecting) {
    return (
      <Button
        variant="contained"
        color="primary"
        startIcon={<CircularProgress size={20} color="inherit" />}
        disabled
      >
        Connecting...
      </Button>
    );
  }

  if (active && account) {
    return (
      <>
        <Button
          variant="contained"
          color={isCorrectNetwork ? "primary" : "error"}
          startIcon={<WalletIcon />}
          onClick={handleClickOpen}
          sx={{ textTransform: 'none' }}
        >
          {isCorrectNetwork ? shortenAddress(account) : 'Wrong Network'}
        </Button>
        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>Wallet Connection</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Connected wallet address:
            </DialogContentText>
            <Typography variant="body1" component="div" sx={{ mb: 2, wordBreak: "break-all", fontFamily: "monospace" }}>
              {account}
            </Typography>
            {!isCorrectNetwork && (
              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography color="error">
                  You are connected to the wrong network.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSwitchNetwork}
                  sx={{ mt: 1 }}
                >
                  Switch to Polygon {chainId === 137 ? "Mainnet" : "Mumbai Testnet"}
                </Button>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Close</Button>
            <Button onClick={handleDisconnect} color="error">Disconnect</Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={<WalletIcon />}
      onClick={handleConnect}
    >
      Connect Wallet
    </Button>
  );
};

export default ConnectWalletButton;