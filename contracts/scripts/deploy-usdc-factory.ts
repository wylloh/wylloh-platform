import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🏭 WYLLOH USDC-COMPATIBLE FACTORY DEPLOYMENT");
  console.log("🌐 Deploying to Polygon Mainnet with USDC Support");
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
  console.log("\n🚨 USDC-COMPATIBLE PRODUCTION DEPLOYMENT");
  console.log("========================================");
  console.log("Network: Polygon Mainnet");
  console.log("Chain ID: 137");
  console.log("Payment Method: USDC (0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174)");
  console.log("Purpose: Factory for Pro account film tokenization with USDC pricing");
  console.log("Strategy: $19.99 USDC per token (iTunes/Amazon Prime Video parity)");
  console.log("Stripe Integration: Credit card → USDC → Blockchain purchase");

  // Deploy WyllohFilmFactory contract
  console.log("\n🚀 Deploying USDC-Compatible WyllohFilmFactory...");
  const WyllohFilmFactory = await ethers.getContractFactory("WyllohFilmFactory");
  
  const filmFactory = await WyllohFilmFactory.deploy();
  await filmFactory.waitForDeployment();
  
  const factoryAddress = await filmFactory.getAddress();
  console.log("✅ USDC-Compatible WyllohFilmFactory deployed to:", factoryAddress);

  // Create deployment info for Polygon mainnet with USDC support
  const deploymentInfo = {
    network: "polygon",
    chainId: 137,
    factoryAddress: factoryAddress,
    deployer: deployer.address,
    deploymentDate: new Date().toISOString(),
    architecture: "usdc-compatible-factory",
    paymentMethod: "USDC",
    usdcAddress: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    defaultTokenPrice: "19.99", // $19.99 USDC per token
    userDriven: true,
    stripeIntegration: true,
    description: "USDC-compatible factory for Pro-driven film tokenization with Stripe fallback"
  };

  // Save Polygon mainnet deployment addresses  
  const polygonConfigPath = path.join(__dirname, "../../client/src/config/polygonAddresses.json");
  fs.writeFileSync(polygonConfigPath, JSON.stringify(deploymentInfo, null, 2));

  // Log deployment info
  console.log("\n🎉 USDC-COMPATIBLE FACTORY DEPLOYMENT COMPLETE!");
  console.log("=================================================");
  console.log("🌐 Network:", network.name);
  console.log("🔗 Chain ID:", network.config.chainId);
  console.log("🏭 Factory Address:", factoryAddress);
  console.log("💳 Payment Method: USDC");
  console.log("💰 Default Price: $19.99 USDC per token");
  console.log("🔍 Factory Explorer:", `https://polygonscan.com/address/${factoryAddress}`);
  console.log("📁 Config saved to:", polygonConfigPath);
  
  console.log("\n🎯 Next Steps for Testing:");
  console.log("1. ✅ Factory deployed with USDC support");
  console.log("2. 🔄 Update client configuration with factory address");
  console.log("3. 🎬 Pro account ready to tokenize 'The Cocoanuts' via UI");
  console.log("4. 💳 Stripe integration ready for credit card → USDC → purchase flow");
  console.log("5. 🧪 Test complete publishing workflow (Pro account)");
  console.log("6. 🛒 Test complete purchasing workflow (Regular user)");
  
  console.log("\n💡 TESTING STRATEGY:");
  console.log("• Pro Workflow: Connect wallet → Tokenize film → Set $19.99 USDC price");
  console.log("• User Workflow: Browse film → Purchase → Stripe fallback if insufficient USDC");
  console.log("• Integration Test: End-to-end USDC payment with Stripe credit card backup");
  
  console.log("\n🌐 Polygon Mainnet Resources:");
  console.log("Explorer: https://polygonscan.com");
  console.log("USDC Contract: https://polygonscan.com/token/0x2791bca1f2de4661ed88a30c99a7a9449aa84174");
  console.log("Bridge: https://wallet.polygon.technology/polygon/bridge");
  console.log("RPC: https://polygon-rpc.com");
  
  console.log("\n🎭 READY FOR 'THE COCOANUTS' TOKENIZATION!");
  console.log("Factory deployed - Pro account can now tokenize films with USDC pricing!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ USDC Factory deployment failed:", error);
    process.exit(1);
  }); 