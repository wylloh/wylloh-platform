import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Grid
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Shield as PrivacyIcon,
  Visibility as DataIcon,
  Lock as SecurityIcon,
  Public as BlockchainIcon,
  AccountBalanceWallet as WalletIcon
} from '@mui/icons-material';

const PrivacyPage: React.FC = () => {
  const lastUpdated = "January 2024";

  const dataTypes = [
    { type: "Wallet Address", description: "Public blockchain address (already public on-chain)" },
    { type: "On-Chain Activity", description: "Token transactions and ownership (public blockchain data)" },
    { type: "Platform Preferences", description: "Display settings and user interface preferences only" },
    { type: "No Personal Data", description: "We do not collect names, emails, or personal information" }
  ];

  const sections = [
    {
      title: "1. Our Privacy-First Approach",
      content: [
        "Wylloh is built on blockchain-native principles that respect your privacy by design.",
        "We do NOT collect personal information like names, emails, phone numbers, or addresses.",
        "Our analytics are based solely on public blockchain data (wallet activity) that is already transparent.",
        "No cookies, tracking pixels, or traditional web analytics are used to monitor your behavior.",
        "Your privacy is protected through decentralization - we cannot access what we don't collect.",
        "This approach makes Wylloh fundamentally more private than traditional web platforms."
      ]
    },
    {
      title: "2. What Information We Access",
      content: [
        "Wallet addresses: Public blockchain identifiers that you choose to connect to the platform.",
        "On-chain transactions: Public blockchain records of token ownership and transfers.",
        "Platform preferences: Settings you configure for your user interface experience.",
        "No tracking data: We do not use cookies, analytics, or behavioral tracking technologies.",
        "No personal identifiers: We cannot and do not link wallet addresses to real-world identities.",
        "All data we access is either public (blockchain) or voluntarily provided (preferences)."
      ]
    },
    {
      title: "3. Blockchain Transparency & Privacy",
      content: [
        "Blockchain transactions are public by design and provide transparency without compromising privacy.",
        "Your wallet address is pseudonymous - it's public but not linked to your personal identity.",
        "Token ownership and transfers are recorded on decentralized networks, not our servers.",
        "We cannot modify, delete, or hide blockchain records as they exist on distributed networks.",
        "This transparency enables trustless verification while maintaining pseudonymous privacy.",
        "You control your privacy level by choosing which wallet addresses to use with the platform."
      ]
    },
    {
      title: "4. What We Don't Collect",
      content: [
        "Personal information: No names, emails, phone numbers, or physical addresses.",
        "Browsing behavior: No tracking of your activity across websites or applications.",
        "Device fingerprinting: No collection of device-specific identifiers or characteristics.",
        "Location data: No GPS, IP-based location tracking, or geographic profiling.",
        "Biometric data: No facial recognition, fingerprints, or other biometric identifiers.",
        "Social connections: No access to your contacts, social media, or relationship data."
      ]
    },
    {
      title: "5. How We Use Blockchain Data",
      content: [
        "To verify token ownership and enable access to content you legitimately own.",
        "To display your digital collection and transaction history from public blockchain records.",
        "To process rights verification and royalty distribution based on token holdings.",
        "To provide platform analytics based on aggregated, anonymous wallet activity patterns.",
        "To ensure platform security by monitoring for suspicious on-chain activity.",
        "All usage is based on public blockchain data that is already transparent and verifiable."
      ]
    },
    {
      title: "6. Data Sharing and Third Parties",
      content: [
        "We do not sell, trade, or share any data with third parties for marketing purposes.",
        "Blockchain data is already public and accessible to anyone with blockchain analysis tools.",
        "We may use blockchain infrastructure providers (like Infura) who can see the same public data.",
        "Legal compliance may require sharing public blockchain data with authorities if requested.",
        "No personal information is shared because we don't collect personal information.",
        "Our decentralized approach minimizes data sharing risks by design."
      ]
    },
    {
      title: "7. Your Privacy Rights and Control",
      content: [
        "You control your privacy by choosing which wallet addresses to connect to the platform.",
        "You can disconnect your wallet at any time to stop platform access to your blockchain data.",
        "Platform preferences can be reset or modified through your user interface settings.",
        "Blockchain data cannot be deleted as it exists on decentralized networks beyond our control.",
        "You can use privacy-focused wallets or techniques to enhance your transaction privacy.",
        "No account deletion is needed since we don't maintain personal accounts or profiles."
      ]
    },
    {
      title: "8. Security and Data Protection",
      content: [
        "We implement industry-standard security for the minimal data we do handle (preferences).",
        "All platform communications use SSL/TLS encryption for data in transit.",
        "We cannot lose your personal data because we don't collect or store personal data.",
        "Blockchain data security is maintained by decentralized networks, not our servers.",
        "You are responsible for securing your wallet private keys and seed phrases.",
        "Our privacy-by-design approach eliminates most traditional data security risks."
      ]
    },
    {
      title: "9. No Cookies or Tracking",
      content: [
        "We do not use tracking cookies, analytics cookies, or advertising cookies.",
        "Essential technical cookies may be used only for basic platform functionality.",
        "No third-party tracking scripts or analytics services monitor your behavior.",
        "We do not participate in cross-site tracking or advertising networks.",
        "Your browser settings control any technical cookies we might use.",
        "Our blockchain-native approach eliminates the need for traditional web tracking."
      ]
    },
    {
      title: "10. Changes to This Privacy Policy",
      content: [
        "We may update this policy to reflect changes in our privacy practices or legal requirements.",
        "Significant changes will be communicated through platform notifications.",
        "Our commitment to privacy-first, blockchain-native principles will remain unchanged.",
        "Continued platform use after policy updates constitutes acceptance of changes.",
        "We encourage periodic review of this policy to stay informed about our practices.",
        "The effective date indicates when this policy was last updated."
      ]
    }
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 6 }}>
        {/* Header Section */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <PrivacyIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography 
            variant="h2" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 600,
              mb: 2,
              fontSize: { xs: '2.5rem', md: '3.5rem' }
            }}
          >
            Privacy Policy
          </Typography>
          <Typography 
            variant="h6" 
            color="text.secondary" 
            paragraph
            sx={{ 
              maxWidth: '600px',
              mx: 'auto',
              fontWeight: 400,
              lineHeight: 1.6,
            }}
          >
            Privacy-first blockchain platform with no personal data collection
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last updated: {lastUpdated}
          </Typography>
        </Box>

        {/* Privacy-First Notice */}
        <Alert 
          severity="success" 
          sx={{ mb: 4, p: 3 }}
          icon={<WalletIcon />}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Privacy-First Blockchain Platform
          </Typography>
          <Typography variant="body2">
            Wylloh respects your privacy through blockchain-native design. We use only public 
            blockchain data (wallet activity) for analytics and do not collect personal information, 
            use tracking cookies, or monitor your behavior. Your privacy is protected by design.
          </Typography>
        </Alert>

        {/* Data Collection Overview */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 4, 
            mb: 6,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <DataIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
              What We Access (All Public or Voluntary)
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {dataTypes.map((item, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    {item.type}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Privacy Policy Sections */}
        <Box sx={{ mb: 6 }}>
          {sections.map((section, index) => (
            <Accordion 
              key={index}
              elevation={0}
              sx={{ 
                border: '1px solid',
                borderColor: 'divider',
                '&:not(:last-child)': {
                  borderBottom: 0,
                },
                '&:before': {
                  display: 'none',
                },
                '&.Mui-expanded': {
                  margin: 0,
                }
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ 
                  px: 3,
                  py: 2,
                  '&.Mui-expanded': {
                    minHeight: 'auto',
                  },
                  '& .MuiAccordionSummary-content': {
                    margin: '12px 0',
                    '&.Mui-expanded': {
                      margin: '12px 0',
                    }
                  }
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {section.title}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 3, pb: 3 }}>
                <List dense>
                  {section.content.map((item, itemIndex) => (
                    <ListItem key={itemIndex} sx={{ px: 0, alignItems: 'flex-start' }}>
                      <ListItemText 
                        primary={item}
                        primaryTypographyProps={{
                          variant: 'body2',
                          sx: { lineHeight: 1.6, mb: 1 }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        {/* Privacy Benefits Section */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 4, 
            mb: 6,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <SecurityIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
              Privacy Benefits of Blockchain-Native Design
            </Typography>
          </Box>
          <Grid container spacing={2} justifyContent="center">
            {[
              "No Personal Data Collection",
              "No Behavioral Tracking", 
              "No Cookies or Analytics",
              "Wallet-Only Identity",
              "Decentralized by Design",
              "Transparent & Verifiable"
            ].map((benefit, index) => (
              <Grid item key={index}>
                <Chip 
                  label={benefit} 
                  variant="outlined" 
                  sx={{ 
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'primary.main',
                      color: 'white'
                    }
                  }}
                />
              </Grid>
            ))}
          </Grid>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 3 }}>
            Your privacy is protected by blockchain design, not just policy promises
          </Typography>
        </Paper>

        {/* Contact Information */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 4, 
            border: '1px solid',
            borderColor: 'divider',
            textAlign: 'center'
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Privacy Questions or Concerns?
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            If you have questions about this Privacy Policy or our blockchain-native privacy practices, 
            please contact our team.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Email: <strong>privacy@wylloh.com</strong>
          </Typography>
          <Divider sx={{ my: 3 }} />
          <Typography variant="body2" color="text.secondary">
            We are committed to privacy-first blockchain technology and will respond to inquiries within 5 business days.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default PrivacyPage; 