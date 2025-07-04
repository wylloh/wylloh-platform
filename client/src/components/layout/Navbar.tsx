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
  ListItemText
} from '@mui/material';
import {
  Menu as MenuIcon,
  Wallet,
  Collections,
  Logout,
  VideoLibrary,
  Dashboard,
  FileUpload,
  Home,
  VerifiedUser,
  Search as SearchIcon,
  Cloud as CloudIcon,
  Handshake as HandshakeIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useWallet } from '../../contexts/WalletContext';
import { useAuth } from '../../contexts/AuthContext';
import ConnectWalletButton from '../wallet/ConnectWalletButton';
import WyllohLogo from '../common/WyllohLogo';

// Logo component using the new WyllohLogo
const Logo = () => (
  <Box 
    component={RouterLink} 
    to="/" 
    sx={{ 
      display: 'flex', 
      alignItems: 'center',
      textDecoration: 'none',
      '&:hover': {
        opacity: 0.8,
      }
    }}
  >
    <WyllohLogo 
      variant="white" 
      size="small" 
      sx={{ 
        mr: 1.5,
        filter: 'brightness(1)',
      }} 
    />
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Typography
        variant="h6"
        noWrap
        sx={{
          fontFamily: '"Inter", sans-serif',
          fontWeight: 600,
          letterSpacing: '.1rem',
          color: 'text.primary',
          textDecoration: 'none',
        }}
      >
        WYLLOH
      </Typography>
      <Typography
        variant="caption"
        sx={{
          fontFamily: '"Inter", sans-serif',
          fontWeight: 400,
          fontSize: '0.65rem',
          color: 'text.secondary',
          textDecoration: 'none',
          ml: 0.75,
          opacity: 0.7,
          letterSpacing: '0.05rem',
        }}
      >
        BETA
      </Typography>
    </Box>
  </Box>
);

const Navbar: React.FC = () => {
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(null);
  const { active, account, connect, disconnect } = useWallet();
  const { isAuthenticated, user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // For elevated app bar when scrolling
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0,
  });
  
  const isMobileMenuOpen = Boolean(mobileMenuAnchorEl);
  const isUserMenuOpen = Boolean(userMenuAnchorEl);
  
  // Only show user menu when fully authenticated (not during loading)
  const shouldShowUserMenu = isAuthenticated && !authLoading && user;
  
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
  const formatAddress = (address: string | null | undefined) => {
    if (!address) return 'Unknown';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Check if user is admin
  const isAdmin = user?.roles?.includes('admin');
  
  // Navigation links
  const navLinks = [
    { text: 'Home', to: '/', icon: <Home /> },
    { text: 'Store', to: '/store', icon: <VideoLibrary /> },
    { text: 'Library', to: '/library', icon: <Collections /> },
    { text: 'Partnerships', to: '/partnerships', icon: <HandshakeIcon /> },
  ];
  
  // Pro links (if authenticated) - Upload removed from top nav, available in Dashboard
  const creatorLinks = isAuthenticated && user?.proStatus === 'verified' ? [
          { text: 'Dashboard', to: '/pro/dashboard', icon: <Dashboard /> },
  ] : [];
  
  // User menu items (Dashboard only for Pro users)
  const userMenuItems = [
    { text: 'Profile', to: '/profile', icon: <PersonIcon /> },
    ...(user?.proStatus === 'verified' ? [{ text: 'Dashboard', to: '/dashboard', icon: <Dashboard /> }] : []),
    { text: 'Network', to: '/network', icon: <CloudIcon /> },
  ];
  
  // Admin menu items (only if user has admin role)
  const adminMenuItems = isAdmin ? [
    { text: 'Pro Verification', to: '/admin/pro-verification', icon: <VerifiedUser /> },
  ] : [];
  
  return (
    <>
      <AppBar position="static" elevation={trigger ? 4 : 0} sx={{ bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            {/* Logo - mobile */}
            <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
              <IconButton
                size="large"
                aria-label="menu"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMobileMenuOpen}
                color="inherit"
              >
                <MenuIcon />
              </IconButton>
              <Logo />
            </Box>
            
            {/* Logo - desktop */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, mr: 2 }}>
              <Logo />
            </Box>
            
            {/* Navigation Links - desktop */}
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
              {navLinks.map((link) => (
                <Button
                  key={link.text}
                  component={RouterLink}
                  to={link.to}
                  sx={{ 
                    mx: 1, 
                    color: 'text.secondary', 
                    display: 'block',
                    '&:hover': {
                      color: 'text.primary',
                      backgroundColor: 'action.hover',
                    }
                  }}
                >
                  {link.text}
                </Button>
              ))}
              

              
              {creatorLinks.map((link) => (
                <Button
                  key={link.text}
                  component={RouterLink}
                  to={link.to}
                  sx={{ 
                    mx: 1, 
                    color: 'text.secondary', 
                    display: 'block',
                    '&:hover': {
                      color: 'text.primary',
                      backgroundColor: 'action.hover',
                    }
                  }}
                >
                  {link.text}
                </Button>
              ))}
            </Box>
            
            {/* Right side - Wallet & User */}
            <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center' }}>
              {/* Wallet connect button */}
              <Box sx={{ mr: 2, display: { xs: 'none', sm: 'flex' } }}>
                <ConnectWalletButton />
              </Box>
              
              {/* User menu - only show if authenticated */}
              {shouldShowUserMenu && (
                <Tooltip title="Open user menu">
                  <IconButton onClick={handleUserMenuOpen} sx={{ p: 0 }}>
                    <Avatar 
                      alt={user?.username || 'User'} 
                      sx={{ 
                        bgcolor: 'primary.main',
                        width: 32,
                        height: 32,
                        fontSize: '0.875rem'
                      }}
                    >
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Toolbar>
        </Container>
        
        {/* Mobile Menu */}
        <Menu
          anchorEl={mobileMenuAnchorEl}
          id="mobile-menu"
          open={isMobileMenuOpen}
          onClose={handleMobileMenuClose}
          PaperProps={{
            elevation: 0,
            sx: { width: 250, maxWidth: '100%' }
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
          
          <MenuItem onClick={handleWalletConnect}>
            <ListItemIcon>
              <Wallet />
            </ListItemIcon>
            <ListItemText>
              {active ? formatAddress(account) : 'Connect Wallet'}
            </ListItemText>
          </MenuItem>
          
          {shouldShowUserMenu ? (
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
          ) : null}
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
          
          {/* Admin menu items - only shown if user is admin */}
          {adminMenuItems.length > 0 && (
            <>
              <Divider />
              <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 1, display: 'block' }}>
                Admin
              </Typography>
              {adminMenuItems.map((item) => (
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
            </>
          )}
          
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <Logout />
            </ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        </Menu>
      </AppBar>
    </>
  );
};

export default Navbar; 