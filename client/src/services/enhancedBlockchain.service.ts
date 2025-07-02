import { ethers } from 'ethers';
import { blockchainService } from './blockchain.service';
import { stripeOnrampService } from './stripeOnramp.service';

// USDC contract address on Polygon mainnet
const USDC_CONTRACT_ADDRESS = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';

// USDC contract ABI (minimal interface needed)
const USDC_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

export interface PurchaseWithFallbackOptions {
  contentId: string;
  contentTitle: string;
  price: string; // Price in USDC
  walletAddress: string;
  onStripeRequired?: () => void;
  onStripeSuccess?: () => void;
  onStripeError?: (error: string) => void;
}

export interface PurchaseResult {
  success: boolean;
  transactionHash?: string;
  usedStripe?: boolean;
  error?: string;
}

/**
 * Enhanced blockchain service with real USDC integration
 * Provides seamless credit card payment when USDC balance is insufficient
 */
class EnhancedBlockchainService {
  
  /**
   * Get USDC contract instance
   */
  private async getUSDCContract(signer?: ethers.Signer): Promise<ethers.Contract> {
    const provider = signer?.provider || new ethers.providers.JsonRpcProvider(process.env.REACT_APP_RPC_URL);
    return new ethers.Contract(USDC_CONTRACT_ADDRESS, USDC_ABI, signer || provider);
  }

  /**
   * Get current USDC balance for wallet
   */
  async getUSDCBalance(walletAddress: string): Promise<string> {
    try {
      console.log('🔍 Checking USDC balance for:', walletAddress);
      
      const usdcContract = await this.getUSDCContract();
      const balance = await usdcContract.balanceOf(walletAddress);
      
      // USDC has 6 decimals on Polygon
      const formattedBalance = ethers.utils.formatUnits(balance, 6);
      
      console.log('💰 USDC balance:', formattedBalance);
      return formattedBalance;
    } catch (error) {
      console.error('❌ Error getting USDC balance:', error);
      return '0.00';
    }
  }

  /**
   * Check if user has sufficient USDC balance for purchase
   */
  async checkSufficientUSDCBalance(walletAddress: string, requiredAmount: string): Promise<boolean> {
    try {
      const balance = await this.getUSDCBalance(walletAddress);
      const balanceNum = parseFloat(balance);
      const requiredNum = parseFloat(requiredAmount);
      
      console.log(`💳 Balance check: ${balanceNum} USDC available, ${requiredNum} USDC required`);
      return balanceNum >= requiredNum;
    } catch (error) {
      console.error('❌ Error checking USDC balance:', error);
      return false;
    }
  }

  /**
   * Purchase content with automatic Stripe fallback for insufficient balance
   */
  async purchaseWithSmartFallback(options: PurchaseWithFallbackOptions): Promise<PurchaseResult> {
    const { contentId, contentTitle, price, walletAddress } = options;
    
    try {
      console.log('🎬 Starting smart purchase flow for:', contentTitle);
      console.log('💰 Price:', `$${price} USDC`);

      // Step 1: Check if user has sufficient USDC balance
      const hasSufficientBalance = await this.checkSufficientUSDCBalance(walletAddress, price);

      if (!hasSufficientBalance) {
        console.log('💳 Insufficient USDC balance detected - triggering Stripe onramp');
        
        // Trigger Stripe onramp callback
        if (options.onStripeRequired) {
          options.onStripeRequired();
        }

        // Return pending result - actual purchase will happen after funding
        return {
          success: false,
          usedStripe: true,
          error: 'Insufficient USDC balance - Stripe onramp required'
        };
      }

      // Step 2: Sufficient balance - proceed with direct blockchain purchase
      console.log('✅ Sufficient USDC balance - proceeding with USDC purchase');
      return await this.executeUSDCPurchase(contentId, price, walletAddress);

    } catch (error) {
      console.error('❌ Smart purchase flow error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Purchase failed'
      };
    }
  }

