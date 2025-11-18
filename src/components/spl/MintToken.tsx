// src/pages/MintTokensPage.tsx

import { useState } from "react";
import {
  Connection,
  Transaction,
  PublicKey,
  clusterApiUrl,
} from "@solana/web3.js";

import {
  createMintToInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

import { useWallet } from "@solana/wallet-adapter-react";


// -------------------------------------------------------
// ⭐ Safe Tx Sender (Same as custom token page)
// -------------------------------------------------------
async function sendTx(connection: Connection, tx: Transaction, wallet: any) {
  const latest = await connection.getLatestBlockhash();

  tx.recentBlockhash = latest.blockhash;
  tx.feePayer = wallet.publicKey;

  const signedTx = await wallet.signTransaction(tx);

  const sig = await connection.sendRawTransaction(signedTx.serialize(), {
    skipPreflight: false,
    maxRetries: 5,
  });

  await connection.confirmTransaction(
    {
      signature: sig,
      blockhash: latest.blockhash,
      lastValidBlockHeight: latest.lastValidBlockHeight,
    },
    "confirmed"
  );

  return sig;
}


// -------------------------------------------------------
// ⭐ Mint Tokens Page
// -------------------------------------------------------
export default function MintTokensPage() {
  const wallet = useWallet();
  
  const [mintAddress, setMintAddress] = useState("");
  const [decimals, setDecimals] = useState(9);
  const [amount, setAmount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>({});

  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");


  // -------------------------------------------------------
  // ⭐ Main Mint Function
  // -------------------------------------------------------
  const mintTokens = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      alert("Please connect Phantom first!");
      return;
    }

    try {
      setLoading(true);
      setResult({});

      const mint = new PublicKey(mintAddress);

      // ---------------------------------------------------
      // 1️⃣ Get the user's ATA
      // ---------------------------------------------------
      const ata = await getAssociatedTokenAddress(mint, wallet.publicKey);

      // ---------------------------------------------------
      // 2️⃣ Create mint-to instruction
      // ---------------------------------------------------
      const amountToMint = BigInt(amount) * BigInt(10 ** decimals);

      const mintIx = createMintToInstruction(
        mint,            // Mint address
        ata,             // User's ATA
        wallet.publicKey, // Mint authority (must match)
        amountToMint
      );

      const tx = new Transaction().add(mintIx);

      // ---------------------------------------------------
      // 3️⃣ Send & Confirm
      // ---------------------------------------------------
      const sig = await sendTx(connection, tx, wallet);

      setResult({
        sig,
        ata: ata.toBase58(),
        msg: "Tokens minted successfully!",
      });

    } catch (err: any) {
      console.error(err);
      setResult({ msg: err.message });
    }

    setLoading(false);
  };


  // -------------------------------------------------------
  // ⭐ UI
  // -------------------------------------------------------
  return (
    <div style={{ padding: 20 }}>
      <h2>Mint More Tokens</h2>

      <label>Mint Address:</label>
      <input
        value={mintAddress}
        onChange={(e) => setMintAddress(e.target.value)}
        placeholder="Enter mint address"
      />

      <label>Decimals:</label>
      <input
        type="number"
        value={decimals}
        onChange={(e) => setDecimals(Number(e.target.value))}
      />

      <label>Amount to Mint:</label>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />

      <button onClick={mintTokens} disabled={loading}>
        {loading ? "Minting..." : "Mint Tokens"}
      </button>

      {result.msg && (
        <div style={{ marginTop: 20 }}>
          <p>{result.msg}</p>
          {result.ata && <p><b>Your ATA:</b> {result.ata}</p>}
          {result.sig && <p><b>Tx Signature:</b> {result.sig}</p>}
        </div>
      )}
    </div>
  );
}
