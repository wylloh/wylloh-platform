import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🎪 HISTORIC DEPLOYMENT: Wylloh Film Registry - Scalable Master Contract");
  console.log("🌐 Deploying to Polygon Mainnet with The Cocoanuts as Token ID 1");
  console.log("👤 Deployer account:", deployer.address);
  
  // CRITICAL: Verify we're on Polygon mainnet
  if (network.name !== "polygon") {
    throw new Error("❌ SAFETY CHECK FAILED: This script is for Polygon mainnet ONLY. Use --network polygon");
  }

  // Check deployer balance
  const balance = await deployer.provider.getBalance(deployer.address);
  const balanceInMatic = ethers.formatEther(balance);
  console.log(`💰 Deployer balance: ${balanceInMatic} MATIC`);
  
  // Minimum balance check
  if (parseFloat(balanceInMatic) < 0.1) {
    throw new Error("❌ Insufficient balance for deployment. Need at least 0.1 MATIC");
  }

  try {
    // 1. Deploy WyllohFilmRegistry (Master Contract)
    console.log("\n🏗️  Deploying WyllohFilmRegistry...");
    const WyllohFilmRegistry = await ethers.getContractFactory("WyllohFilmRegistry");
    const filmRegistry = await WyllohFilmRegistry.deploy();
    await filmRegistry.waitForDeployment();
    
    const registryAddress = await filmRegistry.getAddress();
    console.log("✅ WyllohFilmRegistry deployed to:", registryAddress);
    console.log("📄 Transaction hash:", filmRegistry.deploymentTransaction()?.hash);
    
    // Wait for a few confirmations
    console.log("⏳ Waiting for confirmations...");
    const deployTx = filmRegistry.deploymentTransaction();
    if (deployTx) {
      await deployTx.wait(3);
    }
    
    // 2. Create "The Cocoanuts" (1929) as Token ID 1
    console.log("\n🎭 Creating The Cocoanuts (1929) as Token ID 1...");
    
    const cocoanutsData = {
      filmId: "the-cocoanuts-1929",
      title: "The Cocoanuts",
      totalSupply: 1000000, // 1 million tokens
      pricePerToken: ethers.parseEther("4.99"), // $4.99 in MATIC (demo pricing)
      rightsThresholds: [1, 5, 10, 100, 500], // Personal, Family, Public, Commercial, Full
      royaltyRecipients: [deployer.address], // Initially to deployer
      royaltyShares: [10000] // 100% to deployer initially
    };
    
    const createTx = await filmRegistry.createFilm(
      cocoanutsData.filmId,
      cocoanutsData.title,
      cocoanutsData.totalSupply,
      cocoanutsData.pricePerToken,
      cocoanutsData.rightsThresholds,
      cocoanutsData.royaltyRecipients,
      cocoanutsData.royaltyShares
    );
    
    console.log("📋 Film creation transaction:", createTx.hash);
    const receipt = await createTx.wait();
    
    // Extract token ID from events
    const filmCreatedEvent = receipt.logs?.find(
      (log: any) => {
        try {
          return filmRegistry.interface.parseLog(log)?.name === "FilmCreated";
        } catch {
          return false;
        }
      }
    );
    
    if (filmCreatedEvent) {
      const parsedEvent = filmRegistry.interface.parseLog(filmCreatedEvent);
      const tokenId = parsedEvent?.args.tokenId;
      console.log(`🎬 The Cocoanuts created as Token ID: ${tokenId}`);
    }
    
    // 3. Set metadata for The Cocoanuts
    console.log("\n📝 Setting metadata for The Cocoanuts...");
    const metadataURI = "https://api.wylloh.com/metadata/the-cocoanuts-1929";
    const metadataTx = await filmRegistry.setFilmMetadata(1, metadataURI);
    await metadataTx.wait();
    console.log("✅ Metadata set successfully");
    
    // 4. Verify deployment
    console.log("\n🔍 Verifying deployment...");
    const nextTokenId = await filmRegistry.nextTokenId();
    const filmInfo = await filmRegistry.films(1);
    
    console.log("📊 Deployment Verification:");
    console.log(`   Next Token ID: ${nextTokenId.toString()}`);
    console.log(`   Film ID: ${filmInfo.filmId}`);
    console.log(`   Title: ${filmInfo.title}`);
    console.log(`   Total Supply: ${filmInfo.maxSupply.toString()}`);
    console.log(`   Price per Token: ${ethers.formatEther(filmInfo.pricePerToken)} MATIC`);
    console.log(`   Creator: ${filmInfo.creator}`);
    console.log(`   Active: ${filmInfo.isActive}`);
    
    // 5. Save deployment addresses
    const deploymentData = {
      network: network.name,
      chainId: (await deployer.provider.getNetwork()).chainId,
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      contracts: {
        WyllohFilmRegistry: registryAddress
      },
      films: {
        "the-cocoanuts-1929": {
          tokenId: 1,
          title: "The Cocoanuts",
          totalSupply: 1000000,
          pricePerToken: "4.99",
          metadataURI: metadataURI
        }
      },
      integrationNotes: [
        "Fixed blockchain service integration gaps",
        "Added purchaseTokens method to contract",
        "Updated ABI for frontend integration", 
        "Added fallback mechanisms for key management",
        "Ready for Pro user upload testing"
      ]
    };
    
    // Save to file
    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const deploymentFile = path.join(deploymentsDir, `polygon-mainnet-${Date.now()}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));
    
    console.log("\n🎉 DEPLOYMENT COMPLETE!");
    console.log("📄 Deployment data saved to:", deploymentFile);
    console.log("\n🎯 NEXT STEPS:");
    console.log("1. Update client/src/constants/blockchain.ts with new contract address");
    console.log("2. Test Pro user upload flow");
    console.log("3. Test purchase and playback flow");
    console.log("4. Validate The Cocoanuts end-to-end");
    
    console.log("\n🚀 READY FOR THE COCOANUTS HISTORIC UPLOAD!");
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 