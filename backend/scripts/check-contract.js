// scripts/check-contract.js
import { ethers } from "ethers";
import fs from "fs";
import path from "path";

async function checkContract() {
  const configPath = path.join(process.cwd(), 'contract-config.json');
  
  if (!fs.existsSync(configPath)) {
    console.log("❌ No contract config found. Run deploy script first.");
    return;
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  console.log("📋 Contract Config:", config);

  try {
    const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
    const code = await provider.getCode(config.contractAddress);
    
    if (code === '0x') {
      console.log("❌ Contract doesn't exist at address");
    } else {
      console.log("✅ Contract is deployed and active");
    }
  } catch (error) {
    console.error("Error checking contract:", error);
  }
}

checkContract();