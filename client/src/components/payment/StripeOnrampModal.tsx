import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  IconButton
} from '@mui/material';
import { Close, CreditCard, AccountBalanceWallet, CheckCircle } from '@mui/icons-material';
import { stripeOnrampService, StripeOnrampSession } from '../../services/stripeOnramp.service';

interface StripeOnrampModalProps {
  open: boolean;
  onClose: () => void;
  walletAddress: string;
  requiredAmount: string;
  contentTitle: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const steps = [
  'Verify Amount',
  'Add USDC',
  'Complete Purchase'
];

export const StripeOnrampModal: React.FC<StripeOnrampModalProps> = ({
  open,
  onClose,
  walletAddress,
  requiredAmount,
  contentTitle,
  onSuccess,
  onError
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<StripeOnrampSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fundingInProgress, setFundingInProgress] = useState(false);

  useEffect(() => {
    if (open && !session) {
      initializeOnramp();
    }
  }, [open, walletAddress, requiredAmount]);

  const initializeOnramp = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if Stripe onramp is available
      if (!stripeOnrampService.isEnabled()) {
        throw new Error('Stripe onramp is not available in your region');
      }

      // Initialize the onramp session
      const newSession = await stripeOnrampService.initializeStripeOnramp(
        walletAddress,
        requiredAmount
      );
      
      setSession(newSession);
      console.log('🎬 Onramp session initialized for:', contentTitle);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize payment system';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToFunding = async () => {
    if (!session) return;

    try {
      setLoading(true);
      setCurrentStep(1);

      // Embed the Stripe widget
      await stripeOnrampService.embedOnrampWidget('stripe-onramp-container', session);
      
      console.log('🎨 Stripe widget embedded, waiting for user completion...');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load payment interface';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmFunding = async () => {
    if (!session) return;

    try {
      setFundingInProgress(true);
      setCurrentStep(2);

      console.log('⏳ Waiting for USDC funding completion...');
      
      // Wait for funding to complete
      const success = await stripeOnrampService.waitForFunding(session.id);
      
      if (success) {
        console.log('✅ USDC funding successful!');
        setCurrentStep(3);
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      } else {
        throw new Error('Funding was not completed. Please try again.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Funding process failed';
      setError(errorMessage);
      onError(errorMessage);
      setCurrentStep(1); // Back to funding step
    } finally {
      setFundingInProgress(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setSession(null);
    setError(null);
    setFundingInProgress(false);
    onClose();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="h6" gutterBottom>
              💳 Add USDC to Purchase Film
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              You'll need <strong>${requiredAmount} USDC</strong> to purchase "{contentTitle}"
            </Typography>
            
            <Card sx={{ mb: 3, backgroundColor: 'rgba(102, 126, 234, 0.1)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                  <CreditCard sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Secure Credit Card Payment</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  • Pay with your credit card or digital wallet<br/>
                  • Powered by Stripe (bank-level security)<br/>
                  • Instant USDC delivery to your wallet<br/>
                  • No hidden fees or surprises
                </Typography>
              </CardContent>
            </Card>

            <Button
              variant="contained"
              size="large"
              onClick={handleProceedToFunding}
              disabled={loading || !session}
              startIcon={loading ? <CircularProgress size={20} /> : <CreditCard />}
              sx={{ minWidth: 200 }}
            >
              {loading ? 'Loading...' : `Add $${requiredAmount} USDC`}
            </Button>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ py: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
              💳 Complete Your Payment
            </Typography>
            
            {/* Stripe Widget Container */}
            <Box
              id="stripe-onramp-container"
              sx={{
                minHeight: 400,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                mb: 3
              }}
            />

            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleConfirmFunding}
                disabled={fundingInProgress}
                startIcon={fundingInProgress ? <CircularProgress size={20} /> : <AccountBalanceWallet />}
                sx={{ minWidth: 200 }}
              >
                {fundingInProgress ? 'Processing...' : 'Confirm Funding'}
              </Button>
              <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                Click after completing your payment above
              </Typography>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h6" gutterBottom>
              ⏳ Processing Your Payment
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Please wait while we confirm your USDC funding...
            </Typography>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              ✅ Payment Successful!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your wallet has been funded with ${requiredAmount} USDC
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  const getDialogTitle = () => {
    switch (currentStep) {
      case 0: return 'Add USDC to Your Wallet';
      case 1: return 'Complete Payment';
      case 2: return 'Processing Payment';
      case 3: return 'Payment Complete';
      default: return 'Add USDC';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={currentStep < 2 ? handleClose : undefined}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={currentStep >= 2}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">{getDialogTitle()}</Typography>
        {currentStep < 2 && (
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent>
        {/* Progress Stepper */}
        <Stepper activeStep={currentStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Step Content */}
        {renderStepContent()}
      </DialogContent>

      {currentStep < 2 && (
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} disabled={loading || fundingInProgress}>
            Cancel
          </Button>
          {currentStep === 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1, textAlign: 'center' }}>
              Secure payment powered by Stripe
            </Typography>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
}; 