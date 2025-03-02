// Scripts for deploying the Wylloh smart contracts
const hre = require("hardhat");

async function main() {
  console.log("Deploying Wylloh smart contracts...");

  // Get the contract factories
  const WyllohToken = await hre.ethers.getContractFactory("WyllohToken");
  
  // Deploy the WyllohToken contract
  const baseURI = "https://api.wylloh.com/metadata/";
  const wyllohToken = await WyllohToken.deploy(baseURI);
  await wyllohToken.deployed();
  
  console.log("WyllohToken deployed to:", wyllohToken.address);

  // Verify contracts on Etherscan/Polygonscan if not on localhost
  const networkName = hre.network.name;
  if (networkName !== "localhost" && networkName !== "hardhat") {
    console.log("Waiting for block confirmations...");
    // Wait for 6 block confirmations to ensure the contract is deployed
    await wyllohToken.deployTransaction.wait(6);
    
    console.log("Verifying contracts on Polygonscan...");
    await hre.run("verify:verify", {
      address: wyllohToken.address,
      constructorArguments: [baseURI],
    });
  }

  console.log("Deployment completed successfully!");
}

// Execute the deployment function
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });