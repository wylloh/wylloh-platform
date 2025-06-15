import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🌙 HISTORIC DEPLOYMENT: A Trip to the Moon - First Film on Wylloh");
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
  console.log("Film: A Trip to the Moon (1902)");
  console.log("Significance: First film tokenized on Wylloh");
  console.log("Cost: Real MATIC, permanent blockchain storage");
  console.log("Revenue: Potential earnings from beta collectors");

  // Deploy WyllohFilmFactory contract
  console.log("\n🚀 Deploying WyllohFilmFactory to Polygon Mainnet...");
  const WyllohFilmFactory = await ethers.getContractFactory("WyllohFilmFactory");
  
  const filmFactory = await WyllohFilmFactory.deploy();
  await filmFactory.waitForDeployment();
  
  const factoryAddress = await filmFactory.getAddress();
  console.log("✅ WyllohFilmFactory deployed to:", factoryAddress);

  // Create historic film: "A Trip to the Moon"
  console.log("\n🌙 Creating historic film contract: A Trip to the Moon");
  
  const filmId = "a-trip-to-the-moon";
  const filmTitle = "A Trip to the Moon";
  const maxSupply = 10_000_000; // 10 million tokens for stacking
  const rightsThresholds = [1, 2, 4, 10]; // Personal, Commercial, Regional, National
  const tokenPrice = ethers.parseEther("1.0"); // 1 MATIC per token
  const baseURI = "https://api.wylloh.com/films/";
  
  console.log("📋 Film Details:");
  console.log("  ID:", filmId);
  console.log("  Title:", filmTitle);
  console.log("  Director: Georges Méliès (1902)");
  console.log("  Max Supply:", maxSupply.toLocaleString(), "tokens");
  console.log("  Rights Thresholds:", rightsThresholds.join(", "));
  console.log("  Token Price:", ethers.formatEther(tokenPrice), "MATIC per token");
  
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
  console.log("✅ A Trip to the Moon contract deployed to:", filmContractAddress);

  // Create deployment info for Polygon mainnet
  const deploymentInfo = {
    network: "polygon",
    chainId: 137,
    factoryAddress: factoryAddress,
    historicFilmContract: filmContractAddress,
    filmId: filmId,
    filmTitle: filmTitle,
    director: "Georges Méliès",
    year: 1902,
    deployer: deployer.address,
    deploymentDate: new Date().toISOString(),
    architecture: "film-specific-contracts",
    tokenModel: "revolutionary-stacking",
    significance: "First film tokenized on Wylloh platform",
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
  console.log("🌙 Historic Film Contract:", filmContractAddress);
  console.log("🎬 Film:", filmTitle, "(1902)");
  console.log("🎭 Director: Georges Méliès");
  console.log("📊 Max Supply:", maxSupply.toLocaleString(), "tokens");
  console.log("⚖️ Rights Thresholds:", rightsThresholds.join(", "));
  console.log("🔍 Factory Explorer:", `https://polygonscan.com/address/${factoryAddress}`);
  console.log("🎪 Film Explorer:", `https://polygonscan.com/address/${filmContractAddress}`);
  console.log("📁 Config saved to:", polygonConfigPath);
  
  console.log("\n🔧 Revolutionary Stacking Model & Pricing:");
  console.log("1 token = Personal Viewing Rights (1 MATIC)");
  console.log("2 tokens = Commercial Exhibition + IMF/DCP Access (2 MATIC total)");
  console.log("4 tokens = Regional Distribution Rights (4 MATIC total)");
  console.log("10 tokens = National Broadcast Rights (10 MATIC total)");
  
  console.log("\n🎯 Next Steps:");
  console.log("1. Update client configuration to use Polygon mainnet");
  console.log("2. Upload 'A Trip to the Moon' film content");
  console.log("3. Begin three-wallet production testing");
  console.log("4. Test token stacking mechanics with real MATIC");
  console.log("5. Validate complete user journey on production");
  
  console.log("\n🌐 Polygon Mainnet Resources:");
  console.log("Explorer: https://polygonscan.com");
  console.log("Bridge: https://wallet.polygon.technology/polygon/bridge");
  console.log("RPC: https://polygon-rpc.com");
  
  console.log("\n🌙 HISTORIC ACHIEVEMENT:");
  console.log("'A Trip to the Moon' is now the FIRST FILM tokenized on Wylloh!");
  console.log("This deployment marks the beginning of blockchain-based film distribution.");
  console.log("Georges Méliès' 1902 masterpiece leads us into the future of cinema! 🚀");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 