import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Button,
  Avatar,
  Container,
  Tooltip,
  Divider,
  useScrollTrigger,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Wallet,
  Collections,
  Login,
  Logout,
  VideoLibrary,
  Dashboard,
  FileUpload,
  Home
} from '@mui/icons-material';
import { useWallet } from '../../contexts/WalletContext';
import { useAuth } from '../../contexts/AuthContext';

// Logo component
const Logo = () => (
  <Typography
    variant="h6"
    noWrap
    component={RouterLink}
    to="/"
    sx={{
      fontFamily: 'Playfair Display, serif',
      fontWeight: 700,
      letterSpacing: '.2rem',
      color: 'primary.main',
      textDecoration: 'none',
      display: 'flex',
      alignItems: 'center'
    }}
  >
    WYLLOH
  </Typography>
);

const Navbar: React.FC = () => {
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(null);
  const { active, account, isCorrectNetwork, connect, disconnect } = useWallet();
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  
  // For elevated app bar when scrolling
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0,
  });
  
  const isMobileMenuOpen = Boolean(mobileMenuAnchorEl);
  const isUserMenuOpen = Boolean(userMenuAnchorEl);
  
  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };
  
  const handleMobileMenuClose = () => {
    setMobileMenuAnchorEl(null);
  };
  
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchorEl(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };
  
  const handleLogout = () => {
    logout();
    disconnect();
    handleUserMenuClose();
    navigate('/');
  };
  
  const handleWalletConnect = () => {
    connect();
    handleMobileMenuClose();
  };
  
  // Format account address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Navigation links
  const navLinks = [
    { text: 'Home', to: '/', icon: <Home /> },
    { text: 'Marketplace', to: '/marketplace', icon: <VideoLibrary /> },
  ];
  
  // Creator links (if authenticated)
  const creatorLinks = isAuthenticated ? [
    { text: 'Dashboard', to: '/creator/dashboard', icon: <Dashboard /> },
    { text: 'Upload', to: '/creator/upload', icon: <FileUpload /> },
  ] : [];
  
  // User menu items
  const userMenuItems = [
    { text: 'Profile', to: '/profile', icon: <AccountCircle /> },
    { text: 'My Collection', to: '/collection', icon: <Collections /> },
  ];
  
  return (
    <AppBar 
      position="sticky" 
      elevation={trigger ? 4 : 0}
      sx={{ 
        backgroundColor: trigger ? 'rgba(18, 18, 18, 0.95)' : 'transparent',
        backdropFilter: trigger ? 'blur(8px)' : 'none',
        transition: 'background-color 0.3s ease, backdrop-filter 0.3s ease'
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Logo - on all screens */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, mr: 4 }}>
            <Logo />
          </Box>
          
          {/* Mobile menu icon */}
          <Box sx={{ flexGrow: 0, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="menu"
              aria-controls="menu-mobile"
              aria-haspopup="true"
              onClick={handleMobileMenuOpen}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
          </Box>
          
          {/* Logo centered on mobile */}
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' }, justifyContent: 'center' }}>
            <Logo />
          </Box>
          
          {/* Navigation Links - desktop */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {navLinks.map((link) => (
              <Button
                key={link.text}
                component={RouterLink}
                to={link.to}
                sx={{ mx: 1, color: 'white', display: 'block' }}
              >
                {link.text}
              </Button>
            ))}
            
            {creatorLinks.map((link) => (
              <Button
                key={link.text}
                component={RouterLink}
                to={link.to}
                sx={{ mx: 1, color: 'white', display: 'block' }}
              >
                {link.text}
              </Button>
            ))}
          </Box>
          
          {/* Right side - Wallet & User */}
          <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center' }}>
            {/* Wallet connect button */}
            {!active ? (
              <Button
                variant="outlined"
                color="primary"
                startIcon={<Wallet />}
                onClick={handleWalletConnect}
                sx={{ mr: 2, display: { xs: 'none', sm: 'flex' } }}
              >
                Connect Wallet
              </Button>
            ) : (
              <Chip
                icon={<Wallet />}
                label={formatAddress(account)}
                color={isCorrectNetwork ? "primary" : "error"}
                variant="outlined"
                size="medium"
                sx={{ mr: 2, display: { xs: 'none', sm: 'flex' } }}
              />
            )}
            
            {/* User menu */}
            {isAuthenticated ? (
              <Tooltip title="Open user menu">
                <IconButton onClick={handleUserMenuOpen} sx={{ p: 0 }}>
                  <Avatar alt="User" src="/static/images/avatar/1.jpg" />
                </IconButton>
              </Tooltip>
            ) : (
              <Button
                variant="contained"
                color="primary"
                component={RouterLink}
                to="/login"
                startIcon={<Login />}
                sx={{ display: { xs: 'none', sm: 'flex' } }}
              >
                Sign In
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
      
      {/* Mobile Menu */}
      <Menu
        id="menu-mobile"
        anchorEl={mobileMenuAnchorEl}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={isMobileMenuOpen}
        onClose={handleMobileMenuClose}
        keepMounted
        PaperProps={{
          sx: {
            mt: 5,
            width: 240,
            maxHeight: '85vh',
          },
        }}
      >
        {navLinks.map((link) => (
          <MenuItem 
            key={link.text} 
            component={RouterLink} 
            to={link.to}
            onClick={handleMobileMenuClose}
          >
            <ListItemIcon>
              {link.icon}
            </ListItemIcon>
            <ListItemText>{link.text}</ListItemText>
          </MenuItem>
        ))}
        
        {creatorLinks.length > 0 && (
          <>
            <Divider />
            {creatorLinks.map((link) => (
              <MenuItem 
                key={link.text} 
                component={RouterLink} 
                to={link.to}
                onClick={handleMobileMenuClose}
              >
                <ListItemIcon>
                  {link.icon}
                </ListItemIcon>
                <ListItemText>{link.text}</ListItemText>
              </MenuItem>
            ))}
          </>
        )}
        
        <Divider />
        
        {!active ? (
          <MenuItem onClick={handleWalletConnect}>
            <ListItemIcon>
              <Wallet />
            </ListItemIcon>
            <ListItemText>Connect Wallet</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem onClick={handleMobileMenuClose}>
            <ListItemIcon>
              <Wallet color={isCorrectNetwork ? "primary" : "error"} />
            </ListItemIcon>
            <ListItemText>{formatAddress(account)}</ListItemText>
          </MenuItem>
        )}
        
        {isAuthenticated ? (
          <>
            {userMenuItems.map((item) => (
              <MenuItem 
                key={item.text} 
                component={RouterLink} 
                to={item.to}
                onClick={handleMobileMenuClose}
              >
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText>{item.text}</ListItemText>
              </MenuItem>
            ))}
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </>
        ) : (
          <MenuItem 
            component={RouterLink} 
            to="/login"
            onClick={handleMobileMenuClose}
          >
            <ListItemIcon>
              <Login />
            </ListItemIcon>
            <ListItemText>Sign In</ListItemText>
          </MenuItem>
        )}
      </Menu>
      
      {/* User Menu */}
      <Menu
        id="menu-user"
        anchorEl={userMenuAnchorEl}
        open={isUserMenuOpen}
        onClose={handleUserMenuClose}
        onClick={handleUserMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1,
            width: 200,
          },
        }}
      >
        {userMenuItems.map((item) => (
          <MenuItem 
            key={item.text} 
            component={RouterLink} 
            to={item.to}
          >
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>
            <ListItemText>{item.text}</ListItemText>
          </MenuItem>
        ))}
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </AppBar>
  );
};

export default Navbar; 