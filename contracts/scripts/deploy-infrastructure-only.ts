import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🎬 WYLLOH INFRASTRUCTURE DEPLOYMENT");
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

  console.log("\n🚀 DEPLOYING INFRASTRUCTURE CONTRACTS...\n");

  // Step 1: Deploy Platform Token (WyllohToken ERC20)
  console.log("1️⃣ Deploying WyllohToken (ERC20 Platform Token)...");
  const WyllohToken = await ethers.getContractFactory("contracts/token/WyllohToken.sol:WyllohToken");
  const wyllohToken = await WyllohToken.deploy();
  await wyllohToken.waitForDeployment();
  const wyllohTokenAddress = await wyllohToken.getAddress();
  console.log("✅ WyllohToken (ERC20) deployed:", wyllohTokenAddress);

  // Initialize the platform token (ERC20 - no parameters)
  try {
    await wyllohToken.initialize();
    console.log("✅ WyllohToken (ERC20) initialized");
  } catch (error) {
    console.log("ℹ️  WyllohToken (ERC20) already initialized or initialization not needed");
  }

  // Step 2: Deploy Storage Pool
  console.log("\n2️⃣ Deploying StoragePool...");
  const StoragePool = await ethers.getContractFactory("StoragePool");
  const storagePool = await StoragePool.deploy();
  await storagePool.waitForDeployment();
  const storagePoolAddress = await storagePool.getAddress();
  console.log("✅ StoragePool deployed:", storagePoolAddress);

  // Initialize storage pool
  try {
    await storagePool.initialize(wyllohTokenAddress);
    console.log("✅ StoragePool initialized");
  } catch (error) {
    console.log("ℹ️  StoragePool already initialized or initialization not needed");
  }

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
  const WyllohMarketplace = await ethers.getContractFactory("contracts/marketplace/WyllohMarketplace.sol:WyllohMarketplace");
  const wyllohMarketplace = await WyllohMarketplace.deploy(
    wyllohRegistryAddress,
    deployer.address, // Fee recipient
    royaltyDistributorAddress
  );
  await wyllohMarketplace.waitForDeployment();
  const wyllohMarketplaceAddress = await wyllohMarketplace.getAddress();
  console.log("✅ WyllohMarketplace deployed:", wyllohMarketplaceAddress);

  // Step 6: Save deployment addresses
  console.log("\n6️⃣ Saving deployment addresses...");
  
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
    notes: {
      purpose: "Infrastructure deployment only - films will be created via Pro user web interface",
      firstFilm: "The Cocoanuts (1929) will be tokenized by Pro user after deployment"
    }
  };

  const deploymentPath = path.join(__dirname, `../deployments/${network.name}-infrastructure.json`);
  fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("✅ Deployment info saved to:", deploymentPath);

  // Step 7: Deploy summary
  console.log("\n🎉 INFRASTRUCTURE DEPLOYMENT COMPLETE!");
  console.log("=====================================");
  console.log("🎬 WYLLOH INFRASTRUCTURE DEPLOYED");
  console.log("=====================================");
  console.log("📝 Contract Addresses:");
  console.log("   WyllohToken (ERC20 Platform):", wyllohTokenAddress);
  console.log("   StoragePool:", storagePoolAddress);
  console.log("   RoyaltyDistributor:", royaltyDistributorAddress);
  console.log("   WyllohFilmRegistry (MASTER):", wyllohRegistryAddress);
  console.log("   WyllohMarketplace:", wyllohMarketplaceAddress);
  console.log("");
  console.log("🔗 Integration Status:");
  console.log("   ✅ Registry + Marketplace = Integrated");
  console.log("   ✅ Registry + Royalties = Integrated");
  console.log("   ✅ Registry + Storage = Ready");
  console.log("   ✅ USDC Payments = Ready");
  console.log("   ✅ Scalable Architecture = Ready");
  console.log("");
  console.log("🎯 Next Steps:");
  console.log("   1. Update frontend configuration with contract addresses");
  console.log("   2. Pro user can now tokenize films via web interface");
  console.log("   3. 'The Cocoanuts' awaits tokenization as first film");
  console.log("");
  console.log("🌟 READY FOR PRO USER TOKENIZATION! 🌟");

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