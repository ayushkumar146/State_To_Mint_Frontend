// src/pages/CreateCustomTokenPage.tsx

import { useState } from "react";
import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  PublicKey,
  clusterApiUrl,
} from "@solana/web3.js";

import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

import {
  PROGRAM_ID as METADATA_PROGRAM_ID,
  createCreateMetadataAccountV3Instruction,
} from "@metaplex-foundation/mpl-token-metadata";

import { useWallet } from "@solana/wallet-adapter-react";

// 🔥 Helper to avoid PDA crashes
const getMetadataPDA = (mintPubkey: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM_ID.toBuffer(),
      mintPubkey.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  );
};

export default function CreateCustomTokenPage() {
  const wallet = useWallet();

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [imageUrl, setImageUrl] = useState(""); // MUST be JSON metadata link
  const [decimals, setDecimals] = useState(9);
  const [initialSupply, setInitialSupply] = useState(1000);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>({});

  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  const createCustomToken = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      alert("Connect Phantom first!");
      return;
    }

    if (!imageUrl.endsWith(".json")) {
      alert("⚠ You must use a JSON Metadata URL, not a direct image URL.\nExample: https://arweave.net/xxxx.json");
      return;
    }

    setLoading(true);
    setResult({});

    try {
      //
      // 1️⃣ Create Mint Account
      //
      const mint = Keypair.generate();
      const rent = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);

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
        wallet.publicKey,
        wallet.publicKey
      );

      const tx1 = new Transaction().add(createMintIx, initMintIx);
      tx1.feePayer = wallet.publicKey;
      tx1.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      tx1.partialSign(mint);
      const signed1 = await wallet.signTransaction(tx1);
      await connection.sendRawTransaction(signed1.serialize(), {
        skipPreflight: false,
      });

      //
      // 2️⃣ Create Metadata PDA
      //
      const [metadataPDA] = getMetadataPDA(mint.publicKey);

      const metadataIx = createCreateMetadataAccountV3Instruction(
        {
          metadata: metadataPDA,
          mint: mint.publicKey,
          mintAuthority: wallet.publicKey,
          payer: wallet.publicKey,
          updateAuthority: wallet.publicKey,
        },
        {
          createMetadataAccountArgsV3: {
            data: {
              name,
              symbol,
              uri: imageUrl, // JSON metadata — REQUIRED
              sellerFeeBasisPoints: 0,
              creators: null,
              collection: null,
              uses: null,
            },
            isMutable: true,
          },
        }
      );

      const txMeta = new Transaction().add(metadataIx);
      txMeta.feePayer = wallet.publicKey;
      txMeta.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const signedMeta = await wallet.signTransaction(txMeta);
      await connection.sendRawTransaction(signedMeta.serialize(), {
        skipPreflight: false,
      });

      //
      // 3️⃣ Create ATA
      //
      const ata = await getAssociatedTokenAddress(mint.publicKey, wallet.publicKey);

      const createATAIx = createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        ata,
        wallet.publicKey,
        mint.publicKey
      );

      //
      // 4️⃣ Mint Tokens
      //
      const amount = BigInt(initialSupply) * BigInt(10 ** decimals);

      const mintToIx = createMintToInstruction(
        mint.publicKey,
        ata,
        wallet.publicKey,
        amount
      );

      const tx2 = new Transaction().add(createATAIx, mintToIx);
      tx2.feePayer = wallet.publicKey;
      tx2.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const signed2 = await wallet.signTransaction(tx2);
      await connection.sendRawTransaction(signed2.serialize(), {
        skipPreflight: false,
      });

      //
      // SUCCESS RESULT
      //
      setResult({
        mint: mint.publicKey.toBase58(),
        ata: ata.toBase58(),
        msg: "Custom token created successfully with metadata!",
      });
    } catch (err: any) {
      console.error(err);
      setResult({ msg: err.message });
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Create Custom SPL Token (With Metadata)</h2>

      <label>Name:</label>
      <input value={name} onChange={(e) => setName(e.target.value)} />

      <label>Symbol:</label>
      <input value={symbol} onChange={(e) => setSymbol(e.target.value)} />

      <label>Metadata JSON URL:</label>
      <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />

      <small style={{ color: "gray" }}>
        Example: https://arweave.net/xxxx.json  
        (Must contain image, name, symbol)
      </small>

      <label>Decimals:</label>
      <input
        type="number"
        value={decimals}
        onChange={(e) => setDecimals(Number(e.target.value))}
      />

      <label>Initial Supply:</label>
      <input
        type="number"
        value={initialSupply}
        onChange={(e) => setInitialSupply(Number(e.target.value))}
      />

      <button onClick={createCustomToken} disabled={loading}>
        {loading ? "Creating..." : "Create Token"}
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
