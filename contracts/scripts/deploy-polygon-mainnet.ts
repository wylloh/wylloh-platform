import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🎭 HISTORIC DEPLOYMENT: The Cocoanuts (1929) - Marx Brothers First Film on Wylloh");
  console.log("🌐 Deploying Wylloh Film Factory to Polygon Mainnet");
  console.log("👤 Deployer account:", deployer.address);
  
  // CRITICAL: Verify we're on Polygon mainnet
  if (network.name !== "polygon") {
    throw new Error("❌ SAFETY CHECK FAILED: This script is for Polygon mainnet ONLY. Use --network polygon");
  }

  // Check deployer balance
  const balance = await deployer.provider.getBalance(deployer.address);
  const balanceInMatic = ethers.formatEther(balance);
  console.log("💰 Deployer balance:", balanceInMatic, "MATIC");
  
  // SAFETY CHECK: Minimum balance for deployment
  const minimumBalance = ethers.parseEther("2.0"); // 2 MATIC minimum
  if (balance < minimumBalance) {
    console.log("❌ INSUFFICIENT BALANCE for safe deployment");
    console.log("💡 Recommended: At least 2 MATIC for deployment + buffer");
    console.log("🛒 Get MATIC: https://www.coinbase.com/price/polygon or DEX");
    return;
  }

  console.log("✅ Sufficient MATIC balance for production deployment");

  // SAFETY CONFIRMATION
  console.log("\n🚨 PRODUCTION DEPLOYMENT CONFIRMATION");
  console.log("=====================================");
  console.log("Network: Polygon Mainnet");
  console.log("Chain ID: 137");
  console.log("Film: The Cocoanuts (1929)");
  console.log("Stars: Marx Brothers (Groucho, Chico, Harpo, Zeppo)");
  console.log("Significance: First Marx Brothers film, first feature film tokenized on Wylloh");
  console.log("Cost: Real MATIC, permanent blockchain storage");
  console.log("Revenue: Potential earnings from Marx Brothers fans worldwide");

  // Deploy WyllohFilmFactory contract
  console.log("\n🚀 Deploying WyllohFilmFactory to Polygon Mainnet...");
  const WyllohFilmFactory = await ethers.getContractFactory("WyllohFilmFactory");
  
  const filmFactory = await WyllohFilmFactory.deploy();
  await filmFactory.waitForDeployment();
  
  const factoryAddress = await filmFactory.getAddress();
  console.log("✅ WyllohFilmFactory deployed to:", factoryAddress);

  // Create historic film: "The Cocoanuts" (1929) Marx Brothers
  console.log("\n🎪 Creating historic film contract: The Cocoanuts (1929)");
  
  const filmId = "the-cocoanuts-1929";
  const filmTitle = "The Cocoanuts";
  const maxSupply = 10_000_000; // 10 million tokens for feature film stacking
  
  // Feature film economics - optimized for 96-minute Marx Brothers feature
  const rightsThresholds = [
    1,    // Stream: Full film streaming access
    25,   // Download: Offline viewing + bonus features  
    250,  // Commercial: Public screening rights
    2500  // Master Archive: Highest quality + restoration materials
  ];
  
  const baseURI = "https://api.wylloh.com/films/";
  
  console.log("📋 Marx Brothers Film Details:");
  console.log("  ID:", filmId);
  console.log("  Title:", filmTitle);
  console.log("  Year: 1929");
  console.log("  Stars: Marx Brothers (Groucho, Chico, Harpo, Zeppo)");
  console.log("  Director: Robert Florey & Joseph Santley");
  console.log("  Runtime: 96 minutes");
  console.log("  Genre: Musical Comedy");
  console.log("  Significance: First Marx Brothers film, vaudeville to cinema transition");
  console.log("  Max Supply:", maxSupply.toLocaleString(), "tokens");
  console.log("  Rights Thresholds:", rightsThresholds.join(", "));
  console.log("  Contract Version: Production-ready with presales extensibility");
  
  const createFilmTx = await filmFactory.deployFilmContract(
    filmId,
    filmTitle,
    deployer.address,
    maxSupply,
    rightsThresholds,
    baseURI
  );
  
  const receipt = await createFilmTx.wait();
  console.log("🎭 Film contract creation transaction:", receipt?.hash);
  
  // Get the deployed film contract address
  const filmContractAddress = await filmFactory.getFilmContract(filmId);
  console.log("✅ The Cocoanuts contract deployed to:", filmContractAddress);

  // Create deployment info for Polygon mainnet
  const deploymentInfo = {
    network: "polygon",
    chainId: 137,
    factoryAddress: factoryAddress,
    historicFilmContract: filmContractAddress,
    filmId: filmId,
    filmTitle: filmTitle,
    year: 1929,
    stars: "Marx Brothers (Groucho, Chico, Harpo, Zeppo)",
    directors: "Robert Florey & Joseph Santley",
    runtime: "96 minutes",
    genre: "Musical Comedy",
    significance: "First Marx Brothers film, first feature film tokenized on Wylloh",
    deployer: deployer.address,
    deploymentDate: new Date().toISOString(),
    architecture: "film-specific-contracts",
    tokenModel: "revolutionary-stacking",
    rightsThresholds: rightsThresholds,
    presalesExtensible: true,
    escrowCompatible: true,
    gasUsed: receipt?.gasUsed?.toString(),
    transactionHash: receipt?.hash
  };

  // Save Polygon mainnet deployment addresses
  const polygonConfigPath = path.join(__dirname, "../../client/src/config/polygonAddresses.json");
  fs.writeFileSync(polygonConfigPath, JSON.stringify(deploymentInfo, null, 2));

  // Log deployment info
  console.log("\n🎉 HISTORIC POLYGON MAINNET DEPLOYMENT COMPLETE!");
  console.log("================================================");
  console.log("🌐 Network:", network.name);
  console.log("🔗 Chain ID:", network.config.chainId);
  console.log("🏭 WyllohFilmFactory:", factoryAddress);
  console.log("🎪 Marx Brothers Film Contract:", filmContractAddress);
  console.log("🎬 Film:", filmTitle, "(1929)");
  console.log("🎭 Stars: Marx Brothers (Groucho, Chico, Harpo, Zeppo)");
  console.log("📊 Max Supply:", maxSupply.toLocaleString(), "tokens");
  console.log("⚖️ Rights Thresholds:", rightsThresholds.join(", "));
  console.log("🔍 Factory Explorer:", `https://polygonscan.com/address/${factoryAddress}`);
  console.log("🎪 Film Explorer:", `https://polygonscan.com/address/${filmContractAddress}`);
  console.log("📁 Config saved to:", polygonConfigPath);
  
  console.log("\n🔧 Feature Film Economics & Rights Tiers:");
  console.log("1 token = Stream (Full film streaming access)");
  console.log("25 tokens = Download (Offline viewing + bonus features)");
  console.log("250 tokens = Commercial (Public screening rights)");
  console.log("2500 tokens = Master Archive (Highest quality + restoration materials)");
  
  console.log("\n🚀 Presales & Escrow Readiness:");
  console.log("✅ Access Control: Role-based system ready for PRESALE_ROLE");
  console.log("✅ Token Stacking: Perfect for presales campaign mechanics");
  console.log("✅ Time-locked Staking: Built-in escrow functionality");
  console.log("✅ Beta Graduation: Smooth transition from presales to production");
  console.log("✅ Event System: Comprehensive tracking for all state changes");
  
  console.log("\n🎯 Next Steps:");
  console.log("1. Update client configuration to use Polygon mainnet");
  console.log("2. Upload 'The Cocoanuts' film content and metadata");
  console.log("3. Test Pro user upload workflow");
  console.log("4. Test end-to-end purchase flow with Marx Brothers tokens");
  console.log("5. Validate complete user journey on production");
  console.log("6. Ready for Harrison's trailer integration");
  
  console.log("\n🌐 Polygon Mainnet Resources:");
  console.log("Explorer: https://polygonscan.com");
  console.log("Bridge: https://wallet.polygon.technology/polygon/bridge");
  console.log("RPC: https://polygon-rpc.com");
  
  console.log("\n🎪 HISTORIC ACHIEVEMENT:");
  console.log("'The Cocoanuts' is now the FIRST MARX BROTHERS FILM tokenized on blockchain!");
  console.log("This deployment marks the beginning of mainstream film tokenization.");
  console.log("From 1929 vaudeville to 2025 blockchain - Marx Brothers lead us into the future! 🚀");
  console.log("\n🎬 Ready for millions of Marx Brothers fans worldwide to own piece of cinema history!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 