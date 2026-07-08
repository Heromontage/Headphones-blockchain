# Feature Spec: Wallet-Based Checkout with Crypto Payment & Order Lifecycle

## Purpose
This document is written to be handed directly to a coding agent (e.g. Claude Code) working in the `Headphones-blockchain` repo. It specifies a feature that requires every user to connect a MetaMask wallet at signup, pays for the product on-chain (in ETH, converted from the USD price at signup-time market rate) from that wallet to the developer's wallet on a local Hardhat network, and introduces a full order status lifecycle managed through a new admin panel.

---

## 1. Overview

Currently, `/api/orders` creates an order with a hardcoded $499 total and no real payment — it's a stub. This feature turns that into an actual (test-network) crypto payment flow:

- Every new user must connect a MetaMask wallet during signup (blocking is soft: account is still created if wallet connection fails, but ordering is blocked until connected).
- The app runs against a **local Hardhat network** (chainId `31337`), where MetaMask accounts come pre-funded with test ETH — this is the "fake currency."
- At checkout, the product's USD price is converted to ETH using a live market rate, and the user pays that ETH amount directly from their wallet to the developer's wallet address.
- AETHER Points (the existing ERC-20 loyalty token) are still minted on top of this, unchanged from current behavior.
- Orders now carry a full status lifecycle (`PENDING` → ... → `DELIVERED`), updated through a new admin-only panel.

---

## 2. User Flow

1. **Signup**: User fills the signup form (name, email, phone, password) and submits.
2. **Wallet connect prompt**: Immediately after account creation succeeds, the app prompts MetaMask connection (reuse existing `WalletConnection` component, triggered inline rather than only on the order page).
   - If the user's MetaMask is not on the Hardhat local network, attempt to auto-switch/add it (see Section 3).
   - If connection succeeds: save `wallet_address` to the user's row, mark `wallet_connected = true`.
   - If connection fails or is rejected: account still exists, `wallet_address` stays `NULL`. Show a persistent banner ("Connect your wallet to place orders") until resolved.
3. **Browsing**: Unchanged — product page, specs page.
4. **Attempting to order**: If `wallet_address` is `NULL`, the "Order" button is disabled/redirects to a wallet-connect prompt instead of the order page.
5. **Order confirmation page** (new): Shows —
   - Order summary (product, color/variant, USD price)
   - Live-converted ETH price and the market rate used
   - Shipping address form, pre-filled from the user's profile if already saved (address lives on the user's profile only, not per-order)
   - AETHER Points that will be earned upon completion
   - "Confirm & Pay" button
6. **Payment**: On confirm, the frontend requests a signed transaction from MetaMask sending the quoted ETH amount to the developer's wallet address.
7. **Confirmation & order creation**: Once the transaction is mined and verified server-side, the order is created/updated with `status = PAID`, the tx hash is stored, and AETHER Points are minted as before.
8. **Order success page**: Shows order status, tx hash (with a note that this is a local test network, so no real block explorer link), and points earned.
9. **Post-order lifecycle**: An admin updates order status over time via the new admin panel; the user's profile/order page reflects the current status.

---

## 3. Wallet & Network Setup

**Target network**: Hardhat local node
- Chain ID: `31337`
- RPC URL: `http://127.0.0.1:8545`
- Currency symbol: `ETH`
- Chain name (for MetaMask UI): `Hardhat Local`

**Implementation steps**:
1. Define this chain as a custom chain object for `wagmi`/`viem` config (`defineChain` from viem), replacing or adding to whatever chain config currently exists in the wagmi setup.
2. On wallet connect, after `connectAsync`, check `chainId` from `useAccount`/`useChainId`.
3. If not `31337`:
   - First attempt `wallet_switchEthereumChain` (via `switchChainAsync` from wagmi).
   - If MetaMask returns error code `4902` (chain not added), fall back to `wallet_addEthereumChain` with the params above (`addChainAsync` or raw `window.ethereum.request`).
4. If both attempts fail (user manually rejects), show a static instructions panel: chain ID, RPC URL, currency symbol, with a "copy" button for each field, so the user can add it manually in MetaMask settings.
5. Store `wallet_connected` state in the DB only after both wallet address AND correct chain ID are confirmed — don't save `wallet_address` if the user is on the wrong network and refuses to switch.

**Dev environment note**: This requires `npx hardhat node` running locally as a prerequisite. Add this to the README setup steps if not already documented.

---

## 4. Payment Flow

