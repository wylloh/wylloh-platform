import axios from 'axios';
import { ethers } from 'ethers';
import { libraryService } from './library.service';
import { blockchainService } from './blockchain.service';

// Define the lending contract ABI
const lendingContractAbi = [
  // Read functions
  "function getLendingsByUser(address user) view returns (uint256[])",
  "function getBorrowingsByUser(address user) view returns (uint256[])",
  "function getLendingDetails(uint256 lendingId) view returns (tuple(uint256 lendingId, uint256 tokenId, address tokenContract, address lender, address borrower, uint256 startTime, uint256 duration, uint256 price, bool active, bool completed, bool cancelled))",
  "function isTokenLent(address tokenContract, uint256 tokenId) view returns (bool)",
  "function getLendingIdForToken(uint256 tokenId) view returns (uint256)",
  
  // Write functions
  "function lendContent(uint256 tokenId, address tokenContract, address borrower, uint256 duration, uint256 price) returns (uint256)",
  "function returnContent(uint256 lendingId)",
  "function cancelLending(uint256 lendingId)",
  "function payForLending(uint256 lendingId) payable",

  // Events
  "event ContentLent(uint256 indexed lendingId, uint256 indexed tokenId, address tokenContract, address indexed lender, address borrower, uint256 duration, uint256 price)",
  "event ContentReturned(uint256 indexed lendingId, uint256 indexed tokenId, address lender, address indexed borrower)",
  "event LendingCancelled(uint256 indexed lendingId, uint256 indexed tokenId, address indexed lender)",
];

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

// Default contract address - should be configured at app startup
const DEFAULT_LENDING_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000'; // Replace with actual address after deployment

// Types
export interface LendingAgreement {
  lendingId: string;
  tokenId: string;
  tokenContract: string;
  lender: string;
  borrower: string;
  startTime: number;
  duration: number;
  price: string;
  active: boolean;
  completed: boolean;
  cancelled: boolean;
}

export interface LendContent {
  tokenId: string;
  borrowerEmail: string;
  duration: number;
  price: number;
}

export interface LendingHistory {
  lendingId: string;
  contentId: string;
  contentTitle: string;
  thumbnailUrl: string;
  lender: string;
  lenderName: string;
  borrower: string;
  borrowerName: string;
  startDate: string;
  endDate: string;
  duration: number;
  price: number;
  status: 'active' | 'completed' | 'cancelled';
}

// Lending service class
class LendingService {
  private lendingContract: ethers.Contract | null = null;
  private lendingContractAddress: string = DEFAULT_LENDING_CONTRACT_ADDRESS;
  private _initialized: boolean = false;
  
  /**
   * Initialize the lending service
   * @param provider Ethereum provider
   * @param contractAddress Lending contract address
   */
  initialize(provider: ethers.providers.Web3Provider | ethers.providers.JsonRpcProvider, contractAddress?: string): void {
    try {
      if (contractAddress) {
        this.lendingContractAddress = contractAddress;
      }
      
      console.log(`Initializing lending service with contract address: ${this.lendingContractAddress}`);
      
      this.lendingContract = new ethers.Contract(
        this.lendingContractAddress,
        lendingContractAbi,
        provider
      );
      
      this._initialized = true;
      console.log('Lending service initialized successfully');
    } catch (error) {
      console.error('Error initializing lending service:', error);
      this._initialized = false;
    }
  }
  
  /**
   * Check if the service is initialized
   * @returns true if initialized
   */
  isInitialized(): boolean {
    return this._initialized;
  }
  
  /**
   * Get a signer for transactions
   * @returns Ethers signer
   */
  private async getSigner(): Promise<ethers.Signer> {
    if (!this.lendingContract || !this.lendingContract.provider) {
      throw new Error('Contract or provider not initialized');
    }
    
    // If using Web3Provider, get signer directly
    if ('getSigner' in this.lendingContract.provider) {
      return (this.lendingContract.provider as ethers.providers.Web3Provider).getSigner();
    }
    
    // Otherwise, get the first account and create a signer with the provider
    const accounts = await (this.lendingContract.provider as ethers.providers.JsonRpcProvider).listAccounts();
    if (accounts.length === 0) {
      throw new Error('No accounts available');
    }
    
    return (this.lendingContract.provider as ethers.providers.JsonRpcProvider).getSigner(accounts[0]);
  }
  
