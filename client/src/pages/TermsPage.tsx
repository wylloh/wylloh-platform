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
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Gavel as LegalIcon,
  Security as SecurityIcon,
  AccountBalance as BlockchainIcon
} from '@mui/icons-material';

const TermsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const lastUpdated = "January 2024";

  const sections = [
    {
      title: "1. Platform Overview and Acceptance",
      content: [
        "Wylloh is a blockchain-based platform that enables filmmakers to tokenize and distribute their content while providing collectors with permanent access rights to digital film collections.",
        "By accessing or using the Wylloh platform, you agree to be bound by these Terms of Service and all applicable laws and regulations.",
        "If you do not agree with any of these terms, you are prohibited from using or accessing this platform.",
        "These terms may be updated from time to time, and continued use of the platform constitutes acceptance of any changes."
      ]
    },
    {
      title: "2. Token Rights and Ownership",
      content: [
        "Tokens purchased on Wylloh represent perpetual access rights to specific content, not copyright ownership of the underlying films or intellectual property.",
        "Token holders receive indefinite rights to download, stream, and personally view the associated content, similar to owning physical media.",
        "Stacking multiple tokens may unlock additional distribution rights as specified in the token metadata and platform documentation.",
        "All intellectual property rights, including copyrights, remain with the original creators, studios, or rights holders.",
        "Tokens are non-refundable digital assets recorded on the blockchain and cannot be reversed or canceled once minted."
      ]
    },
    {
      title: "3. User Responsibilities",
      content: [
        "Users must provide accurate information during registration and maintain the security of their wallet and account credentials.",
        "Users are responsible for all activities that occur under their account and for maintaining the confidentiality of their private keys.",
        "Users must comply with all applicable laws and regulations in their jurisdiction regarding digital assets and content consumption.",
        "Users agree not to use the platform for any unlawful purpose or in any way that could damage, disable, or impair the platform.",
        "Users must respect the intellectual property rights of content creators and not redistribute content beyond their granted rights."
      ]
    },
    {
      title: "4. Content and Intellectual Property",
      content: [
        "All content on the platform is protected by copyright and other intellectual property laws.",
        "Content creators retain all rights to their intellectual property and grant limited access rights through token purchases.",
        "Users may not reproduce, distribute, modify, or create derivative works from platform content except as explicitly permitted by their token rights.",
        "Wylloh respects intellectual property rights and will respond to valid DMCA takedown notices in accordance with applicable law.",
        "Any user-generated content submitted to the platform must not infringe on third-party rights and becomes subject to our content policies."
      ]
    },
    {
      title: "5. Blockchain and Smart Contracts",
      content: [
        "The platform utilizes blockchain technology and smart contracts to manage token creation, distribution, and rights verification.",
        "Blockchain transactions are irreversible, and users acknowledge the permanent nature of their token purchases.",
        "Smart contract functionality is provided 'as is' and users acknowledge the inherent risks of blockchain technology.",
        "Wylloh is not responsible for blockchain network fees, congestion, or technical issues beyond our control.",
        "Users are responsible for understanding the blockchain networks they interact with and any associated risks."
      ]
    },
    {
      title: "6. Privacy and Data Protection",
      content: [
        "User privacy is important to us, and our data practices are detailed in our Privacy Policy.",
        "We collect and process personal information necessary to provide platform services and comply with legal obligations.",
        "Blockchain transactions are public by nature, and users acknowledge that token ownership and transfers may be publicly visible.",
        "We implement appropriate security measures to protect user data but cannot guarantee absolute security.",
        "Users have rights regarding their personal data as outlined in our Privacy Policy and applicable privacy laws."
      ]
    },
    {
      title: "7. Platform Availability and Modifications",
      content: [
        "We strive to maintain platform availability but do not guarantee uninterrupted service.",
        "We reserve the right to modify, suspend, or discontinue any aspect of the platform with reasonable notice.",
        "Scheduled maintenance and updates may temporarily affect platform availability.",
        "We may update these terms, platform features, or policies as necessary for legal compliance or service improvement.",
        "Critical security updates may be implemented immediately without prior notice."
      ]
    },
    {
      title: "8. Limitation of Liability",
      content: [
        "The platform is provided 'as is' without warranties of any kind, express or implied.",
        "Wylloh shall not be liable for any indirect, incidental, special, or consequential damages.",
        "Our total liability for any claims related to the platform shall not exceed the amount paid by the user in the preceding 12 months.",
        "Users acknowledge the experimental nature of blockchain technology and accept associated risks.",
        "We are not responsible for losses due to user error, forgotten passwords, or compromised private keys."
      ]
    },
    {
      title: "9. Dispute Resolution",
      content: [
        "Any disputes arising from these terms or platform use shall be resolved through binding arbitration.",
        "Arbitration shall be conducted in accordance with the rules of the American Arbitration Association.",
        "Users waive the right to participate in class action lawsuits or class-wide arbitration.",
        "These terms shall be governed by the laws of [Jurisdiction] without regard to conflict of law principles.",
        "If any provision of these terms is found unenforceable, the remaining provisions shall remain in full force."
      ]
    },
    {
      title: "10. Contact Information",
      content: [
        "For questions about these Terms of Service, please contact us at legal@wylloh.com.",
        "For technical support or platform issues, contact support@wylloh.com.",
        "For content or copyright concerns, contact copyright@wylloh.com.",
        "Mailing address: [Company Address - To be updated]",
        "We will respond to inquiries within 5 business days."
      ]
    }
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 6 }}>
        {/* Header Section */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <LegalIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
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
            Terms of Service
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
            Legal terms governing your use of the Wylloh platform
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last updated: {lastUpdated}
          </Typography>
        </Box>

        {/* Important Notice */}
        <Alert 
          severity="info" 
          sx={{ mb: 4, p: 3 }}
          icon={<BlockchainIcon />}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Important: Blockchain-Based Platform
          </Typography>
          <Typography variant="body2">
            Wylloh utilizes blockchain technology for token management and rights verification. 
            All transactions are permanent and irreversible. Please read these terms carefully 
            and ensure you understand the implications of blockchain-based digital asset ownership.
          </Typography>
        </Alert>

        {/* Terms Sections */}
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

        {/* Footer Notice */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 4, 
            border: '1px solid',
            borderColor: 'divider',
            textAlign: 'center'
          }}
        >
          <SecurityIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Questions About These Terms?
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            If you have any questions about these Terms of Service or need clarification 
            on any provisions, please contact our legal team.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Email: <strong>legal@wylloh.com</strong>
          </Typography>
          <Divider sx={{ my: 3 }} />
          <Typography variant="body2" color="text.secondary">
            By using the Wylloh platform, you acknowledge that you have read, understood, 
            and agree to be bound by these Terms of Service.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default TermsPage; 