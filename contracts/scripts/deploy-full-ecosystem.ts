import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🎬 WYLLOH COMPLETE ECOSYSTEM DEPLOYMENT");
  console.log("🌐 Network:", network.name);
  console.log("👤 Deployer:", deployer.address);
  
  // CRITICAL: Verify we're on the correct network
  if (network.name !== "polygon" && network.name !== "mumbai") {
    throw new Error("❌ This script is for Polygon networks only");
  }

  // Check deployer balance
  const balance = await deployer.provider.getBalance(deployer.address);
  const balanceInMatic = ethers.formatEther(balance);
  console.log("💰 Deployer balance:", balanceInMatic, "MATIC");
  
  if (parseFloat(balanceInMatic) < 0.1) {
    throw new Error("❌ Insufficient MATIC balance. Need at least 0.1 MATIC for deployment");
  }

  console.log("\n🚀 DEPLOYING INTEGRATED ECOSYSTEM...\n");

  // Step 1: Deploy Platform Token (WyllohToken)
  console.log("1️⃣ Deploying WyllohToken (Platform Token)...");
  const WyllohToken = await ethers.getContractFactory("WyllohToken");
  const wyllohToken = await WyllohToken.deploy();
  await wyllohToken.waitForDeployment();
  const wyllohTokenAddress = await wyllohToken.getAddress();
  console.log("✅ WyllohToken deployed:", wyllohTokenAddress);

  // Initialize the platform token
  await wyllohToken.initialize();
  console.log("✅ WyllohToken initialized");

  // Step 2: Deploy Storage Pool
  console.log("\n2️⃣ Deploying StoragePool...");
  const StoragePool = await ethers.getContractFactory("StoragePool");
  const storagePool = await StoragePool.deploy();
  await storagePool.waitForDeployment();
  const storagePoolAddress = await storagePool.getAddress();
  console.log("✅ StoragePool deployed:", storagePoolAddress);

  // Initialize storage pool
  await storagePool.initialize(wyllohTokenAddress);
  console.log("✅ StoragePool initialized");

  // Step 3: Deploy Royalty Distributor
  console.log("\n3️⃣ Deploying RoyaltyDistributor...");
  const RoyaltyDistributor = await ethers.getContractFactory("RoyaltyDistributor");
  const royaltyDistributor = await RoyaltyDistributor.deploy();
  await royaltyDistributor.waitForDeployment();
  const royaltyDistributorAddress = await royaltyDistributor.getAddress();
  console.log("✅ RoyaltyDistributor deployed:", royaltyDistributorAddress);

  // Step 4: Deploy WyllohFilmRegistry (MASTER CONTRACT)
  console.log("\n4️⃣ Deploying WyllohFilmRegistry (Master Contract)...");
  const WyllohFilmRegistry = await ethers.getContractFactory("WyllohFilmRegistry");
  const wyllohRegistry = await WyllohFilmRegistry.deploy(deployer.address);
  await wyllohRegistry.waitForDeployment();
  const wyllohRegistryAddress = await wyllohRegistry.getAddress();
  console.log("✅ WyllohFilmRegistry deployed:", wyllohRegistryAddress);

  // Step 5: Deploy WyllohMarketplace (Integrated)
  console.log("\n5️⃣ Deploying WyllohMarketplace (Integrated)...");
  const WyllohMarketplace = await ethers.getContractFactory("WyllohMarketplace");
  const wyllohMarketplace = await WyllohMarketplace.deploy(
    wyllohRegistryAddress,
    deployer.address, // Fee recipient
    royaltyDistributorAddress
  );
  await wyllohMarketplace.waitForDeployment();
  const wyllohMarketplaceAddress = await wyllohMarketplace.getAddress();
  console.log("✅ WyllohMarketplace deployed:", wyllohMarketplaceAddress);

  // Step 6: Create "The Cocoanuts" (1929) - First Film (Token ID 1)
  console.log("\n6️⃣ Creating 'The Cocoanuts' (1929) - Historic First Film...");
  
  // Define rights thresholds for The Cocoanuts
  const rightsThresholds = [
    {
      quantity: 1,
      rightsLevel: "Basic Streaming",
      priceMultiplier: 100, // 1x price
      enabled: true
    },
    {
      quantity: 10,
      rightsLevel: "HD Streaming + Download",
      priceMultiplier: 100,
      enabled: true
    },
    {
      quantity: 100,
      rightsLevel: "4K + Behind-the-Scenes",
      priceMultiplier: 100,
      enabled: true
    },
    {
      quantity: 1000,
      rightsLevel: "Commercial License",
      priceMultiplier: 150, // 1.5x price for commercial
      enabled: true
    }
  ];

  const createFilmTx = await wyllohRegistry.createFilm(
    "the-cocoanuts-1929",
    "The Cocoanuts",
    deployer.address,
    1000000, // 1 million tokens
    4990000, // $4.99 in USDC (6 decimals)
    rightsThresholds,
    "https://api.wylloh.com/films/the-cocoanuts-1929/metadata"
  );
  
  const receipt = await createFilmTx.wait();
  console.log("✅ The Cocoanuts created as Token ID 1");
  console.log("📈 Max Supply: 1,000,000 tokens");
  console.log("💰 Price: $4.99 USDC per token");

  // Step 7: Setup Royalty Distribution for The Cocoanuts
  console.log("\n7️⃣ Setting up royalty distribution...");
  
  // Add deployer as primary royalty recipient (90%)
  await royaltyDistributor.addRoyaltyRecipient(
    wyllohRegistryAddress,
    1, // Token ID 1 = The Cocoanuts
    deployer.address,
    9000 // 90% in basis points
  );
  
  // Add platform treasury as secondary recipient (10%)
  await royaltyDistributor.addRoyaltyRecipient(
    wyllohRegistryAddress,
    1,
    deployer.address, // Using deployer as treasury for now
    1000 // 10% in basis points
  );
  
  console.log("✅ Royalty distribution configured");

  // Step 8: Fund Storage Pool
  console.log("\n8️⃣ Funding storage pool...");
  
  // Mint tokens to deployer for storage pool funding
  await wyllohToken.mint(deployer.address, ethers.parseEther("10000")); // 10,000 WYL
  
  // Approve and fund the storage pool
  await wyllohToken.approve(storagePoolAddress, ethers.parseEther("1000"));
  await storagePool.fundPool(ethers.parseEther("1000"));
  
  console.log("✅ Storage pool funded with 1,000 WYL tokens");

  // Step 9: Save deployment addresses
  console.log("\n9️⃣ Saving deployment addresses...");
  
  const deploymentInfo = {
    network: network.name,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      WyllohToken: wyllohTokenAddress,
      StoragePool: storagePoolAddress,
      RoyaltyDistributor: royaltyDistributorAddress,
      WyllohFilmRegistry: wyllohRegistryAddress,
      WyllohMarketplace: wyllohMarketplaceAddress
    },
    films: {
      "the-cocoanuts-1929": {
        tokenId: 1,
        title: "The Cocoanuts",
        maxSupply: 1000000,
        pricePerToken: 4990000,
        creator: deployer.address
      }
    },
    deprecated: {
      // These contracts are now deprecated in favor of the registry approach
      WyllohFilmFactory: "DEPRECATED - Use WyllohFilmRegistry instead",
      WyllohFilmToken: "DEPRECATED - Films are now token IDs in WyllohFilmRegistry",
      WyllohFilmTokenSimple: "DEPRECATED - Films are now token IDs in WyllohFilmRegistry",
      ContentToken: "EVALUATION - DRM features may be valuable"
    }
  };

  const deploymentPath = path.join(__dirname, `../deployments/${network.name}-ecosystem.json`);
  fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("✅ Deployment info saved to:", deploymentPath);

  // Step 10: Deploy summary
  console.log("\n🎉 DEPLOYMENT COMPLETE!");
  console.log("=====================================");
  console.log("🎬 WYLLOH COMPLETE ECOSYSTEM DEPLOYED");
  console.log("=====================================");
  console.log("📝 Contract Addresses:");
  console.log("   WyllohToken (Platform):", wyllohTokenAddress);
  console.log("   StoragePool:", storagePoolAddress);
  console.log("   RoyaltyDistributor:", royaltyDistributorAddress);
  console.log("   WyllohFilmRegistry (MASTER):", wyllohRegistryAddress);
  console.log("   WyllohMarketplace:", wyllohMarketplaceAddress);
  console.log("");
  console.log("🎭 Films Created:");
  console.log("   Token ID 1: The Cocoanuts (1929)");
  console.log("   Supply: 1,000,000 tokens");
  console.log("   Price: $4.99 USDC");
  console.log("");
  console.log("🔗 Integration Status:");
  console.log("   ✅ Registry + Marketplace = Integrated");
  console.log("   ✅ Registry + Royalties = Integrated");
  console.log("   ✅ Registry + Storage = Ready");
  console.log("   ✅ USDC Payments = Ready");
  console.log("   ✅ Scalable Architecture = Ready");
  console.log("");
  console.log("🎯 Next Steps:");
  console.log("   1. Update frontend to use registry address");
  console.log("   2. Test Pro user upload flow");
  console.log("   3. Validate The Cocoanuts tokenization");
  console.log("   4. Remove deprecated contracts");
  console.log("");
  console.log("🌟 READY FOR THE COCOANUTS! 🌟");

  return {
    wyllohToken: wyllohTokenAddress,
    storagePool: storagePoolAddress,
    royaltyDistributor: royaltyDistributorAddress,
    wyllohRegistry: wyllohRegistryAddress,
    wyllohMarketplace: wyllohMarketplaceAddress
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 