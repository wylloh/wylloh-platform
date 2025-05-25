import React from 'react';
import {
  AppBar as MuiAppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AccountCircle } from '@mui/icons-material';
import WyllohLogo from '../common/WyllohLogo';

const AppBar: React.FC = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <MuiAppBar position="static" sx={{ backgroundColor: '#000000' }}>
      <Toolbar>
        {/* Logo */}
        <WyllohLogo
          variant="horizontal"
          size="medium"
          onClick={handleLogoClick}
          sx={{ mr: 2 }}
        />
        
        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />
        
        {/* Navigation Links */}
        <Button color="inherit" onClick={() => navigate('/discover')}>
          Discover
        </Button>
        <Button color="inherit" onClick={() => navigate('/store')}>
          Store
        </Button>
        <Button color="inherit" onClick={() => navigate('/network')}>
          Network
        </Button>
        <Button color="inherit" onClick={() => navigate('/analytics')}>
          Analytics
        </Button>
        
        {/* User Menu */}
        <IconButton
          size="large"
          aria-label="account of current user"
          aria-controls="menu-appbar"
          aria-haspopup="true"
          onClick={handleMenu}
          color="inherit"
          sx={{ ml: 2 }}
        >
          <AccountCircle />
        </IconButton>
        <Menu
          id="menu-appbar"
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>
            Profile
          </MenuItem>
          <MenuItem onClick={() => { handleClose(); navigate('/transactions'); }}>
            Transactions
          </MenuItem>
          <MenuItem onClick={handleClose}>Logout</MenuItem>
        </Menu>
      </Toolbar>
    </MuiAppBar>
  );
};

export default AppBar; 