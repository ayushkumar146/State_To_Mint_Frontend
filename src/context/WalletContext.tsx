import React, { FC, ReactNode } from "react";
import {
  ConnectionProvider,
  WalletProvider
} from "@solana/wallet-adapter-react";

import {
  PhantomWalletAdapter
} from "@solana/wallet-adapter-wallets";

import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

// REQUIRED for wallet-adapter-react-ui styling
import "@solana/wallet-adapter-react-ui/styles.css";

// const RPC_URL = "https://api.mainnet-beta.solana.com"; 
// you can use devnet: https://api.devnet.solana.com

const RPC_URL="https://api.devnet.solana.com";

export const WalletContext: FC<{ children: ReactNode }> = ({ children }) => {
  const wallets = [new PhantomWalletAdapter()];

  return (
    <ConnectionProvider endpoint={RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
