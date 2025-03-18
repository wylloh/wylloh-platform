// Monitor blockchain transactions and events on the local Ganache blockchain
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

// Configuration
const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const tokenFactoryAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

// Simplified ABI fragments for basic monitoring
const basicContractAbi = [
  "event ContentAdded(uint256 contentId, address owner, string metadataURI)",
  "event ContentUpdated(uint256 contentId, string metadataURI)",
  "event KeyRegistered(uint256 contentId, bytes32 keyId, address owner)",
  "event KeyAccessed(uint256 contentId, bytes32 keyId, address user)"
];

const basicTokenFactoryAbi = [
  "event TokenCreated(address tokenAddress, uint256 contentId, address owner)"
];

// ERC20/ERC721 standard events for token transfers
const tokenAbi = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

// Initialize contract instances with simplified ABIs
console.log('Using simplified ABI for monitoring (some event details may be limited)');
const contentContract = new ethers.Contract(contractAddress, basicContractAbi, provider);
const tokenFactoryContract = new ethers.Contract(tokenFactoryAddress, basicTokenFactoryAbi, provider);

// Event monitoring function
async function monitorEvents() {
  console.log('\n===== Wylloh Blockchain Event Monitor =====');
  console.log('Monitoring transactions on local Ganache blockchain...');
  console.log('Content Contract:', contractAddress);
  console.log('Token Factory:', tokenFactoryAddress);
  console.log('Press Ctrl+C to exit\n');

  // Monitor general transactions
  provider.on('block', async (blockNumber) => {
    const block = await provider.getBlock(blockNumber);
    if (block.transactions.length > 0) {
      console.log(`\n🔷 Block #${blockNumber} - ${block.transactions.length} transactions`);
      
      for (const txHash of block.transactions) {
        const tx = await provider.getTransaction(txHash);
        const receipt = await provider.getTransactionReceipt(txHash);
        
        console.log(`\n📝 Transaction: ${txHash}`);
        console.log(`   From: ${tx.from}`);
        console.log(`   To: ${tx.to || 'Contract Creation'}`);
        console.log(`   Value: ${ethers.utils.formatEther(tx.value)} ETH`);
        console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
        
        if (receipt.logs.length > 0) {
          console.log(`   Events: ${receipt.logs.length}`);
          
          // Log all events generically since we may not have exact ABIs
          for (const log of receipt.logs) {
            try {
              let eventDetails = `      Event at address ${log.address}`;
              
              // Try to identify known contracts
              if (log.address.toLowerCase() === contractAddress.toLowerCase()) {
                eventDetails = `      Content Contract Event`;
                // Try to parse with our basic ABI
                try {
                  const parsedLog = contentContract.interface.parseLog(log);
                  eventDetails += `: ${parsedLog.name}`;
                  if (parsedLog.args) {
                    eventDetails += ` (Args: ${JSON.stringify(parsedLog.args)})`;
                  }
                } catch (e) {
                  // Couldn't parse with our simple ABI
                  eventDetails += ` (Topics: ${log.topics.join(', ')})`;
                }
              } else if (log.address.toLowerCase() === tokenFactoryAddress.toLowerCase()) {
                eventDetails = `      Token Factory Event`;
                // Try to parse with our basic ABI
                try {
                  const parsedLog = tokenFactoryContract.interface.parseLog(log);
                  eventDetails += `: ${parsedLog.name}`;
                  if (parsedLog.args) {
                    eventDetails += ` (Args: ${JSON.stringify(parsedLog.args)})`;
                  }
                } catch (e) {
                  // Couldn't parse with our simple ABI
                  eventDetails += ` (Topics: ${log.topics.join(', ')})`;
                }
              } else {
                // This might be a token contract or other contract
                const genericTokenContract = new ethers.Contract(log.address, tokenAbi, provider);
                try {
                  const parsedLog = genericTokenContract.interface.parseLog(log);
                  eventDetails = `      Token Event: ${parsedLog.name}`;
                  if (parsedLog.args) {
                    // Format token transfers nicely
                    if (parsedLog.name === 'Transfer') {
                      const { from, to, value } = parsedLog.args;
                      eventDetails += ` (From: ${from}, To: ${to}, Value: ${value.toString()})`;
                    } else {
                      eventDetails += ` (Args: ${JSON.stringify(parsedLog.args)})`;
                    }
                  }
                } catch (e) {
                  // Couldn't parse as token event either
                  eventDetails += ` (Topics: ${log.topics.join(', ')})`;
                }
              }
              
              console.log(eventDetails);
            } catch (error) {
              console.log(`      Unknown Event (${log.topics.length} topics)`);
            }
          }
        }
      }
    }
  });

  // Set up specific listeners for our basic contract events
  contentContract.on('ContentAdded', (contentId, owner, metadataURI, event) => {
    console.log('\n🟢 Event: ContentAdded');
    console.log(`   Content ID: ${contentId.toString()}`);
    console.log(`   Owner: ${owner}`);
    console.log(`   Metadata URI: ${metadataURI}`);
    console.log(`   Transaction: ${event.transactionHash}`);
  });

  contentContract.on('ContentUpdated', (contentId, metadataURI, event) => {
    console.log('\n🔵 Event: ContentUpdated');
    console.log(`   Content ID: ${contentId.toString()}`);
    console.log(`   Metadata URI: ${metadataURI}`);
    console.log(`   Transaction: ${event.transactionHash}`);
  });

  tokenFactoryContract.on('TokenCreated', (tokenAddress, contentId, owner, event) => {
    console.log('\n🟣 Event: TokenCreated');
    console.log(`   Token Address: ${tokenAddress}`);
    console.log(`   Content ID: ${contentId.toString()}`);
    console.log(`   Owner: ${owner}`);
    console.log(`   Transaction: ${event.transactionHash}`);
  });

  // Key management events
  contentContract.on('KeyRegistered', (contentId, keyId, owner, event) => {
    console.log('\n🔑 Event: KeyRegistered');
    console.log(`   Content ID: ${contentId.toString()}`);
    console.log(`   Key ID: ${keyId}`);
    console.log(`   Owner: ${owner}`);
    console.log(`   Transaction: ${event.transactionHash}`);
  });

  contentContract.on('KeyAccessed', (contentId, keyId, user, event) => {
    console.log('\n🔓 Event: KeyAccessed');
    console.log(`   Content ID: ${contentId.toString()}`);
    console.log(`   Key ID: ${keyId}`);
    console.log(`   User: ${user}`);
    console.log(`   Transaction: ${event.transactionHash}`);
  });
}

// Start monitoring
monitorEvents().catch(console.error); 