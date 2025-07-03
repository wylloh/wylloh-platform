import { loadStripe, Stripe } from '@stripe/stripe-js';

export interface StripeOnrampSession {
  id: string;
  walletAddress: string;
  requiredAmount: string;
  cryptocurrency: string;
  status: 'created' | 'pending' | 'completed' | 'failed';
  stripeSessionId?: string;
}

export interface StripeOnrampConfig {
  destinationWallet: string;
  destinationCurrency: 'usdc';
  destinationNetwork: 'polygon';
  destinationAmount: string;
  theme?: 'wylloh_dark_theme' | 'wylloh_light_theme';
}

/**
 * Service for handling Stripe fiat-to-crypto onramp integration
 * Provides seamless credit card to USDC conversion for film token purchases
 */
class StripeOnrampService {
  private stripe: Stripe | null = null;
  private isInitialized: boolean = false;

  /**
   * Initialize Stripe with publishable key
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const publishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      throw new Error('Stripe publishable key not configured');
    }

    this.stripe = await loadStripe(publishableKey);
    if (!this.stripe) {
      throw new Error('Failed to initialize Stripe');
    }

    this.isInitialized = true;
    console.log('✅ StripeOnrampService initialized');
  }

  /**
   * Check if Stripe onramp is enabled and configured
   */
  isEnabled(): boolean {
    // Enable if Stripe publishable key is configured
    const publishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
    return !!publishableKey && publishableKey.length > 0;
  }

  /**
   * Detect if user has insufficient USDC balance for purchase
   * @param requiredAmount Required amount in USDC
   * @param walletAddress User's wallet address
   */
  async detectInsufficientBalance(
    requiredAmount: string,
    walletAddress: string
  ): Promise<boolean> {
    try {
      // In production, this would check actual USDC balance
      // For now, we'll simulate balance checking logic
      
      console.log(`🔍 Checking USDC balance for ${walletAddress}`);
      console.log(`💰 Required: $${requiredAmount} USDC`);

      // TODO: Implement actual USDC balance check via Polygon RPC
      // const usdcBalance = await this.getUSDCBalance(walletAddress);
      // return parseFloat(usdcBalance) < parseFloat(requiredAmount);

      // For demo: simulate insufficient balance scenario
      const hasInsufficientBalance = Math.random() < 0.3; // 30% chance for demo
      console.log(`💳 Balance check result: ${hasInsufficientBalance ? 'Insufficient' : 'Sufficient'}`);
      
      return hasInsufficientBalance;
    } catch (error) {
      console.error('❌ Error checking balance:', error);
      return true; // Default to showing Stripe option on error
    }
  }

  /**
   * Initialize Stripe crypto onramp session
   * @param walletAddress Destination wallet address
   * @param requiredAmount Amount needed in USDC
   * @param cryptocurrency Target cryptocurrency (default: USDC)
   */
  async initializeStripeOnramp(
    walletAddress: string,
    requiredAmount: string,
    cryptocurrency: 'USDC-POLYGON' = 'USDC-POLYGON'
  ): Promise<StripeOnrampSession> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    try {
      console.log('🚀 Initializing Stripe onramp session...');
      console.log(`📍 Wallet: ${walletAddress}`);
      console.log(`💰 Amount: $${requiredAmount} USDC`);

      const config: StripeOnrampConfig = {
        destinationWallet: walletAddress,
        destinationCurrency: 'usdc',
        destinationNetwork: 'polygon',
        destinationAmount: requiredAmount,
        theme: 'wylloh_dark_theme'
      };

      // Create onramp session via Stripe API
      // Note: In production, this would call your backend API which then calls Stripe
      const sessionId = `onramp_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const session: StripeOnrampSession = {
        id: sessionId,
        walletAddress,
        requiredAmount,
        cryptocurrency,
        status: 'created',
        stripeSessionId: sessionId
      };

      console.log('✅ Stripe onramp session created:', session.id);
      return session;
    } catch (error) {
      console.error('❌ Error initializing Stripe onramp:', error);
      throw new Error('Failed to initialize Stripe onramp');
    }
  }

  /**
   * Embed Stripe onramp widget in specified container
   * @param containerId HTML element ID to embed widget
   * @param session Onramp session configuration
   */
  async embedOnrampWidget(
    containerId: string,
    session: StripeOnrampSession
  ): Promise<void> {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    try {
      console.log(`🎨 Embedding Stripe widget in #${containerId}`);

      // In production, this would use Stripe's actual crypto onramp embed
      // For now, we'll create a placeholder
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error(`Container #${containerId} not found`);
      }

