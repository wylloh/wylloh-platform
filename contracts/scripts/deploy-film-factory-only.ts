import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🏭 WYLLOH FILM FACTORY DEPLOYMENT");
  console.log("🌐 Deploying to Polygon Mainnet");
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

  // PRODUCTION DEPLOYMENT CONFIRMATION
  console.log("\n🚨 PRODUCTION DEPLOYMENT CONFIRMATION");
  console.log("=====================================");
  console.log("Network: Polygon Mainnet");
  console.log("Chain ID: 137");
  console.log("Purpose: Film Factory for user-driven film creation");
  console.log("Cost: Real MATIC, permanent blockchain storage");
  console.log("Next Step: Users create films via Pro UI");

  // Deploy WyllohFilmFactory contract
  console.log("\n🚀 Deploying WyllohFilmFactory to Polygon Mainnet...");
  const WyllohFilmFactory = await ethers.getContractFactory("WyllohFilmFactory");
  
  const filmFactory = await WyllohFilmFactory.deploy();
  await filmFactory.waitForDeployment();
  
  const factoryAddress = await filmFactory.getAddress();
  console.log("✅ WyllohFilmFactory deployed to:", factoryAddress);

  // Create deployment info for Polygon mainnet
  const deploymentInfo = {
    network: "polygon",
    chainId: 137,
    factoryAddress: factoryAddress,
    deployer: deployer.address,
    deploymentDate: new Date().toISOString(),
    architecture: "film-factory-only",
    userDriven: true,
    description: "Factory contract for user-driven film tokenization via Pro UI"
  };

  // Save Polygon mainnet deployment addresses
  const polygonConfigPath = path.join(__dirname, "../../client/src/config/polygonAddresses.json");
  fs.writeFileSync(polygonConfigPath, JSON.stringify(deploymentInfo, null, 2));

  // Log deployment info
  console.log("\n🎉 FILM FACTORY DEPLOYMENT COMPLETE!");
  console.log("====================================");
  console.log("🌐 Network:", network.name);
  console.log("🔗 Chain ID:", network.config.chainId);
  console.log("🏭 WyllohFilmFactory:", factoryAddress);
  console.log("🔍 Factory Explorer:", `https://polygonscan.com/address/${factoryAddress}`);
  console.log("📁 Config saved to:", polygonConfigPath);
  
  console.log("\n🎯 Next Steps:");
  console.log("1. Update client configuration with factory address");
  console.log("2. Connect Pro wallet to wylloh.com");
  console.log("3. Use TokenizePublishPage to create 'A Trip to the Moon'");
  console.log("4. Configure custom thresholds: 1, 2, 4, 10 tokens");
  console.log("5. Test complete user-driven workflow");
  
  console.log("\n🌐 Polygon Mainnet Resources:");
  console.log("Explorer: https://polygonscan.com");
  console.log("Bridge: https://wallet.polygon.technology/polygon/bridge");
  console.log("RPC: https://polygon-rpc.com");
  
  console.log("\n🎬 USER-DRIVEN APPROACH:");
  console.log("Factory deployed - now users create films through Pro UI!");
  console.log("This ensures production workflow testing with real user experience.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 