  /**
   * Lend content to a borrower using the blockchain
   * @param contentId Content ID
   * @param borrowerEmail Borrower's email
   * @param duration Lending duration in days
   * @param price Lending price in ETH
   * @returns The lending agreement ID
   */
  async lendContent(
    contentId: string,
    borrowerEmail: string,
    duration: number,
    price: number
  ): Promise<string> {
    if (!this.isInitialized()) {
      throw new Error('Lending service not initialized');
    }
    
    try {
      // First register the lending in the backend to get borrower's address
      const backendResponse = await axios.post(
        `${API_BASE_URL}/api/lending/register`,
        { contentId, borrowerEmail, duration, price }
      );
      
      const { borrowerAddress } = backendResponse.data;
      if (!borrowerAddress) {
        throw new Error('Failed to get borrower address');
      }
      
      // Get the token ID from content ID
      const tokenIdBytes = ethers.utils.solidityKeccak256(['string'], [contentId]);
      const tokenId = ethers.BigNumber.from(tokenIdBytes);
      
      // Get duration in seconds
      const durationInSeconds = duration * 24 * 60 * 60;
      
      // Convert price to wei
      const priceWei = ethers.utils.parseEther(price.toString());
      
      // Get the token contract address
      const { tokenContractAddress } = backendResponse.data;
      if (!tokenContractAddress) {
        throw new Error('Failed to get token contract address');
      }
      
      // Get a signer for the transaction
      const signer = await this.getSigner();
      
      // Connect the contract to the signer
      const contractWithSigner = this.lendingContract!.connect(signer);
      
      // Execute the transaction
      const tx = await contractWithSigner.lendContent(
        tokenId,
        tokenContractAddress,
        borrowerAddress,
        durationInSeconds,
        priceWei
      );
      
      console.log('Lending transaction sent:', tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('Lending transaction confirmed:', receipt);
      
      // Extract the lending ID from the event
      const event = receipt.events?.find((e: ethers.Event) => e.event === 'ContentLent');
      if (!event) {
        throw new Error('Content lent event not found');
      }
      
      const lendingId = event.args?.lendingId.toString();
      
      // Update the backend with the transaction details
      await axios.post(
        `${API_BASE_URL}/api/lending/confirm`,
        {
          contentId,
          lendingId,
          transactionHash: tx.hash,
          blockNumber: receipt.blockNumber
        }
      );
      
      return lendingId;
    } catch (error) {
      console.error('Error lending content on blockchain:', error);
      throw error;
    }
  }
  
  /**
   * Return borrowed content
   * @param lendingId Lending agreement ID
   * @returns Transaction result
   */
  async returnContent(lendingId: string): Promise<boolean> {
    if (!this.isInitialized()) {
      throw new Error('Lending service not initialized');
    }
    
    try {
      // Get a signer for the transaction
      const signer = await this.getSigner();
      
      // Connect the contract to the signer
      const contractWithSigner = this.lendingContract!.connect(signer);
      
      // Execute the transaction
      const tx = await contractWithSigner.returnContent(lendingId);
      console.log('Return transaction sent:', tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('Return transaction confirmed:', receipt);
      
      // Update the backend
      await axios.post(
        `${API_BASE_URL}/api/lending/return`,
        {
          lendingId,
          transactionHash: tx.hash,
          blockNumber: receipt.blockNumber
        }
      );
      
      return true;
    } catch (error) {
      console.error('Error returning content on blockchain:', error);
      throw error;
    }
  }
  
  /**
   * Cancel a lending agreement
   * @param lendingId Lending agreement ID
   * @returns Transaction result
   */
  async cancelLending(lendingId: string): Promise<boolean> {
    if (!this.isInitialized()) {
      throw new Error('Lending service not initialized');
    }
    
    try {
      // Get a signer for the transaction
      const signer = await this.getSigner();
      
      // Connect the contract to the signer
      const contractWithSigner = this.lendingContract!.connect(signer);
      
      // Execute the transaction
      const tx = await contractWithSigner.cancelLending(lendingId);
      console.log('Cancel lending transaction sent:', tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('Cancel lending transaction confirmed:', receipt);
      
      // Update the backend
      await axios.post(
        `${API_BASE_URL}/api/lending/cancel`,
        {
          lendingId,
          transactionHash: tx.hash,
          blockNumber: receipt.blockNumber
        }
      );
      
      return true;
    } catch (error) {
      console.error('Error cancelling lending on blockchain:', error);
      throw error;
    }
  }
  
  /**
   * Pay for borrowing content
   * @param lendingId Lending agreement ID
   * @param price Price in ETH
   * @returns Transaction result
   */
  async payForLending(lendingId: string, price: number): Promise<boolean> {
    if (!this.isInitialized()) {
      throw new Error('Lending service not initialized');
    }
    
    try {
      // Get a signer for the transaction
      const signer = await this.getSigner();
      
      // Connect the contract to the signer
      const contractWithSigner = this.lendingContract!.connect(signer);
      
      // Convert price to wei
      const priceWei = ethers.utils.parseEther(price.toString());
      
      // Execute the transaction
      const tx = await contractWithSigner.payForLending(lendingId, { value: priceWei });
      console.log('Payment transaction sent:', tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('Payment transaction confirmed:', receipt);
      
      // Update the backend
      await axios.post(
        `${API_BASE_URL}/api/lending/payment`,
        {
          lendingId,
          transactionHash: tx.hash,
          blockNumber: receipt.blockNumber,
          amount: price
        }
      );
      
      return true;
    } catch (error) {
      console.error('Error paying for lending on blockchain:', error);
      throw error;
    }
  }
  
  /**
   * Get lending agreements for a user (as lender)
   * @param userAddress User's Ethereum address
   * @returns Array of lending IDs
   */
  async getLendingsByUser(userAddress: string): Promise<string[]> {
    if (!this.isInitialized()) {
      throw new Error('Lending service not initialized');
    }
    
    try {
      const lendingIds = await this.lendingContract!.getLendingsByUser(userAddress);
      return lendingIds.map((id: ethers.BigNumber) => id.toString());
    } catch (error) {
      console.error('Error getting user lendings:', error);
      throw error;
    }
  }
  
  /**
   * Get borrowing agreements for a user (as borrower)
   * @param userAddress User's Ethereum address
   * @returns Array of lending IDs
   */
  async getBorrowingsByUser(userAddress: string): Promise<string[]> {
    if (!this.isInitialized()) {
      throw new Error('Lending service not initialized');
    }
    
    try {
      const borrowingIds = await this.lendingContract!.getBorrowingsByUser(userAddress);
      return borrowingIds.map((id: ethers.BigNumber) => id.toString());
    } catch (error) {
      console.error('Error getting user borrowings:', error);
      throw error;
    }
  }
  
  /**
   * Get details of a lending agreement
   * @param lendingId Lending agreement ID
   * @returns Lending agreement details
   */
  async getLendingDetails(lendingId: string): Promise<LendingAgreement> {
    if (!this.isInitialized()) {
      throw new Error('Lending service not initialized');
    }
    
    try {
      const details = await this.lendingContract!.getLendingDetails(lendingId);
      
      return {
        lendingId: details.lendingId.toString(),
        tokenId: details.tokenId.toString(),
        tokenContract: details.tokenContract,
        lender: details.lender,
        borrower: details.borrower,
        startTime: details.startTime.toNumber(),
        duration: details.duration.toNumber(),
        price: ethers.utils.formatEther(details.price),
        active: details.active,
        completed: details.completed,
        cancelled: details.cancelled
      };
    } catch (error) {
      console.error('Error getting lending details:', error);
      throw error;
    }
  }
  
  /**
   * Check if a token is currently being lent
   * @param tokenContract Token contract address
   * @param tokenId Token ID
   * @returns true if token is being lent
   */
  async isTokenLent(tokenContract: string, tokenId: string): Promise<boolean> {
    if (!this.isInitialized()) {
      throw new Error('Lending service not initialized');
    }
    
    try {
      return await this.lendingContract!.isTokenLent(tokenContract, tokenId);
    } catch (error) {
      console.error('Error checking if token is lent:', error);
      throw error;
    }
  }
  
  /**
   * Get the lending history for a content item from the backend
   * @param contentId Content ID
   * @returns Lending history
   */
  async getLendingHistoryForContent(contentId: string): Promise<LendingHistory[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/lending/history/${contentId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error getting lending history for content ${contentId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get all active lendings for the current user
   * @returns Lending history
   */
  async getMyActiveLendings(): Promise<LendingHistory[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/lending/my-active-lendings`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting active lendings:', error);
      throw error;
    }
  }
  
  /**
   * Get all active borrowings for the current user
   * @returns Lending history
   */
  async getMyActiveBorrowings(): Promise<LendingHistory[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/lending/my-active-borrowings`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting active borrowings:', error);
      throw error;
    }
  }
}

export const lendingService = new LendingService();
export default lendingService; 