      // Demo: Create styled placeholder for Stripe widget
      container.innerHTML = `
        <div style="
          padding: 24px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
          min-height: 400px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        ">
          <h3 style="margin: 0 0 16px 0;">🎬 Add USDC to Purchase Film</h3>
          <p style="margin: 0 0 24px 0; opacity: 0.9;">
            Add $${session.requiredAmount} USDC to your wallet using your credit card
          </p>
          <div style="
            background: rgba(255,255,255,0.1);
            padding: 16px;
            border-radius: 6px;
            margin: 0 0 24px 0;
          ">
            <p style="margin: 0; font-size: 14px;">
              💳 Credit Card → USDC → Your Wallet<br/>
              🔒 Powered by Stripe (Secure & Instant)
            </p>
          </div>
          <button 
            onclick="window.stripeOnrampDemo && window.stripeOnrampDemo('${session.id}')"
            style="
              background: #28a745;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 6px;
              font-size: 16px;
              cursor: pointer;
              margin: 0 auto;
              display: block;
            "
          >
            Add $${session.requiredAmount} USDC
          </button>
        </div>
      `;

      // Demo function for simulating Stripe completion
      (window as any).stripeOnrampDemo = (sessionId: string) => {
        console.log('🎭 Demo: Simulating Stripe onramp completion...');
        setTimeout(() => {
          const event = new CustomEvent('stripe-onramp-completed', {
            detail: { sessionId, success: true }
          });
          window.dispatchEvent(event);
        }, 2000);
      };

      console.log('✅ Stripe widget embedded successfully');
    } catch (error) {
      console.error('❌ Error embedding Stripe widget:', error);
      throw error;
    }
  }

  /**
   * Wait for funding completion via webhooks or polling
   * @param sessionId Session ID to monitor
   */
  async waitForFunding(sessionId: string): Promise<boolean> {
    return new Promise((resolve) => {
      console.log(`⏳ Waiting for funding completion: ${sessionId}`);

      // Listen for Stripe completion event
      const handleCompletion = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail.sessionId === sessionId) {
          console.log('✅ Stripe funding completed!');
          window.removeEventListener('stripe-onramp-completed', handleCompletion);
          resolve(customEvent.detail.success);
        }
      };

      window.addEventListener('stripe-onramp-completed', handleCompletion);

      // Timeout after 10 minutes
      setTimeout(() => {
        console.log('⏰ Stripe funding timeout');
        window.removeEventListener('stripe-onramp-completed', handleCompletion);
        resolve(false);
      }, 600000);
    });
  }

  /**
   * Get supported cryptocurrencies for onramp
   */
  getSupportedCryptocurrencies(): string[] {
    return ['USDC']; // USDC-first strategy
  }

  /**
   * Get supported networks
   */
  getSupportedNetworks(): string[] {
    return ['polygon']; // Polygon for low fees
  }

  /**
   * Check if onramp is available in user's region
   * @param countryCode User's country code
   */
  isAvailableInRegion(countryCode?: string): boolean {
    // Stripe crypto onramp availability (based on our research)
    const supportedCountries = [
      'US', 'GB', 'CA', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'CH'
      // Add more supported countries as Stripe expands
    ];
    
    if (!countryCode) return true; // Assume available if unknown
    return supportedCountries.includes(countryCode.toUpperCase());
  }
}

// Export singleton instance
export const stripeOnrampService = new StripeOnrampService(); 