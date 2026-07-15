# Aether Audio 🎧

Premium headphone landing page and specifications, built with Next.js, Framer Motion, Three.js, and a Web3 Loyalty Program.

## About the Project

Aether Audio is a state-of-the-art e-commerce platform that integrates a blockchain-based loyalty rewards program using ERC-20 tokens called **AETHER Points (ATP)**.

### How it Works
1. **Interactive Frontend**: Built with Next.js and React Three Fiber to display high-quality 3D renders of headphones with smooth Framer Motion animations.
2. **Web3 Rewards**: Customers earn 1.5 AETHER Point for every order. These points are minted on the blockchain and tied to the user's wallet.
3. **Redemption**: Users can connect their Ethereum/Polygon wallet to view their balance and redeem points for discount codes on future purchases.
4. **Backend**: Uses a MySQL database (via Docker) to store non-blockchain related user data and orders securely.

---

## 🚀 Pure Fresh Clean Setup

Follow these instructions to get the project up and running from scratch on any platform (Windows, Linux, or macOS).

### 1. Install Dependencies
First, ensure you have [Node.js](https://nodejs.org/) installed on your machine.
```bash
npm install
```

### 2. Smart Contracts (Hardhat)
Compile the Solidity smart contracts to generate the necessary artifacts and cache. This step is required for the frontend to interact with the blockchain.
```bash
npx hardhat compile
```

### 3. Environment Variables
Copy the example environment file and fill in your credentials.
```bash
# On Linux/macOS
cp .env.example .env

# On Windows (PowerShell)
Copy-Item .env.example -Destination .env
```
Open the `.env` file and configure the following:
- **`NEXT_PUBLIC_NETWORK_RPC_URL`**: Your blockchain RPC URL. For local Hardhat, use `http://127.0.0.1:8545`. For testnets like Polygon Amoy/Mumbai, get a URL from providers like [Alchemy](https://www.alchemy.com/) or [Infura](https://www.infura.io/).
- **`TOKEN_MINTING_PRIVATE_KEY`**: Your wallet private key. For local testing, copy one of the 20 fake private keys given when you run the hardhat node. For testnet, export it securely from MetaMask.
- **`NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS`**: The address of your deployed contract. You will get this address after deploying your smart contract in the next step.
- **Database Variables**: Keep as default if using the local docker setup (`aether_user` / `aether_password` / `aether_db`).

### 4. Deploy Smart Contracts
After setting up your `.env` file (except the contract address), deploy your smart contract.
```bash
# To deploy to the local hardhat network (Make sure your node is running in another terminal!):
npx hardhat run scripts/deploy.js --network localhost

# To deploy to a public testnet (e.g., Polygon Mumbai/Amoy):
npx hardhat run scripts/deploy.js --network mumbai
```
*Note: Once deployed, the terminal will print the contract address. Copy this address and paste it into your `.env` file for `NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS`.*

---

## 🛠 Running the Services

### 1. Start the Local Blockchain (Hardhat Node)
To test smart contracts locally without spending real MATIC/ETH, Hardhat provides a local network with 20 fake accounts pre-funded with 10,000 fake tokens. 
Run this in a **separate terminal window** and keep it running:
```bash
npx hardhat node
```
*Note: This command works identically across Windows, Linux, and macOS.*

### 2. Start the Database (Docker)
This project uses a MySQL database. Ensure you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running on your system, then start the database container in the background:
```bash
docker-compose up -d
```
*(To stop the database later, run `docker-compose down`)*

### 3. Start the Development Server
Finally, start the Next.js development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application!

---

## 📚 Technical Details

### API Endpoints
- `POST /api/rewards/mint-points` - Earn points after purchase
- `GET /api/rewards/get-balance` - Check current points balance
- `POST /api/rewards/redeem-points` - Redeem points for discount codes

### Security Notes
- Private keys are stored only in environment variables and never exposed to the frontend.
- All wallet addresses are validated on the backend before processing transactions.
- Rate limiting is applied to prevent abuse of reward endpoints.
- Only authenticated users can access rewards functionality.

### Tech Stack
- **Frontend**: Next.js (App Router), React, Tailwind CSS, Framer Motion
- **3D Graphics**: Three.js / React Three Fiber
- **Web3**: Ethers.js, Wagmi, Hardhat (Smart contract development)
- **Database**: MySQL (Dockerized)