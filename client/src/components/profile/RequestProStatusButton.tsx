import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Stack,
  Grid,
  Paper,
  Divider
} from '@mui/material';
import { VerifiedUser, MovieFilter } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { ProVerificationData } from '../../contexts/AuthContext';

const RequestProStatusButton: React.FC = () => {
  const { user, requestProStatus, loading, error } = useAuth();
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<ProVerificationData>({
    fullName: '',
    biography: '',
    professionalLinks: {
      imdb: '',
      website: '',
      vimeo: '',
      linkedin: ''
    },
    filmographyHighlights: ''
  });

  const handleOpen = () => {
    setOpen(true);
    setSuccess(false);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent as keyof ProVerificationData] as any,
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await requestProStatus(formData);
    if (result) {
      setSuccess(true);
    }
  };

  // If user already has pro status or has a pending request, show status instead of request button
  if (user?.proStatus) {
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          borderRadius: 2, 
          bgcolor: user.proStatus === 'verified' ? 'success.light' : 'warning.light',
          color: user.proStatus === 'verified' ? 'success.contrastText' : 'warning.contrastText',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        {user.proStatus === 'verified' ? (
          <>
            <VerifiedUser />
            <Typography variant="body1">
              <strong>Pro Status: Verified</strong>
            </Typography>
          </>
        ) : user.proStatus === 'pending' ? (
          <>
            <MovieFilter />
            <Typography variant="body1">
              <strong>Pro Status: Pending Review</strong>
            </Typography>
          </>
        ) : (
          <>
            <MovieFilter />
            <Typography variant="body1">
              <strong>Pro Status: Rejected</strong> - Please contact support
            </Typography>
          </>
        )}
      </Paper>
    );
  }

  return (
    <>
      <Button 
        variant="contained" 
        onClick={handleOpen}
        startIcon={<VerifiedUser />}
        sx={{ 
          backgroundColor: 'secondary.main',
          '&:hover': {
            backgroundColor: 'secondary.dark',
          }
        }}
      >
        Request Pro Status
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <VerifiedUser color="secondary" />
            <Typography variant="h5" component="div">
              Request Pro Status
            </Typography>
          </Box>
        </DialogTitle>

        <Divider />

        <DialogContent>
          {success ? (
            <Box my={3}>
              <Alert severity="success" sx={{ mb: 2 }}>
                Your Pro Status request has been submitted successfully! Our team will review your request shortly.
              </Alert>
              <Typography variant="body1">
                You can check the status of your request on your profile page. If approved, you will receive:
              </Typography>
              <ul>
                <li>A verified Pro badge on your profile</li>
                <li>Access to premium creator tools and analytics</li>
                <li>Featured placement in the marketplace</li>
                <li>Higher revenue share percentages</li>
              </ul>
            </Box>
          ) : (
            <>
              <DialogContentText sx={{ mb: 3 }}>
                Pro status unlocks premium features for professional filmmakers and content creators.
                Please provide information about your professional background for our verification team.
              </DialogContentText>

              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      name="fullName"
                      label="Full Name"
                      value={formData.fullName}
                      onChange={handleChange}
                      fullWidth
                      required
                      variant="outlined"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      name="biography"
                      label="Professional Biography"
                      value={formData.biography}
                      onChange={handleChange}
                      fullWidth
                      required
                      multiline
                      rows={4}
                      variant="outlined"
                      helperText="Describe your background and experience in the film industry"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                      Professional Links
                    </Typography>
                    <Stack spacing={2}>
                      <TextField
                        name="professionalLinks.imdb"
                        label="IMDB Profile"
                        value={formData.professionalLinks.imdb}
                        onChange={handleChange}
                        fullWidth
                        variant="outlined"
                        placeholder="https://www.imdb.com/name/..."
                      />
                      <TextField
                        name="professionalLinks.website"
                        label="Personal/Company Website"
                        value={formData.professionalLinks.website}
                        onChange={handleChange}
                        fullWidth
                        variant="outlined"
                        placeholder="https://..."
                      />
                      <TextField
                        name="professionalLinks.vimeo"
                        label="Vimeo Profile"
                        value={formData.professionalLinks.vimeo}
                        onChange={handleChange}
                        fullWidth
                        variant="outlined"
                        placeholder="https://vimeo.com/..."
                      />
                      <TextField
                        name="professionalLinks.linkedin"
                        label="LinkedIn Profile"
                        value={formData.professionalLinks.linkedin}
                        onChange={handleChange}
                        fullWidth
                        variant="outlined"
                        placeholder="https://www.linkedin.com/in/..."
                      />
                    </Stack>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      name="filmographyHighlights"
                      label="Filmography Highlights"
                      value={formData.filmographyHighlights}
                      onChange={handleChange}
                      fullWidth
                      multiline
                      rows={4}
                      variant="outlined"
                      helperText="List your key works, film credits, awards, or achievements"
                    />
                  </Grid>

                  {error && (
                    <Grid item xs={12}>
                      <Alert severity="error">{error}</Alert>
                    </Grid>
                  )}
                </Grid>
              </form>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          {success ? (
            <Button onClick={handleClose} variant="contained" color="primary">
              Close
            </Button>
          ) : (
            <>
              <Button onClick={handleClose} color="inherit">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                variant="contained"
                color="secondary"
                disabled={loading || !formData.fullName || !formData.biography}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
              >
                Submit Request
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RequestProStatusButton; 