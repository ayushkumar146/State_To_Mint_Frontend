import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";

function App() {
  const wallet = useWallet();

  return (
    <div style={{ padding: 50 }}>
      <h1>Phantom Wallet Connection</h1>

      {/* Phantom Connect Button */}
      <WalletMultiButton />

      {wallet.connected && (
        <div style={{ marginTop: 20 }}>
          <p><b>Wallet Connected!</b></p>
          <p>Public Key: {wallet.publicKey?.toBase58()}</p>
        </div>
      )}
    </div>
  );
}

export default App;