**Price conversion**:
1. Product USD price is defined server-side (fix the current bug where the client sends `total: 499` directly — see Section 8).
2. Server fetches a live ETH/USD rate (e.g. from CoinGecko's public API, cached for a short TTL like 60s to avoid rate limits) — since this is a demo on a fake network, the rate is used only for realistic conversion math, not real settlement.
3. Server computes `ethAmount = usdPrice / ethUsdRate`, and returns both `ethAmount` and `rateUsed` to the frontend for display on the confirmation page (Section 2, step 5).

**Payment execution**:
1. Frontend uses `ethAmount` (converted to wei) to build a transaction: `to: DEV_WALLET_ADDRESS`, `value: ethAmountInWei`.
2. Use wagmi's `useSendTransaction` (or ethers `signer.sendTransaction`) to prompt MetaMask.
3. Wait for the transaction receipt (Hardhat mines instantly, so this resolves fast).
4. Send `{ txHash, orderId }` to the backend for verification (never trust the frontend's "it succeeded" claim alone).

**Server-side verification** (critical — see Section 8):
1. Backend connects to the same Hardhat RPC and fetches the transaction receipt by hash.
2. Verify: `receipt.status === 1` (success), `tx.to === DEV_WALLET_ADDRESS`, `tx.value` matches the expected `ethAmountInWei` computed server-side (not what the client reports), and that this `txHash` hasn't already been used on a different order (prevent replay/reuse).
3. Only after all checks pass: set `orders.status = 'PAID'`, store `payment_tx_hash`, `eth_amount`, `usd_to_eth_rate`.
4. Trigger the existing AETHER Points minting logic (unchanged from current `/api/orders` behavior).

**AETHER Points**: Unchanged — still 1 point per $1 of the original USD price, minted to the same connected wallet, using the existing mint flow in `/api/orders`.

---

## 5. Database Schema Changes

```json
{
  "users": {
    "new_columns": [
      { "name": "wallet_connected", "type": "BOOLEAN", "default": false },
      { "name": "is_admin", "type": "BOOLEAN", "default": false },
      { "name": "shipping_address", "type": "JSON", "nullable": true,
        "shape": {
          "full_name": "string",
          "line1": "string",
          "line2": "string (optional)",
          "city": "string",
          "state": "string",
          "postal_code": "string",
          "country": "string",
          "phone": "string"
        }
      }
    ],
    "notes": "wallet_address column already exists (VARCHAR(255) UNIQUE NULL) — no change needed there."
  },
  "orders": {
    "new_columns": [
      { "name": "status", "type": "ENUM", "values": ["PENDING", "AWAITING_PAYMENT", "PAID", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"], "default": "PENDING" },
      { "name": "eth_amount", "type": "DECIMAL(36,18)", "nullable": true },
      { "name": "usd_to_eth_rate", "type": "DECIMAL(20,8)", "nullable": true },
      { "name": "payment_tx_hash", "type": "VARCHAR(255)", "nullable": true, "unique": true }
    ],
    "notes": "existing 'status' column (VARCHAR(50) DEFAULT 'PENDING') should be converted to the ENUM above. existing 'points_tx_hash' stays separate from the new 'payment_tx_hash' — one is the reward mint tx, the other is the actual payment tx."
  }
}
```

---

## 6. API Changes

```json
[
  {
    "method": "PATCH",
    "path": "/api/user/wallet",
    "auth": "session required",
    "description": "Save wallet address + mark wallet_connected=true after successful MetaMask connect + correct chain verified client-side.",
    "request_body": { "walletAddress": "string" },
    "response": { "success": "boolean" }
  },
  {
    "method": "PUT",
    "path": "/api/user/address",
    "auth": "session required",
    "description": "Save/update the user's shipping address on their profile.",
    "request_body": { "full_name": "string", "line1": "string", "line2": "string?", "city": "string", "state": "string", "postal_code": "string", "country": "string", "phone": "string" },
    "response": { "success": "boolean" }
  },
  {
    "method": "GET",
    "path": "/api/orders/quote",
    "auth": "session required",
    "description": "Server computes and returns current USD price, live ETH/USD rate, and resulting ETH amount owed for the product. Called when the confirmation page loads.",
    "response": { "usdPrice": "number", "ethUsdRate": "number", "ethAmount": "string (wei, as string to avoid precision loss)" }
  },
  {
    "method": "POST",
    "path": "/api/orders",
    "auth": "session required, wallet_connected required",
    "description": "Modified from current stub: no longer accepts client-sent 'total'. Creates order with status=AWAITING_PAYMENT using server-computed price.",
    "request_body": { "itemColor": "string" },
    "response": { "orderId": "string", "ethAmount": "string", "devWalletAddress": "string" }
  },
  {
    "method": "POST",
    "path": "/api/orders/[id]/verify-payment",
    "auth": "session required",
    "description": "Verifies the on-chain transaction (Section 4) and, if valid, flips status to PAID, stores tx details, triggers AETHER Points minting.",
    "request_body": { "txHash": "string" },
    "response": { "success": "boolean", "status": "string", "pointsEarned": "number" }
  },
  {
    "method": "GET",
    "path": "/api/admin/orders",
    "auth": "session required, is_admin required",
    "description": "List all orders with user info, for the admin panel table.",
    "response": { "orders": "array of order objects" }
  },
  {
    "method": "PATCH",
    "path": "/api/admin/orders/[id]/status",
    "auth": "session required, is_admin required",
    "description": "Update an order's status to any valid lifecycle value.",
    "request_body": { "status": "PENDING | AWAITING_PAYMENT | PAID | PROCESSING | SHIPPED | OUT_FOR_DELIVERY | DELIVERED | CANCELLED" },
    "response": { "success": "boolean" }
  }
]
```

---

## 7. Admin Status Panel

**Route**: `/admin/orders`

**Access control**: On page load, check `session.user.is_admin` server-side (in a server component or via a session check that redirects non-admins) — do not rely on hiding the nav link alone. Every underlying API call (`/api/admin/*`) must independently re-check `is_admin` from the session, not trust a client-passed flag.

**How `is_admin` gets set**: No self-service UI for this — set manually via direct DB update for the first admin account (document this in a comment/README note, since there's no seed script currently).

**UI**:
- Table of all orders: order ID, user email/name, product, status, ETH paid, payment tx hash, created date.
- Each row has a status dropdown (using the lifecycle enum from Section 5) that calls `PATCH /api/admin/orders/[id]/status` on change.
- Optional: filter/sort by status.

---

## 8. Security Notes

These are not optional polish — they close real gaps in the current codebase and in this new feature if implemented carelessly:

1. **Never trust client-sent price/amount.** The current `/api/orders` route accepts `total` directly from the request body — this must be replaced with a server-computed price (Section 4) for both the USD total and the ETH amount. This is the single most important fix in this spec.
2. **Verify payment on-chain server-side before marking PAID.** Don't trust a `txHash` string alone — fetch the receipt from the RPC and check status, recipient, and amount (Section 4).
3. **Prevent tx hash reuse.** Enforce `payment_tx_hash` as `UNIQUE` in the DB and check for existing use before accepting a payment verification call, so one transaction can't be claimed against multiple orders.
4. **Protect admin routes server-side.** Check `is_admin` in every `/api/admin/*` handler, not just in the UI.
5. **Fix the existing insecure fallback in `GET /api/orders/[id]`** — it currently falls back to fetching an order by ID alone (no ownership check) if the userId-scoped query returns nothing. Remove that fallback or add an explicit ownership/admin check to it.
6. **Rate-limit `/api/orders/quote`** if it calls an external price API, to avoid hitting third-party rate limits or enabling abuse.
7. **Don't expose the developer's private key anywhere client-side** — this already appears to be handled correctly in the existing minting routes (private key stays server-side); keep that pattern for any new signing logic.

---

## 9. Acceptance Criteria

- [ ] A new user cannot complete signup's wallet step without MetaMask being on (or successfully switched to) chainId `31337`.
- [ ] A user with no connected wallet cannot reach the order confirmation page — they're redirected to a wallet-connect prompt instead.
- [ ] The order confirmation page displays a USD price, a live ETH/USD rate, and the resulting ETH amount, all computed server-side.
- [ ] Submitting a shipping address on the confirmation page saves it to the user's profile and pre-fills on future orders.
- [ ] Paying via MetaMask sends ETH from the user's wallet to the developer's wallet address on the Hardhat local network.
- [ ] An order only reaches `status = PAID` after server-side verification of the on-chain transaction — manually POSTing a fake `txHash` does not mark an order as paid.
- [ ] The same `txHash` cannot be used to mark two different orders as paid.
- [ ] AETHER Points are still minted correctly after a verified payment, same as current behavior.
- [ ] A non-admin user gets a 403/redirect when hitting `/admin/orders` or any `/api/admin/*` route.
- [ ] An admin can change any order's status through the panel, and that status is reflected on the user's order view.
- [ ] `GET /api/orders/[id]` no longer returns another user's order via the insecure fallback.
