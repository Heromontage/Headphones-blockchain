# Aether Audio

Premium headphone landing page and specifications, built with Next.js, Framer Motion, and Three.js.

## 🎧 AETHER Points Rewards Program

The Aether Audio platform now features a blockchain-based loyalty rewards program using ERC-20 tokens called AETHER Points (ATP).

### Features

- **Earn Points**: Customers earn 1 AETHER Point for every $1 spent (configurable)
- **Track Balance**: Real-time balance checking via blockchain integration
- **Redeem Points**: Convert points to discount codes for future purchases
- **Secure**: All blockchain transactions handled server-side
- **Transparent**: All transactions verifiable on Polygonscan

### Setup

1. **Deploy the ATP Token Contract**
   ```bash
   # Install dependencies
   npm install
   
   # Compile the contract
   npx hardhat compile
   
   # Deploy to Polygon Mumbai testnet
   # Make sure you have set the following in your .env file:
   #   API_URL=<your_polygon_mumbai_rpc_url>
   #   TOKEN_MINTING_PRIVATE_KEY=<your_private_key_with_matic>
   npx hardhat run scripts/deploy.js --network mumbai
   ```

2. **Configure Environment Variables**
   Copy `.env.example` to `.env` and fill in:
   ```dotenv
   NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS=<your_deployed_contract_address>
   NEXT_PUBLIC_NETWORK_RPC_URL=<your_polygon_mumbai_rpc_url>
   TOKEN_MINTING_PRIVATE_KEY=<your_private_key_for_minting>
   POINTS_PER_DOLLAR=1
   POINTS_EXPIRY_DAYS=365
   ```

3. **Run the Application**
   ```bash
   npm run dev
   ```

### API Endpoints

- `POST /api/rewards/mint-points` - Earn points after purchase
- `GET /api/rewards/get-balance` - Check current points balance
- `POST /api/rewards/redeem-points` - Redeem points for discount codes

### Frontend Components

- `<WalletConnection />` - Connect/disconnect Ethereum wallet
- `<RewardsDashboard />` - View balance, earnings, and redemption options
- Enhanced order success page - Shows points earned from purchase

### Security Notes

- Private keys are stored only in environment variables and never exposed to the frontend
- All wallet addresses are validated on the backend before processing transactions
- Rate limiting is applied to prevent abuse of reward endpoints
- Only authenticated users can access rewards functionality

## Getting Started

To do a fresh run of the website locally, follow these steps:

1. **Install Dependencies**
   Make sure you have Node.js installed, then run the following in your terminal:
   ```bash
   npm install
   ```

2. **Start the Development Server**
   Once everything is installed, start the local server:
   ```bash
   npm run dev
   ```

3. **View the Site**
   Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Tech Stack
- Next.js (App Router)
- React & Tailwind CSS
- Framer Motion (Animations & Scroll effects)
- Three.js / React Three Fiber (3D Canvas & WebGL effects)
- Ethers.js & Wagmi (Blockchain integration)
- Hardhat (Smart contract development)