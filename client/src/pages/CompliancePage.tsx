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
  Grid,
  Card,
  CardContent,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Token as TokenIcon,
  Security as SecurityIcon,
  Gavel as LegalIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Movie as MovieIcon
} from '@mui/icons-material';

const CompliancePage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const lastUpdated = "February 2025";

  const utilityFeatures = [
    {
      tokens: "1 Token",
      rights: "Personal Viewing",
      description: "Watch content on your personal devices, like owning a DVD"
    },
    {
      tokens: "100 Tokens",
      rights: "Small Venue Screening",
      description: "Screen content in venues up to 50 seats"
    },
    {
      tokens: "5,000 Tokens",
      rights: "Streaming Platform Rights",
      description: "License content for streaming platforms with IMF file access"
    },
    {
      tokens: "10,000 Tokens",
      rights: "Theatrical Exhibition",
      description: "Show content in theaters with DCP file access"
    },
    {
      tokens: "50,000 Tokens",
      rights: "National Distribution",
      description: "Distribute content nationally across multiple channels"
    }
  ];

  const compliancePoints = [
    {
      title: "Immediate Utility",
      description: "Tokens provide instant access to content and platform features"
    },
    {
      title: "Consumptive Use",
      description: "Tokens are used to consume digital content, not for investment"
    },
    {
      title: "No Profit Expectation",
      description: "Value comes from content access, not from others' efforts"
    },
    {
      title: "Self-Executing Rights",
      description: "Smart contracts automatically deliver utility without intermediaries"
    }
  ];

  const sections = [
    {
      title: "What Are Wylloh Tokens?",
      content: [
        "Wylloh tokens are utility tokens that provide access rights to digital film content.",
        "Each token represents a license to view, download, or distribute specific content.",
        "Tokens work like digital DVDs - they give you permanent access to the content you purchase.",
        "The more tokens you hold for a piece of content, the more rights you unlock.",
        "All token functions are automated through smart contracts on the blockchain."
      ]
    },
    {
      title: "Why Tokens Are Not Securities",
      content: [
        "Wylloh tokens are designed as utility tokens, not investment securities.",
        "They provide immediate, consumable value through content access rights.",
        "Token value comes from the utility they provide, not from others' efforts.",
        "There are no promises of profits, dividends, or investment returns.",
        "Tokens function independently of platform management or business success."
      ]
    },
    {
      title: "Legal Classification",
      content: [
        "Under the Howey Test (the standard for determining securities), Wylloh tokens fail to qualify as securities.",
        "While tokens involve an investment of money, they lack the other required elements:",
        "• No common enterprise or pooled investments",
        "• No expectation of profits from others' efforts", 
        "• Value derives from utility, not business performance",
        "This classification has been reviewed by legal counsel and documented in our compliance materials."
      ]
    },
    {
      title: "Token Utility Functions",
      content: [
        "Content Access: Stream or download films you own tokens for",
        "Rights Stacking: Combine tokens to unlock commercial distribution rights",
        "Content Lending: Lend your tokens to others through smart contracts",
        "Platform Features: Access enhanced features based on token holdings",
        "Cross-Platform Rights: Use tokens across any Wylloh-compatible platform"
      ]
    },
    {
      title: "Regulatory Compliance",
      content: [
        "We maintain ongoing compliance with applicable regulations in all jurisdictions where we operate.",
        "Our legal team regularly reviews token mechanics and documentation for compliance.",
        "We monitor regulatory developments and update our practices as needed.",
        "All marketing and communications emphasize utility over investment characteristics.",
        "We cooperate fully with regulatory authorities and maintain transparent operations."
      ]
    },
    {
      title: "User Responsibilities",
      content: [
        "Users should understand that tokens provide utility, not investment opportunities.",
        "Token purchases should be based on desired content access, not speculation.",
        "Users are responsible for understanding the utility nature of their token purchases.",
        "Secondary market trading does not change the underlying utility purpose of tokens.",
        "Users should consult their own legal or financial advisors if they have questions about token classification."
      ]
    }
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 6 }}>
        {/* Header Section */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <TokenIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
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
            Compliance
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
            Understanding Wylloh tokens as utility tokens, not securities
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last updated: {lastUpdated}
          </Typography>
        </Box>

        {/* Key Classification Notice */}
        <Alert 
          severity="success" 
          sx={{ mb: 4, p: 3 }}
          icon={<CheckIcon />}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Utility Token Classification
          </Typography>
          <Typography variant="body2">
            Wylloh tokens are utility tokens that provide access rights to digital content. 
            They are not securities and do not represent investment contracts or profit-sharing arrangements.
            All token functions provide immediate, consumable utility through content access and platform features.
          </Typography>
        </Alert>

        {/* Token Utility Overview */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            How Tokens Work
          </Typography>
          <Grid container spacing={3}>
            {utilityFeatures.map((feature, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
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
                      <MovieIcon sx={{ color: 'primary.main', mr: 1 }} />
                      <Chip 
                        label={feature.tokens} 
                        color="primary" 
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      {feature.rights}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Compliance Features */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Why These Are Utility Tokens
          </Typography>
          <Grid container spacing={3}>
            {compliancePoints.map((point, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', p: 2 }}>
                  <CheckIcon sx={{ color: 'success.main', mr: 2, mt: 0.5 }} />
                  <Box>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      {point.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {point.description}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Detailed Sections */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Detailed Information
          </Typography>
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

        {/* Important Disclaimer */}
        <Alert 
          severity="info" 
          sx={{ mb: 4, p: 3 }}
          icon={<InfoIcon />}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Important Disclaimer
          </Typography>
          <Typography variant="body2" paragraph>
            This page provides general information about Wylloh token classification and compliance. 
            It is not legal or financial advice. Users should consult their own legal or financial 
            advisors if they have questions about token classification or regulatory compliance.
          </Typography>
          <Typography variant="body2">
            Token classification may vary by jurisdiction. Our compliance analysis is based on 
            current U.S. regulations and may not apply in all jurisdictions where tokens are used.
          </Typography>
        </Alert>

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
          <LegalIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Questions About Token Compliance?
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            If you have questions about our token classification or compliance practices, 
            please contact our legal team.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Email: <strong>legal@wylloh.com</strong>
          </Typography>
          <Divider sx={{ my: 3 }} />
          <Typography variant="body2" color="text.secondary">
            Our commitment to regulatory compliance ensures that Wylloh tokens provide 
            clear utility value while operating within applicable legal frameworks.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default CompliancePage; 