## Getting Started

First, create a `.env` file in the root of the project and add the following environment variables:
```env
DATABASE_URL=
NEXTAUTH_SECRET=
TOTP_ENCRYPTION_KEY=
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_MORALIS_API_URL=
NEXT_PUBLIC_MORALIS_API_KEY=
NEXT_PUBLIC_IPFS_GATEWAY=
NEXT_PUBLIC_BSC_TESTNET_RPC=
```
The `DATABASE_URL` is the connection string to your MySQL database. 

The `NEXTAUTH_SECRET` is a random string used to encrypt the session token. 

The `TOTP_ENCRYPTION_KEY` is a random string used to encrypt the TOTP secret. 

The `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` and `STRIPE_SECRET_KEY` are the public and secret keys for your Stripe account. 

The `NEXT_PUBLIC_MORALIS_API_URL` and `NEXT_PUBLIC_MORALIS_API_KEY` are the API URL and API key for your Moralis server. 

The `NEXT_PUBLIC_IPFS_GATEWAY` is the URL of the IPFS gateway you want to use. 

The `NEXT_PUBLIC_BSC_TESTNET_RPC` is the URL of the Binance Smart Chain testnet RPC.

Then, install the dependencies using one of the following commands:
    
```bash
npm install
# or
yarn install
# or
pnpm install
```

Run the migrations using the following command:

```bash
npx prisma migrate dev
``````

Finally, run the development server using one of the following commands:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.