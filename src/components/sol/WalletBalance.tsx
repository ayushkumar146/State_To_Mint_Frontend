import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";

function Balance() {
  const wallet = useWallet();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const getBalance = async () => {
      if (!wallet.publicKey) return;

      const connection = new Connection("https://api.devnet.solana.com");
      const lamports = await connection.getBalance(wallet.publicKey);
      setBalance(lamports / LAMPORTS_PER_SOL);
    };

    getBalance();
  }, [wallet.publicKey]);

  if (!wallet.connected) {
    return <h2>Please connect your wallet first.</h2>;
  }

  return (
    <div style={{ padding: 50 }}>
      <h1>User Balance</h1>
      <p><b>Wallet:</b> {wallet.publicKey.toBase58()}</p>
      <p><b>SOL Balance:</b> {balance ?? "Loading..."} SOL</p>
    </div>
  );
}

export default Balance;
