// src/pages/CreateMintPage.tsx

import { useState } from "react";
import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  clusterApiUrl,
} from "@solana/web3.js";

import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";

import { useWallet } from "@solana/wallet-adapter-react";

export default function CreateMintPage() {
  const wallet = useWallet();

  const [decimals, setDecimals] = useState(9);
  const [initialSupply, setInitialSupply] = useState(1000);
  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState<{
    mint?: string;
    ata?: string;
    msg?: string;
  }>({});

  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  const createMint = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      alert("Please connect Phantom wallet first!");
      return;
    }

    setLoading(true);
    setResult({});

    try {
      //
      // ─────────────────────────────────────────────
      // 1️⃣ CREATE MINT ACCOUNT (Keypair needed)
      // ─────────────────────────────────────────────
      //
      const mint = Keypair.generate(); // the new mint address

      // Rent for mint account
      const rent = await connection.getMinimumBalanceForRentExemption(
        MINT_SIZE
      );

      const createMintIx = SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: mint.publicKey,
        lamports: rent,
        space: MINT_SIZE,
        programId: TOKEN_PROGRAM_ID,
      });

      const initMintIx = createInitializeMintInstruction(
        mint.publicKey,
        decimals,
        wallet.publicKey, // mint authority
        wallet.publicKey  // freeze authority
      );

      let tx1 = new Transaction().add(createMintIx, initMintIx);

      tx1.feePayer = wallet.publicKey;
      tx1.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      // Mint must sign because it is being created
      tx1.partialSign(mint);

      const signedTx1 = await wallet.signTransaction(tx1);

      const sig1 = await connection.sendRawTransaction(signedTx1.serialize());
      await connection.confirmTransaction(sig1);


      //
      // ─────────────────────────────────────────────
      // 2️⃣ CREATE ASSOCIATED TOKEN ACCOUNT (ATA)
      // ─────────────────────────────────────────────
      //
      const userATA = await getAssociatedTokenAddress(
        mint.publicKey,
        wallet.publicKey
      );

      const createATAIx = createAssociatedTokenAccountInstruction(
        wallet.publicKey,      // payer
        userATA,               // ata address
        wallet.publicKey,      // owner of ata
        mint.publicKey         // mint
      );

      //
      // ─────────────────────────────────────────────
      // 3️⃣ MINT INITIAL SUPPLY
      // ─────────────────────────────────────────────
      //
      const amountBN = BigInt(initialSupply) * BigInt(10 ** decimals);

      const mintToIx = createMintToInstruction(
        mint.publicKey,
        userATA,
        wallet.publicKey,
        amountBN
      );

      let tx2 = new Transaction().add(createATAIx, mintToIx);

      tx2.feePayer = wallet.publicKey;
      tx2.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const signedTx2 = await wallet.signTransaction(tx2);

      const sig2 = await connection.sendRawTransaction(signedTx2.serialize());
      await connection.confirmTransaction(sig2);


      //
      // ─────────────────────────────────────────────
      // SUCCESS OUTPUT
      // ─────────────────────────────────────────────
      //
      setResult({
        mint: mint.publicKey.toBase58(),
        ata: userATA.toBase58(),
        msg: `Mint created successfully and ${initialSupply} tokens minted!`,
      });

    } catch (err: any) {
      console.error("ERROR:", err);
      setResult({ msg: err.message });
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Create SPL Token (Mint) – Devnet</h2>

      <label>
        Decimals:{" "}
        <input
          type="number"
          value={decimals}
          onChange={(e) => setDecimals(Number(e.target.value))}
        />
      </label>

      <br />

      <label>
        Initial Supply:{" "}
        <input
          type="number"
          value={initialSupply}
          onChange={(e) => setInitialSupply(Number(e.target.value))}
        />
      </label>

      <br />

      <button onClick={createMint} disabled={loading}>
        {loading ? "Creating..." : "Create Mint"}
      </button>

      {result.mint && (
        <div style={{ marginTop: 20 }}>
          <p><b>Mint Address:</b> {result.mint}</p>
          <p><b>Your ATA:</b> {result.ata}</p>
          <p>{result.msg}</p>
        </div>
      )}

      {!result.mint && result.msg && (
        <p style={{ color: "red" }}>{result.msg}</p>
      )}
    </div>
  );
}
