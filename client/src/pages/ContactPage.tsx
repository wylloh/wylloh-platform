import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import {
  Email as EmailIcon,
  Support as SupportIcon,
  Security as SecurityIcon,
  Business as BusinessIcon,
  Send as SendIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (event: SelectChangeEvent) => {
    setFormData(prev => ({
      ...prev,
      category: event.target.value
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // In a real implementation, this would send the form data to a backend
    console.log('Form submitted:', formData);
    setSubmitted(true);
    // Reset form after submission
    setTimeout(() => {
      setFormData({
        name: '',
        email: '',
        subject: '',
        category: '',
        message: ''
      });
      setSubmitted(false);
    }, 3000);
  };

  const contactMethods = [
    {
      icon: <SupportIcon />,
      title: "General Support",
      description: "Platform questions, account issues, technical support",
      email: "support@wylloh.com",
      response: "Within 24 hours"
    },
    {
      icon: <SecurityIcon />,
      title: "Security & Privacy",
      description: "Security concerns, privacy questions, vulnerability reports",
      email: "security@wylloh.com",
      response: "Within 12 hours"
    },
    {
      icon: <BusinessIcon />,
      title: "Business Inquiries",
      description: "Partnerships, licensing, enterprise solutions",
      email: "business@wylloh.com",
      response: "Within 48 hours"
    },
    {
      icon: <EmailIcon />,
      title: "Legal & Compliance",
      description: "Legal questions, DMCA notices, compliance matters",
      email: "legal@wylloh.com",
      response: "Within 5 business days"
    }
  ];

  const categories = [
    "General Question",
    "Technical Support",
    "Account Issue",
    "Security Concern",
    "Business Inquiry",
    "Legal Matter",
    "Feature Request",
    "Bug Report",
    "Other"
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 6 }}>
        {/* Header Section */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <EmailIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
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
            Contact Us
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
            Get in touch with our team for support, questions, or business inquiries
          </Typography>
        </Box>

        <Grid container spacing={6}>
          {/* Contact Form */}
          <Grid item xs={12} md={7}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 4,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Send us a Message
              </Typography>
              
              {submitted && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  Thank you for your message! We'll get back to you soon.
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Your Name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={formData.category}
                        label="Category"
                        onChange={handleSelectChange}
                      >
                        {categories.map((category) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      multiline
                      rows={6}
                      variant="outlined"
                      placeholder="Please provide as much detail as possible to help us assist you effectively..."
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      startIcon={<SendIcon />}
                      sx={{ 
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem'
                      }}
                    >
                      Send Message
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>

          {/* Contact Information */}
          <Grid item xs={12} md={5}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Contact Methods
              </Typography>
              <Grid container spacing={3}>
                {contactMethods.map((method, index) => (
                  <Grid item xs={12} key={index}>
                    <Card 
                      elevation={0}
                      sx={{ 
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
                            {method.icon}
                          </Box>
                          <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                            {method.title}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {method.description}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                          {method.email}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Response time: {method.response}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Additional Information */}
            <Paper 
              elevation={0}
              sx={{ 
                p: 3,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Additional Information
              </Typography>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <ScheduleIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Business Hours"
                    secondary="Monday - Friday, 9:00 AM - 6:00 PM PST"
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                    secondaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <LocationIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Location"
                    secondary="Los Angeles, California, USA"
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                    secondaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <PhoneIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Emergency Security"
                    secondary="For urgent security matters only"
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                    secondaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              </List>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                We're committed to responding to all inquiries promptly and professionally.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default ContactPage; 