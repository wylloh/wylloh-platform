const { ethers } = require('ethers');
const { logger } = require('../utils/logger');
const { EventEmitter } = require('events');
const Store = require('electron-store');

// Store for persisting connection details
const walletStore = new Store({
  name: 'seed-one-wallet',
  encryptionKey: 'wylloh-seed-one-wallet'
});

class WalletConnection extends EventEmitter {
  constructor(options = {}) {
    super();
    this.rpcUrl = options.rpcUrl || 'https://polygon-rpc.com';
    this.chainId = options.chainId || 137; // Polygon Mainnet by default
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.connected = false;
    this.networkName = options.chainId === 137 ? 'Polygon Mainnet' : 'Polygon Mumbai Testnet';
    
    // Initialize
    this.initialize();
  }

  async initialize() {
    try {
      // Create provider
      this.provider = new ethers.providers.JsonRpcProvider(this.rpcUrl);
      
      // Check if we have a saved wallet
      const savedWallet = walletStore.get('wallet');
      if (savedWallet && savedWallet.privateKey) {
        // Restore wallet from saved private key
        await this.restoreWallet(savedWallet.privateKey);
      }
      
      logger.info('Wallet connection initialized');
    } catch (error) {
      logger.error('Error initializing wallet connection:', error);
    }
  }

  async connect() {
    try {
      if (this.connected && this.signer) {
        return { 
          success: true, 
          address: this.address,
          connected: true
        };
      }

      // For Seed One, we'll create a new wallet for the device if none exists
      if (!this.signer) {
        // Create a new wallet
        const wallet = ethers.Wallet.createRandom().connect(this.provider);
        this.signer = wallet;
        this.address = await wallet.getAddress();
        
        // Save the wallet
        walletStore.set('wallet', {
          address: this.address,
          privateKey: wallet.privateKey
        });
        
        logger.info(`New wallet created: ${this.address}`);
      }

      this.connected = true;
      this.emit('connected', { address: this.address });
      
      return { 
        success: true, 
        address: this.address,
        connected: true
      };
    } catch (error) {
      logger.error('Error connecting wallet:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      this.connected = false;
      this.emit('disconnected');
      
      return { success: true };
    } catch (error) {
      logger.error('Error disconnecting wallet:', error);
      throw error;
    }
  }

  async restoreWallet(privateKey) {
    try {
      // Create wallet from private key
      const wallet = new ethers.Wallet(privateKey, this.provider);
      this.signer = wallet;
      this.address = await wallet.getAddress();
      logger.info(`Wallet restored: ${this.address}`);
      
      return { 
        success: true, 
        address: this.address
      };
    } catch (error) {
      logger.error('Error restoring wallet:', error);
      throw error;
    }
  }

  async importWallet(privateKey) {
    try {
      // Import wallet from private key
      const wallet = new ethers.Wallet(privateKey, this.provider);
      this.signer = wallet;
      this.address = await wallet.getAddress();
      
      // Save the wallet
      walletStore.set('wallet', {
        address: this.address,
        privateKey: wallet.privateKey
      });
      
      this.connected = true;
      this.emit('connected', { address: this.address });
      
      logger.info(`Wallet imported: ${this.address}`);
      
      return { 
        success: true, 
        address: this.address,
        connected: true
      };
    } catch (error) {
      logger.error('Error importing wallet:', error);
      throw error;
    }
  }

  async getBalance() {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected');
      }
      
      const balance = await this.signer.getBalance();
      return ethers.utils.formatEther(balance);
    } catch (error) {
      logger.error('Error getting wallet balance:', error);
      throw error;
    }
  }

  async getTokenBalance(tokenAddress, abi) {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected');
      }
      
      const tokenContract = new ethers.Contract(tokenAddress, abi, this.provider);
      const balance = await tokenContract.balanceOf(this.address);
      return balance.toString();
    } catch (error) {
      logger.error('Error getting token balance:', error);
      throw error;
    }
  }

  async signMessage(message) {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected');
      }
      
      const signature = await this.signer.signMessage(message);
      return signature;
    } catch (error) {
      logger.error('Error signing message:', error);
      throw error;
    }
  }

  // Verify token ownership (ERC-1155 specific)
  async hasToken(contractAddress, tokenId) {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected');
      }
      
      const erc1155Abi = [
        'function balanceOf(address account, uint256 id) external view returns (uint256)'
      ];
      
      const tokenContract = new ethers.Contract(contractAddress, erc1155Abi, this.provider);
      const balance = await tokenContract.balanceOf(this.address, tokenId);
      
      return balance.gt(0);
    } catch (error) {
      logger.error('Error checking token ownership:', error);
      return false;
    }
  }
}

async function setupWalletConnection(options) {
  const connection = new WalletConnection(options);
  return connection;
}

module.exports = {
  setupWalletConnection,
  WalletConnection
};