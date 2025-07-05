import React from 'react';
import {
  Container,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Link,
  Chip,
  Alert,
  Card,
  CardContent,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Launch as LaunchIcon,
  ContentCopy as ContentCopyIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';
import { useState } from 'react';
import deployedAddresses from '../config/deployedAddresses.json';

const TransparencyPage: React.FC = () => {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const getPolygonScanUrl = (address: string) => {
    return `https://polygonscan.com/address/${address}`;
  };

  const contracts = deployedAddresses.contracts;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          🎬 Platform Transparency
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Wylloh Platform Contract Addresses
        </Typography>
        <Alert severity="info" sx={{ mb: 4 }}>
          All Wylloh platform contracts are deployed on Polygon mainnet and fully verifiable. 
          Click any address to view the contract on PolygonScan.
        </Alert>
      </Box>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            <VerifiedIcon sx={{ mr: 1, color: 'success.main' }} />
            Deployed Infrastructure
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Network: Polygon Mainnet (Chain ID: 137) | Deployed: July 5, 2025
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Contract</strong></TableCell>
                  <TableCell><strong>Address</strong></TableCell>
                  <TableCell><strong>Purpose</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" fontWeight="bold">
                        WyllohFilmRegistry
                      </Typography>
                      <Chip label="Master" color="primary" size="small" sx={{ ml: 1 }} />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {contracts.WyllohFilmRegistry}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      Master contract for all films (ERC1155)
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Copy address">
                      <IconButton
                        size="small"
                        onClick={() => handleCopyAddress(contracts.WyllohFilmRegistry)}
                        color={copiedAddress === contracts.WyllohFilmRegistry ? 'success' : 'default'}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View on PolygonScan">
                      <IconButton
                        size="small"
                        component={Link}
                        href={getPolygonScanUrl(contracts.WyllohFilmRegistry)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <LaunchIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      WyllohToken
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {contracts.WyllohToken}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      Platform utility token (ERC20)
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Copy address">
                      <IconButton
                        size="small"
                        onClick={() => handleCopyAddress(contracts.WyllohToken)}
                        color={copiedAddress === contracts.WyllohToken ? 'success' : 'default'}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View on PolygonScan">
                      <IconButton
                        size="small"
                        component={Link}
                        href={getPolygonScanUrl(contracts.WyllohToken)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <LaunchIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      WyllohMarketplace
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {contracts.WyllohMarketplace}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      Film trading & licensing marketplace
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Copy address">
                      <IconButton
                        size="small"
                        onClick={() => handleCopyAddress(contracts.WyllohMarketplace)}
                        color={copiedAddress === contracts.WyllohMarketplace ? 'success' : 'default'}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View on PolygonScan">
                      <IconButton
                        size="small"
                        component={Link}
                        href={getPolygonScanUrl(contracts.WyllohMarketplace)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <LaunchIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      RoyaltyDistributor
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {contracts.RoyaltyDistributor}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      Automated royalty distribution
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Copy address">
                      <IconButton
                        size="small"
                        onClick={() => handleCopyAddress(contracts.RoyaltyDistributor)}
                        color={copiedAddress === contracts.RoyaltyDistributor ? 'success' : 'default'}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View on PolygonScan">
                      <IconButton
                        size="small"
                        component={Link}
                        href={getPolygonScanUrl(contracts.RoyaltyDistributor)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <LaunchIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      StoragePool
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {contracts.StoragePool}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      IPFS storage management
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Copy address">
                      <IconButton
                        size="small"
                        onClick={() => handleCopyAddress(contracts.StoragePool)}
                        color={copiedAddress === contracts.StoragePool ? 'success' : 'default'}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View on PolygonScan">
                      <IconButton
                        size="small"
                        component={Link}
                        href={getPolygonScanUrl(contracts.StoragePool)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <LaunchIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="body2" color="text.secondary">
          All contracts are upgradeable and auditable. For technical details, visit our{' '}
          <Link href="/ai-transparency" target="_blank" rel="noopener noreferrer">
            AI Transparency page
          </Link>
          .
        </Typography>
      </Box>
    </Container>
  );
};

export default TransparencyPage; 