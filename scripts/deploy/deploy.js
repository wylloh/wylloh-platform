// Scripts for deploying the Wylloh smart contracts
import pkg from 'hardhat';
const { ethers } = pkg;
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get current file path (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to deploy contracts
async function deployContracts(network, signer) {
  console.log(`Deploying contracts to ${network.name}...`);

  try {
    // Deploy WyllohToken contract
    console.log('Deploying WyllohToken contract...');
    const WyllohToken = await ethers.getContractFactory('WyllohToken');
    const token = await WyllohToken.connect(signer).deploy();
    
    console.log(`Waiting for token contract deployment transaction: ${token.deployTransaction.hash}`);
    await token.deployed();
    
    // Verify the contract has code
    const tokenCode = await ethers.provider.getCode(token.address);
    if (tokenCode === '0x') {
      console.error('ERROR: WyllohToken contract deployment failed - no code at address');
      throw new Error('Contract deployment failed - no code at deployed address');
    }
    
    console.log(`WyllohToken deployed to: ${token.address}`);
    console.log('Initializing token contract with admin role...');
    
    // Deploy WyllohMarketplace contract
    console.log('Deploying WyllohMarketplace contract...');
    const WyllohMarketplace = await ethers.getContractFactory('WyllohMarketplace');
    const marketplace = await WyllohMarketplace.connect(signer).deploy(token.address);
    
    console.log(`Waiting for marketplace contract deployment transaction: ${marketplace.deployTransaction.hash}`);
    await marketplace.deployed();
    
    // Verify the contract has code
    const marketplaceCode = await ethers.provider.getCode(marketplace.address);
    if (marketplaceCode === '0x') {
      console.error('ERROR: WyllohMarketplace contract deployment failed - no code at address');
      throw new Error('Contract deployment failed - no code at deployed address');
    }
    
    console.log(`WyllohMarketplace deployed to: ${marketplace.address}`);
    
    // Create contract artifacts
    const tokenArtifact = {
      address: token.address,
      abi: JSON.parse(token.interface.format('json'))
    };

    const marketplaceArtifact = {
      address: marketplace.address,
      abi: JSON.parse(marketplace.interface.format('json'))
    };
    
    // Output summary of deployment
    console.log('\n----------------------------------------');
    console.log('DEPLOYMENT SUMMARY');
    console.log('----------------------------------------');
    console.log(`Network: ${network.name}`);
    console.log(`Block Number: ${await ethers.provider.getBlockNumber()}`);
    console.log(`WyllohToken: ${token.address}`);
    console.log(`WyllohMarketplace: ${marketplace.address}`);
    console.log('----------------------------------------\n');

    return { token: tokenArtifact, marketplace: marketplaceArtifact };
  } catch (error) {
    console.error('Error during contract deployment:', error);
    throw error;
  }
}

// Function to execute deployment
async function main() {
  try {
    // Get the network
    const network = await ethers.provider.getNetwork();
    console.log(`Connected to network: ${network.name} (${network.chainId})`);
    
    // Get the deployer (first signer)
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contracts with account: ${deployer.address}`);
    
    // Check deployer balance
    const balance = await deployer.getBalance();
    console.log(`Account balance: ${ethers.utils.formatEther(balance)} ETH`);
    
    if (balance.lt(ethers.utils.parseEther('0.1'))) {
      console.warn('WARNING: Deployer balance may be too low for successful deployment');
    }
    
    // Deploy the contracts
    const artifacts = await deployContracts(network, deployer);
    
    // Save artifacts to files
    const outputDir = path.join(__dirname, '..', '..', 'artifacts', 'contracts');
    try {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
    } catch (error) {
      console.warn('Error creating output directory:', error);
    }
    
    // Save WyllohToken artifact
    try {
      fs.writeFileSync(
        path.join(outputDir, 'WyllohToken.json'),
        JSON.stringify(artifacts.token, null, 2)
      );
    } catch (error) {
      console.warn('Error saving WyllohToken artifact:', error);
    }
    
    // Save WyllohMarketplace artifact
    try {
      fs.writeFileSync(
        path.join(outputDir, 'WyllohMarketplace.json'),
        JSON.stringify(artifacts.marketplace, null, 2)
      );
    } catch (error) {
      console.warn('Error saving WyllohMarketplace artifact:', error);
    }
    
    // Save addresses to separate file for easy access
    try {
      fs.writeFileSync(
        path.join(outputDir, 'addresses.json'),
        JSON.stringify({
          token: artifacts.token.address,
          marketplace: artifacts.marketplace.address,
          network: {
            name: network.name,
            chainId: network.chainId
          }
        }, null, 2)
      );
    } catch (error) {
      console.warn('Error saving addresses file:', error);
    }
    
    console.log('Deployment completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error in deployment process:', error);
    process.exit(1);
  }
}

// Execute deployment
main().catch(error => {
  console.error('Unhandled error in deployment script:', error);
  process.exit(1);
});