import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Card,
  CardContent
} from '@mui/material';
import {
  Copyright as CopyrightIcon,
  Movie as MovieIcon,
  AccountBalance as LegalIcon,
  Security as SecurityIcon,
  Verified as VerifiedIcon,
  Gavel as ContractIcon,
  Business as BusinessIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const CopyrightPage: React.FC = () => {
  const copyrightPrinciples = [
    {
      icon: <MovieIcon />,
      title: "Creator Copyright Ownership",
      description: "All movie copyrights remain with their original creators and rights holders",
      details: [
        "Creators retain full copyright ownership of their content",
        "Wylloh does not claim any copyright over uploaded movies",
        "Original copyright terms and duration remain unchanged",
        "Creators can withdraw content at any time"
      ]
    },
    {
      icon: <ContractIcon />,
      title: "Token License Rights",
      description: "Tokens represent specific usage licenses, not copyright ownership",
      details: [
        "Tokens grant usage rights as defined by smart contracts",
        "License terms are set by the copyright holder",
        "Rights can include viewing, exhibition, or distribution",
        "Licenses are transferable but copyright ownership is not"
      ]
    },
    {
      icon: <SecurityIcon />,
      title: "Rights Verification",
      description: "Blockchain-based verification ensures legitimate licensing",
      details: [
        "Smart contracts enforce license terms automatically",
        "All rights transfers are recorded on-chain",
        "Verification prevents unauthorized usage",
        "Transparent audit trail for all transactions"
      ]
    },
    {
      icon: <VerifiedIcon />,
      title: "Platform Value Creation",
      description: "Open source infrastructure enables proprietary value through network effects",
      details: [
        "Filmmaker relationship network and industry trust reputation",
        "Proprietary content curation standards and quality verification",
        "Advanced audience analytics and content performance insights",
        "Strategic industry partnerships and distribution relationships"
      ]
    }
  ];

  const wyllohCopyright = [
    {
      category: "Platform Brand & Trademarks",
      items: [
        "Wylloh™ name and trademark registration",
        "Wylloh logo and visual identity system",
        "'Wylloh Verified' certification marks for content",
        "Platform user interface design and experience"
      ]
    },
    {
      category: "Proprietary Business Assets",
      items: [
        "Content curation methodologies and quality standards",
        "Filmmaker network and industry relationship database",
        "Advanced analytics algorithms and audience insights",
        "Strategic partnership agreements and distribution channels"
      ]
    },
    {
      category: "Documentation & Content",
      items: [
        "User guides and educational materials",
        "Marketing content and brand messaging",
        "Website copy and informational content",
        "Brand guidelines and asset libraries"
      ]
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography 
          variant="h2" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2
          }}
        >
          Copyright
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Protecting creators' rights while enabling flexible licensing
        </Typography>
      </Box>

      {/* Important Notice */}
      <Alert 
        severity="info" 
        icon={<InfoIcon />}
        sx={{ mb: 6, p: 3 }}
      >
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Key Copyright Principle
        </Typography>
        <Typography variant="body1">
          <strong>Movie copyrights belong to their creators.</strong> Wylloh tokens represent 
          usage licenses for playback and distribution as outlined by each smart contract. 
          We facilitate licensing, not copyright transfer.
        </Typography>
      </Alert>

      {/* Copyright Framework */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
          Copyright Framework
        </Typography>
        
        <Grid container spacing={4}>
          {copyrightPrinciples.map((principle, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card 
                elevation={0} 
                sx={{ 
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease-in-out'
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ color: 'primary.main', mr: 2 }}>
                      {principle.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {principle.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {principle.description}
                  </Typography>
                  <List dense>
                    {principle.details.map((detail, idx) => (
                      <ListItem key={idx} sx={{ px: 0, py: 0.25 }}>
                        <ListItemIcon sx={{ minWidth: 20 }}>
                          <VerifiedIcon sx={{ fontSize: 16, color: 'success.main' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={detail}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* License vs Copyright */}
      <Paper elevation={0} sx={{ p: 4, mb: 6, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          License vs. Copyright: Understanding the Difference
        </Typography>
        
        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Box sx={{ textAlign: 'center', p: 3 }}>
              <CopyrightIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                Copyright Ownership
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                <strong>Remains with the creator.</strong> This includes the exclusive right to 
                reproduce, distribute, display, perform, and create derivative works.
              </Typography>
              <List dense>
                <ListItem sx={{ justifyContent: 'center' }}>
                  <ListItemText 
                    primary="• Cannot be transferred via tokens"
                    primaryTypographyProps={{ variant: 'body2', textAlign: 'center' }}
                  />
                </ListItem>
                <ListItem sx={{ justifyContent: 'center' }}>
                  <ListItemText 
                    primary="• Protected by copyright law"
                    primaryTypographyProps={{ variant: 'body2', textAlign: 'center' }}
                  />
                </ListItem>
                <ListItem sx={{ justifyContent: 'center' }}>
                  <ListItemText 
                    primary="• Creator retains all moral rights"
                    primaryTypographyProps={{ variant: 'body2', textAlign: 'center' }}
                  />
                </ListItem>
              </List>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ textAlign: 'center', p: 3 }}>
              <ContractIcon sx={{ fontSize: 64, color: 'secondary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                License Rights
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                <strong>Granted through tokens.</strong> Specific usage rights as defined 
                by the creator in smart contracts, such as viewing or exhibition rights.
              </Typography>
              <List dense>
                <ListItem sx={{ justifyContent: 'center' }}>
                  <ListItemText 
                    primary="• Transferable via blockchain"
                    primaryTypographyProps={{ variant: 'body2', textAlign: 'center' }}
                  />
                </ListItem>
                <ListItem sx={{ justifyContent: 'center' }}>
                  <ListItemText 
                    primary="• Defined by smart contracts"
                    primaryTypographyProps={{ variant: 'body2', textAlign: 'center' }}
                  />
                </ListItem>
                <ListItem sx={{ justifyContent: 'center' }}>
                  <ListItemText 
                    primary="• Limited to specified uses"
                    primaryTypographyProps={{ variant: 'body2', textAlign: 'center' }}
                  />
                </ListItem>
              </List>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Wylloh Brand Copyright */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
          Wylloh Brand Copyright
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.7, mb: 4 }}>
          While the Wylloh platform code is open source under Apache 2.0, the Wylloh brand, 
          name, logo, and associated marketing materials are protected by copyright and trademark law.
        </Typography>
        
        <Grid container spacing={4}>
          {wyllohCopyright.map((section, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  height: '100%'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <BusinessIcon sx={{ color: 'primary.main', mr: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {section.category}
                  </Typography>
                </Box>
                <List dense>
                  {section.items.map((item, idx) => (
                    <ListItem key={idx} sx={{ px: 0, py: 0.25 }}>
                      <ListItemIcon sx={{ minWidth: 20 }}>
                        <CopyrightIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={item}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Open Source & Business Value */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
          Open Source Infrastructure & Business Value
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.7, mb: 4 }}>
          Wylloh's open source approach creates trust, accelerates innovation, and enables 
          global adoption while building sustainable competitive advantages through network 
          effects and proprietary business operations.
        </Typography>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                height: '100%'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SecurityIcon sx={{ color: 'primary.main', mr: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Open Source Benefits
                </Typography>
              </Box>
              <List dense>
                <ListItem sx={{ px: 0, py: 0.25 }}>
                  <ListItemIcon sx={{ minWidth: 20 }}>
                    <VerifiedIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Transparent, auditable smart contracts build filmmaker trust"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0, py: 0.25 }}>
                  <ListItemIcon sx={{ minWidth: 20 }}>
                    <VerifiedIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Community development accelerates feature innovation"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0, py: 0.25 }}>
                  <ListItemIcon sx={{ minWidth: 20 }}>
                    <VerifiedIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Market expansion through compatible platform adoption"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0, py: 0.25 }}>
                  <ListItemIcon sx={{ minWidth: 20 }}>
                    <VerifiedIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Enhanced security through community code review"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                height: '100%'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BusinessIcon sx={{ color: 'secondary.main', mr: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Competitive Advantages
                </Typography>
              </Box>
              <List dense>
                <ListItem sx={{ px: 0, py: 0.25 }}>
                  <ListItemIcon sx={{ minWidth: 20 }}>
                    <ContractIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Exclusive filmmaker relationships and industry network"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0, py: 0.25 }}>
                  <ListItemIcon sx={{ minWidth: 20 }}>
                    <ContractIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Proprietary content curation and quality standards"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0, py: 0.25 }}>
                  <ListItemIcon sx={{ minWidth: 20 }}>
                    <ContractIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Advanced analytics and audience behavior insights"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0, py: 0.25 }}>
                  <ListItemIcon sx={{ minWidth: 20 }}>
                    <ContractIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Strategic partnerships and distribution channels"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
        
        <Alert 
          severity="success" 
          icon={<InfoIcon />}
          sx={{ mt: 4, p: 3 }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Strategic Framework
          </Typography>
          <Typography variant="body1">
            Open source infrastructure creates industry trust and adoption, while proprietary 
            business operations generate sustainable competitive advantages through network effects, 
            content curation, and strategic relationships that cannot be replicated through code alone.
          </Typography>
        </Alert>
      </Box>

      {/* Legal Compliance */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 4, 
          border: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05), rgba(66, 165, 245, 0.05))'
        }}
      >
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Legal Compliance & DMCA
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.7 }}>
          Wylloh respects copyright law and provides mechanisms for copyright holders to 
          protect their rights:
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', mb: 3 }}>
              <LegalIcon sx={{ color: 'primary.main', mr: 2, mt: 0.5 }} />
              <Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  DMCA Compliance
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  We respond to valid DMCA takedown notices and provide counter-notification 
                  procedures as required by law.
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', mb: 3 }}>
              <SecurityIcon sx={{ color: 'primary.main', mr: 2, mt: 0.5 }} />
              <Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Rights Verification
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Creators must verify they own or have rights to content before 
                  uploading to the platform.
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 4 }} />
        
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Copyright Questions?
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            For copyright-related inquiries, DMCA notices, or rights management questions, 
            please contact us at{' '}
            <Typography 
              component="a" 
              href="mailto:contact@wylloh.com" 
              sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 600 }}
            >
              contact@wylloh.com
            </Typography>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            We are committed to protecting creators' rights while enabling innovative licensing models.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default CopyrightPage; 