  /**
   * Execute USDC purchase transaction
   */
  private async executeUSDCPurchase(
    contentId: string,
    price: string,
    walletAddress: string
  ): Promise<PurchaseResult> {
    try {
      console.log('🔗 Executing USDC purchase transaction...');

      // Get signer from MetaMask or wallet provider
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const provider = new ethers.providers.Web3Provider((window as any).ethereum);
        const signer = provider.getSigner();
        
        // Get USDC contract with signer
        const usdcContract = await this.getUSDCContract(signer);
        
        // Convert price to USDC units (6 decimals)
        const priceInUnits = ethers.utils.parseUnits(price, 6);
        
        // For now, transfer USDC to a platform wallet (you'll need to set this)
        const platformWallet = process.env.REACT_APP_PLATFORM_WALLET_ADDRESS || walletAddress;
        
        console.log('💸 Transferring', price, 'USDC to platform wallet:', platformWallet);
        
        // Execute USDC transfer
        const transferTx = await usdcContract.transfer(platformWallet, priceInUnits);
        const receipt = await transferTx.wait();
        
        console.log('✅ USDC transfer successful:', receipt.hash);
        
        // TODO: Integrate with your film token minting logic here
        // For now, we'll simulate the token minting
        await this.simulateTokenMinting(contentId, walletAddress);
        
        return {
          success: true,
          transactionHash: receipt.hash,
          usedStripe: false
        };
      } else {
        throw new Error('Web3 provider not available');
      }
    } catch (error) {
      console.error('❌ USDC purchase error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'USDC transaction failed'
      };
    }
  }

  /**
   * Simulate token minting (placeholder for actual integration)
   */
  private async simulateTokenMinting(contentId: string, walletAddress: string): Promise<void> {
    console.log('🎭 Simulating token minting for content:', contentId, 'to wallet:', walletAddress);
    // TODO: Replace with actual film token contract minting call
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Complete purchase after successful Stripe funding
   */
  async completePurchaseAfterFunding(
    contentId: string,
    price: string,
    walletAddress: string
  ): Promise<PurchaseResult> {
    try {
      console.log('🎉 Completing purchase after successful Stripe funding...');

      // Small delay to ensure USDC has arrived in wallet
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Execute the blockchain purchase
      return await this.executeUSDCPurchase(contentId, price, walletAddress);
    } catch (error) {
      console.error('❌ Post-funding purchase error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete purchase after funding'
      };
    }
  }

  /**
   * Check if Stripe onramp is available for the current user
   */
  async isStripeOnrampAvailable(countryCode?: string): Promise<boolean> {
    try {
      return stripeOnrampService.isEnabled() && 
             stripeOnrampService.isAvailableInRegion(countryCode);
    } catch (error) {
      console.error('❌ Error checking Stripe availability:', error);
      return false;
    }
  }

  /**
   * Format error messages for user display
   */
  formatErrorForUser(error: string): string {
    // Remove technical jargon and provide user-friendly messages
    if (error.includes('insufficient funds')) {
      return 'You need more USDC in your wallet to complete this purchase.';
    }
    if (error.includes('user rejected')) {
      return 'Transaction was cancelled. Please try again.';
    }
    if (error.includes('network')) {
      return 'Network connection issue. Please check your internet and try again.';
    }
    if (error.includes('wallet')) {
      return 'Please make sure your wallet is connected and try again.';
    }
    
    // Generic fallback
    return 'Purchase failed. Please try again or contact support if the issue persists.';
  }

  /**
   * Validate purchase requirements before processing
   */
  async validatePurchaseRequirements(
    contentId: string,
    price: string,
    walletAddress: string
  ): Promise<{ valid: boolean; error?: string }> {
    // Check if wallet is connected
    if (!walletAddress || !ethers.utils.isAddress(walletAddress)) {
      return { valid: false, error: 'Please connect your wallet first.' };
    }

    // Check if price is valid
    const priceFloat = parseFloat(price);
    if (isNaN(priceFloat) || priceFloat <= 0) {
      return { valid: false, error: 'Invalid content price.' };
    }

    // Check if content exists
    if (!contentId || contentId.trim() === '') {
      return { valid: false, error: 'Invalid content selection.' };
    }

    return { valid: true };
  }

  /**
   * Get purchase flow analytics for debugging
   */
  getPurchaseFlowStats() {
    return {
      stripeEnabled: stripeOnrampService.isEnabled(),
      supportedCurrencies: stripeOnrampService.getSupportedCryptocurrencies(),
      supportedNetworks: stripeOnrampService.getSupportedNetworks(),
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const enhancedBlockchainService = new EnhancedBlockchainService(); 