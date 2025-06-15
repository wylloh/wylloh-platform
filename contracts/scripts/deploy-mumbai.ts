import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🌐 Deploying Wylloh Film Factory to Mumbai testnet with account:", deployer.address);
  
  // Check network
  if (network.name !== "mumbai") {
    throw new Error("This script is for Mumbai testnet only. Use --network mumbai");
  }

  // Check deployer balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "MATIC");
  
  if (balance === 0n) {
    console.log("❌ No MATIC balance. Get testnet MATIC from: https://faucet.polygon.technology/");
    return;
  }

  console.log("💎 Sufficient MATIC balance for deployment");

  // Deploy WyllohFilmFactory contract
  const WyllohFilmFactory = await ethers.getContractFactory("WyllohFilmFactory");
  console.log("🚀 Deploying WyllohFilmFactory to Mumbai testnet...");
  
  const filmFactory = await WyllohFilmFactory.deploy();
  await filmFactory.waitForDeployment();
  
  const factoryAddress = await filmFactory.getAddress();
  console.log("✅ WyllohFilmFactory deployed to:", factoryAddress);

  // Create test film: "The Cabinet of Dr. Caligari"
  console.log("🎬 Creating test film contract: The Cabinet of Dr. Caligari");
  
  const filmId = "cabinet-of-dr-caligari";
  const filmTitle = "The Cabinet of Dr. Caligari";
  const maxSupply = 10_000_000; // 10 million tokens for stacking
  const rightsThresholds = [1, 1000, 10000, 100000]; // Personal, Commercial, Regional, National
  const baseURI = "https://api.wylloh.com/films/";
  
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
  console.log("✅ Cabinet of Dr. Caligari contract deployed to:", filmContractAddress);

  // Create deployment info for Mumbai testnet
  const deploymentInfo = {
    network: "mumbai",
    chainId: 80001,
    factoryAddress: factoryAddress,
    testFilmContract: filmContractAddress,
    testFilmId: filmId,
    testFilmTitle: filmTitle,
    deployer: deployer.address,
    deploymentDate: new Date().toISOString(),
    architecture: "film-specific-contracts",
    tokenModel: "revolutionary-stacking"
  };

  // Save Mumbai deployment addresses
  const mumbaiConfigPath = path.join(__dirname, "../../client/src/config/mumbaiAddresses.json");
  fs.writeFileSync(mumbaiConfigPath, JSON.stringify(deploymentInfo, null, 2));

  // Log deployment info
  console.log("\n🎉 Mumbai Testnet Deployment Complete!");
  console.log("=====================================");
  console.log("Network:", network.name);
  console.log("Chain ID:", network.config.chainId);
  console.log("WyllohFilmFactory:", factoryAddress);
  console.log("Test Film Contract:", filmContractAddress);
  console.log("Film ID:", filmId);
  console.log("Max Supply:", maxSupply.toLocaleString(), "tokens");
  console.log("Rights Thresholds:", rightsThresholds.join(", "));
  console.log("Factory Explorer:", `https://mumbai.polygonscan.com/address/${factoryAddress}`);
  console.log("Film Explorer:", `https://mumbai.polygonscan.com/address/${filmContractAddress}`);
  console.log("Config saved to:", mumbaiConfigPath);
  
  console.log("\n🔧 Revolutionary Stacking Model:");
  console.log("1 token = Personal Viewing");
  console.log("1,000 tokens = Commercial Exhibition + IMF/DCP Access");
  console.log("10,000 tokens = Regional Distribution Rights");
  console.log("100,000 tokens = National Broadcast Rights");
  
  console.log("\n🎯 Next Steps:");
  console.log("1. Update client configuration to use Mumbai film factory");
  console.log("2. Get Mumbai MATIC from faucet for testing wallets");
  console.log("3. Begin three-wallet testing with film-specific contracts");
  console.log("4. Test token stacking mechanics for rights unlocking");
  
  console.log("\n🌐 Mumbai Testnet Resources:");
  console.log("Explorer: https://mumbai.polygonscan.com");
  console.log("Faucet: https://faucet.polygon.technology/");
  console.log("RPC: https://rpc-mumbai.maticvigil.com");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 