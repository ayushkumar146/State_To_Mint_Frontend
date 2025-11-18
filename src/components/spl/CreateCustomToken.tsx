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


// -------------------------------------------------------
// ⭐ Metadata PDA
// -------------------------------------------------------
const getMetadataPDA = (mint: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  );
};


// -------------------------------------------------------
// ⭐ SAFE Transaction Sender
// -------------------------------------------------------
async function sendTx(
  connection: Connection,
  tx: Transaction,
  wallet: any,
  extraSigners: Keypair[] = []
) {
  const latest = await connection.getLatestBlockhash();

  tx.recentBlockhash = latest.blockhash;
  tx.feePayer = wallet.publicKey;

  // 1️⃣ partial-sign with Keypairs (mint)
  if (extraSigners.length > 0) {
    tx.partialSign(...extraSigners);
  }

  // 2️⃣ Phantom signs
  const signedTx = await wallet.signTransaction(tx);

  // 3️⃣ Send raw
  const sig = await connection.sendRawTransaction(signedTx.serialize(), {
    skipPreflight: false,
    maxRetries: 5,
  });

  // 4️⃣ Confirm
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
// ⭐ MAIN PAGE COMPONENT
// -------------------------------------------------------
export default function CreateCustomTokenPage() {
  const wallet = useWallet();

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [decimals, setDecimals] = useState(9);
  const [initialSupply, setInitialSupply] = useState(1000);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>({});

  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");



  // -------------------------------------------------------
  // ⭐ CREATE TOKEN FUNCTION
  // -------------------------------------------------------
  const createCustomToken = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      alert("Please connect Phantom first!");
      return;
    }

    setLoading(true);
    setResult({});

    try {
      // ----------------------------------------------------
      // 0️⃣ Upload Metadata JSON to your backend
      // ----------------------------------------------------
      const metaResponse = await fetch("http://localhost:3001/uploadMetadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          symbol,
          description,
          imageUrl,
        }),
      });

      const metaData = await metaResponse.json();
      const metadataUri = metaData.metadataUri;

      if (!metadataUri) {
        alert("Metadata upload failed");
        return;
      }


      // ----------------------------------------------------
      // 1️⃣ Create Mint Account
      // ----------------------------------------------------
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

      // ⭐ Pass mint Keypair here!
      await sendTx(connection, tx1, wallet, [mint]);


      // ----------------------------------------------------
      // 2️⃣ Create Metadata Account
      // ----------------------------------------------------
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
              uri: metadataUri,
              sellerFeeBasisPoints: 0,
              creators: null,
              collection: null,
              uses: null,
            },
            collectionDetails: null,
            isMutable: true,
          },
        }
      );

      const txMeta = new Transaction().add(metadataIx);
      await sendTx(connection, txMeta, wallet);


      // ----------------------------------------------------
      // 3️⃣ Create ATA & Mint Tokens
      // ----------------------------------------------------
      const ata = await getAssociatedTokenAddress(
        mint.publicKey,
        wallet.publicKey
      );

      const createATAIx = createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        ata,
        wallet.publicKey,
        mint.publicKey
      );

      const amount = BigInt(initialSupply) * BigInt(10 ** decimals);

      const mintToIx = createMintToInstruction(
        mint.publicKey,
        ata,
        wallet.publicKey,
        amount
      );

      const tx2 = new Transaction().add(createATAIx, mintToIx);
      await sendTx(connection, tx2, wallet);


      // ----------------------------------------------------
      // 🎉 DONE
      // ----------------------------------------------------
      setResult({
        mint: mint.publicKey.toBase58(),
        ata: ata.toBase58(),
        msg: "Token created successfully!",
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
      <h2>Create Custom SPL Token (With Metadata)</h2>

      <label>Name:</label>
      <input value={name} onChange={(e) => setName(e.target.value)} />

      <label>Symbol:</label>
      <input value={symbol} onChange={(e) => setSymbol(e.target.value)} />

      <label>Description:</label>
      <input value={description} onChange={(e) => setDescription(e.target.value)} />

      <label>Image URL:</label>
      <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />

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
    </div>
  );
}
