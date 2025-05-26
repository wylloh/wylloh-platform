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
  Public as BlockchainIcon
} from '@mui/icons-material';

const PrivacyPage: React.FC = () => {
  const lastUpdated = "January 2024";

  const dataTypes = [
    { type: "Account Information", description: "Email, wallet address, profile preferences" },
    { type: "Usage Data", description: "Platform interactions, content views, transaction history" },
    { type: "Technical Data", description: "IP address, browser type, device information" },
    { type: "Blockchain Data", description: "Public wallet transactions, token ownership records" }
  ];

  const sections = [
    {
      title: "1. Information We Collect",
      content: [
        "We collect information you provide directly, such as when you create an account, connect your wallet, or contact our support team.",
        "We automatically collect certain information about your device and usage of the platform, including IP address, browser type, and interaction patterns.",
        "Blockchain data is collected from public blockchain networks, including wallet addresses, transaction hashes, and token ownership records.",
        "We may collect information from third-party services like wallet providers when you connect external services to your account.",
        "Analytics data helps us understand platform usage patterns and improve user experience while maintaining privacy."
      ]
    },
    {
      title: "2. How We Use Your Information",
      content: [
        "To provide, maintain, and improve the Wylloh platform and its features.",
        "To process transactions, verify token ownership, and manage your digital content library.",
        "To communicate with you about your account, platform updates, and customer support.",
        "To analyze platform usage and performance to enhance user experience and security.",
        "To comply with legal obligations and protect against fraud or security threats.",
        "To personalize your experience and provide relevant content recommendations."
      ]
    },
    {
      title: "3. Blockchain and Public Data",
      content: [
        "Blockchain transactions are public by nature and permanently recorded on distributed networks.",
        "Your wallet address and token ownership may be visible to anyone with blockchain analysis tools.",
        "We cannot modify or delete blockchain records, as they are maintained by decentralized networks.",
        "Smart contract interactions and token transfers are publicly auditable and traceable.",
        "Consider using privacy-focused wallets or techniques if you prefer enhanced transaction privacy."
      ]
    },
    {
      title: "4. Information Sharing and Disclosure",
      content: [
        "We do not sell, trade, or rent your personal information to third parties for marketing purposes.",
        "We may share information with service providers who assist in platform operations under strict confidentiality agreements.",
        "Legal compliance may require disclosure of information to law enforcement or regulatory authorities.",
        "In case of business transfer or merger, user information may be transferred as part of business assets.",
        "We may share aggregated, anonymized data for research or business purposes that cannot identify individual users."
      ]
    },
    {
      title: "5. Data Security and Protection",
      content: [
        "We implement industry-standard security measures to protect your personal information.",
        "All data transmission is encrypted using SSL/TLS protocols and secure communication channels.",
        "Access to personal information is restricted to authorized personnel who need it for legitimate business purposes.",
        "We regularly review and update our security practices to address emerging threats and vulnerabilities.",
        "Users are responsible for maintaining the security of their wallet private keys and account credentials.",
        "We cannot recover lost private keys or reverse blockchain transactions due to their decentralized nature."
      ]
    },
    {
      title: "6. Your Privacy Rights",
      content: [
        "You have the right to access, update, or delete your personal information stored on our platform.",
        "You can request a copy of the personal data we have collected about you.",
        "You may opt out of non-essential communications and marketing materials.",
        "You can request restriction of processing or object to certain uses of your information.",
        "Note that blockchain data cannot be deleted or modified due to the immutable nature of distributed ledgers.",
        "Contact our privacy team to exercise any of these rights or ask questions about your data."
      ]
    },
    {
      title: "7. Cookies and Tracking Technologies",
      content: [
        "We use cookies and similar technologies to enhance platform functionality and user experience.",
        "Essential cookies are necessary for platform operation and cannot be disabled.",
        "Analytics cookies help us understand usage patterns and improve platform performance.",
        "You can control cookie preferences through your browser settings.",
        "Third-party services integrated with the platform may use their own tracking technologies.",
        "We do not use cookies for targeted advertising or cross-site tracking."
      ]
    },
    {
      title: "8. International Data Transfers",
      content: [
        "Your information may be processed and stored in countries other than your residence.",
        "We ensure appropriate safeguards are in place for international data transfers.",
        "Blockchain networks are global and decentralized, making data location control impossible.",
        "We comply with applicable data protection laws in jurisdictions where we operate.",
        "Users in the EU have specific rights under GDPR that we respect and uphold."
      ]
    },
    {
      title: "9. Children's Privacy",
      content: [
        "The Wylloh platform is not intended for use by children under 13 years of age.",
        "We do not knowingly collect personal information from children under 13.",
        "If we become aware that we have collected information from a child under 13, we will delete it promptly.",
        "Parents or guardians who believe their child has provided information should contact us immediately.",
        "Users between 13-18 should have parental consent before using the platform."
      ]
    },
    {
      title: "10. Changes to This Privacy Policy",
      content: [
        "We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements.",
        "We will notify users of significant changes through platform notifications or email.",
        "Continued use of the platform after policy updates constitutes acceptance of the changes.",
        "We encourage users to review this policy periodically to stay informed about our privacy practices.",
        "The effective date at the top of this policy indicates when it was last updated."
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
            How we collect, use, and protect your personal information
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last updated: {lastUpdated}
          </Typography>
        </Box>

        {/* Blockchain Privacy Notice */}
        <Alert 
          severity="warning" 
          sx={{ mb: 4, p: 3 }}
          icon={<BlockchainIcon />}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Important: Blockchain Privacy Considerations
          </Typography>
          <Typography variant="body2">
            This platform uses blockchain technology where transactions are public and permanent. 
            While we protect your personal information, blockchain data (wallet addresses, transactions) 
            may be publicly visible and cannot be deleted or modified.
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
              Types of Information We Collect
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

        {/* Your Rights Section */}
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
              Your Privacy Rights
            </Typography>
          </Box>
          <Grid container spacing={2} justifyContent="center">
            {[
              "Access Your Data",
              "Update Information", 
              "Delete Account",
              "Data Portability",
              "Opt-out Communications",
              "Restrict Processing"
            ].map((right, index) => (
              <Grid item key={index}>
                <Chip 
                  label={right} 
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
            Contact us at <strong>privacy@wylloh.com</strong> to exercise any of these rights
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
            If you have questions about this Privacy Policy or our data practices, 
            please contact our privacy team.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Email: <strong>privacy@wylloh.com</strong>
          </Typography>
          <Divider sx={{ my: 3 }} />
          <Typography variant="body2" color="text.secondary">
            We are committed to protecting your privacy and will respond to inquiries within 5 business days.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default PrivacyPage; 