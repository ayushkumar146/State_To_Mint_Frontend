// src/pages/ViewTokensPage.tsx

import { useEffect, useState } from "react";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  getMint,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

export default function ViewTokensPage() {
  const wallet = useWallet();
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  const fetchTokens = async () => {
    if (!wallet.publicKey) {
      alert("Connect Phantom wallet first.");
      return;
    }

    setLoading(true);
    setTokens([]);

    try {
      //
      // 1️⃣ Get ALL SPL Token Accounts owned by wallet
      //
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        wallet.publicKey,
        { programId: TOKEN_PROGRAM_ID }
      );

      const results: any[] = [];

      //
      // 2️⃣ Loop through each token account
      //
      for (const { account, pubkey } of tokenAccounts.value) {
        const data = account.data.parsed.info;

        const mintAddress = data.mint;
        const rawAmount = data.tokenAmount.amount;
        const decimals = data.tokenAmount.decimals;

        // Fetch mint info (symbol, supply, decimals...)
        const mintInfo = await connection.getParsedAccountInfo(
          new PublicKey(mintAddress)
        );

        // Try to fetch metadata via Metaplex (not guaranteed to exist)
        const metadata = await tryFetchMetadata(mintAddress);

        results.push({
          ata: pubkey.toBase58(),
          mint: mintAddress,
          decimals,
          rawAmount,
          balance: Number(rawAmount) / 10 ** decimals,
          symbol: metadata?.symbol || "Unknown",
          name: metadata?.name || "Unknown Token",
          logo: metadata?.image || null,
        });
      }

      setTokens(results);
    } catch (err) {
      console.error("Error reading token balances:", err);
    }

    setLoading(false);
  };

  //
  // ──────────────────────────────────────────────
  // Fetch Metaplex Metadata (if exists)
  // ──────────────────────────────────────────────
  //

  async function tryFetchMetadata(mint: string) {
    try {
      const METADATA_PREFIX = "metadata";
      const METAPLEX_PROGRAM =
        "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"; // token metadata program

      const [pda] = await PublicKey.findProgramAddressSync(
        [
          Buffer.from(METADATA_PREFIX),
          new PublicKey(METAPLEX_PROGRAM).toBuffer(),
          new PublicKey(mint).toBuffer(),
        ],
        new PublicKey(METAPLEX_PROGRAM)
      );

      const accountInfo = await connection.getAccountInfo(pda);

      if (!accountInfo) return null;

      // Metadata is Borsh encoded → decode manually
      const metadataRaw = accountInfo.data;

      // VERY SIMPLE metadata extraction for name & symbol
      function readString(offset: number) {
        const len = metadataRaw[offset];
        return metadataRaw
          .subarray(offset + 4, offset + 4 + len)
          .toString();
      }

      return {
        name: readString(1),
        symbol: readString(37),
      };
    } catch {
      return null;
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Your SPL Tokens (Devnet)</h2>

      {!wallet.connected && (
        <p style={{ color: "red" }}>Connect Phantom wallet</p>
      )}

      <button onClick={fetchTokens} disabled={loading}>
        {loading ? "Loading..." : "Refresh Balances"}
      </button>

      <div style={{ marginTop: 20 }}>
        {tokens.length === 0 && !loading && <p>No tokens found.</p>}

        {tokens.map((t, i) => (
          <div
            key={i}
            style={{
              marginBottom: 20,
              padding: 12,
              border: "1px solid #444",
              borderRadius: 10,
            }}
          >
            <h3>{t.name} ({t.symbol})</h3>

            {t.logo && (
              <img
                src={t.logo}
                alt="token"
                width={40}
                style={{ borderRadius: 8 }}
              />
            )}

            <p><b>Mint:</b> {t.mint}</p>
            <p><b>Your ATA:</b> {t.ata}</p>

            <p><b>Raw Amount:</b> {t.rawAmount}</p>
            <p><b>Balance:</b> {t.balance}</p>
            <p><b>Decimals:</b> {t.decimals}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
