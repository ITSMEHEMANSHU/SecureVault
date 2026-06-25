# 🔒 SecureVault

SecureVault is a privacy-first decentralized cloud storage platform built on Fhenix CoFHE. It uses client-side Fully Homomorphic Encryption (FHE) to encrypt file search tags in the browser before routing binaries to Filebase IPFS and caching states with Supabase, enabling zero-knowledge on-chain indexing without metadata leaks.

## 🛠️ Tech Stack
* **Frontend:** React, Tailwind CSS, Framer Motion, @cofhe/sdk
* **Backend:** Node.js, Express, Ethers.js
* **Storage & DB:** Filebase (IPFS), Supabase (PostgreSQL)
* **Blockchain:** Fhenix CoFHE (Sepolia Testnet)

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies
```bash
git clone [https://github.com/ITSMEHEMANSHU/SecureVault.git](https://github.com/ITSMEHEMANSHU/SecureVault.git)
cd SecureVault

# Install Backend
cd backend && npm install

# Install Frontend
cd ../frontend && npm install