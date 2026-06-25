// scripts/deploy.js
import hre from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Starting deployment to Fhenix Helium...");

  // 1. Compile the contracts
  await hre.run("compile");

  // Get the signer (your wallet)
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // 2. Get the Contract Factory and connect with signer
  const FileRegistry = await hre.ethers.getContractFactory("FileRegistry", deployer);
  
  // 3. Deploy the contract
  const registry = await FileRegistry.deploy();
  await registry.waitForDeployment();
  
  const contractAddress = await registry.getAddress();
  console.log("✅ FileRegistry deployed to:", contractAddress);

  // 4. Save contract config
  const configPath = path.join(process.cwd(), 'contract-config.json');
  const config = {
    contractAddress: contractAddress,
    network: hre.network.name,
    deployedAt: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("📁 Contract config saved to contract-config.json");

  // 5. Update .env file
  const envPath = path.join(process.cwd(), '.env');
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  
  envContent = envContent.replace(/CONTRACT_ADDRESS=.*\n?/g, '');
  envContent += `CONTRACT_ADDRESS=${contractAddress}\n`;
  
  fs.writeFileSync(envPath, envContent);
  console.log("🔧 Updated .env file with new contract address");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});