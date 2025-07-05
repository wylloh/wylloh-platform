// Chain IDs
export const ETHEREUM_MAINNET_ID = 1;
export const POLYGON_MAINNET_ID = 137;
export const POLYGON_MUMBAI_ID = 80001;

// Production blockchain configuration
export const CHAIN_ID = POLYGON_MAINNET_ID;

// Token Addresses for Polygon Mainnet
export const POLYGON_TOKENS = {
  // Native USDC on Polygon (Circle issued)
  USDC_NATIVE: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
  
  // Bridged USDC from Ethereum (most commonly used)
  USDC_BRIDGED: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
  
  // WMATIC
  WMATIC: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
  
  // WETH
  WETH: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'
};

// Payment Configuration
export const PAYMENT_CONFIG = {
  // Use bridged USDC as default payment token (most liquid)
  DEFAULT_PAYMENT_TOKEN: POLYGON_TOKENS.USDC_BRIDGED,
  DEFAULT_PAYMENT_SYMBOL: 'USDC',
  DEFAULT_PAYMENT_DECIMALS: 6,
  
  // Supported payment tokens
  SUPPORTED_TOKENS: [
    {
      address: POLYGON_TOKENS.USDC_BRIDGED,
      symbol: 'USDC',
      decimals: 6,
      name: 'USD Coin'
    },
    {
      address: POLYGON_TOKENS.USDC_NATIVE,
      symbol: 'USDC',
      decimals: 6,
      name: 'USD Coin (Native)'
    }
  ]
}; 