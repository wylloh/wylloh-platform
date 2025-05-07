import { ethers } from "hardhat";
import { upgrades } from "hardhat";
import { network } from "hardhat";
import * as hre from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy WyllohToken implementation
  const WyllohToken = await ethers.getContractFactory("WyllohToken");
  console.log("Deploying WyllohToken...");
  
  const wyllohToken = await upgrades.deployProxy(WyllohToken, [
    "https://api.wylloh.com/tokens/", // Base URI
  ], {
    initializer: "initialize",
  });
  await wyllohToken.deployed();

  console.log("WyllohToken deployed to:", wyllohToken.address);

  // Verify contract on PolygonScan
  if (process.env.POLYGONSCAN_API_KEY) {
    console.log("Waiting for block confirmations...");
    await wyllohToken.deployTransaction.wait(6); // Wait for 6 block confirmations

    console.log("Verifying contract on PolygonScan...");
    try {
      await hre.run("verify:verify", {
        address: wyllohToken.address,
        constructorArguments: [],
      });
      console.log("Contract verified successfully");
    } catch (error) {
      console.error("Error verifying contract:", error);
    }
  }

  // Log deployment info
  console.log("\nDeployment Info:");
  console.log("----------------");
  console.log("Network:", network.name);
  console.log("WyllohToken:", wyllohToken.address);
  console.log("Implementation:", await upgrades.erc1967.getImplementationAddress(wyllohToken.address));
  console.log("Admin:", await upgrades.erc1967.getAdminAddress(wyllohToken.address));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 