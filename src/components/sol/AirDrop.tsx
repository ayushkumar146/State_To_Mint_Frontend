import { useState } from "react";
import {
    Connection,
    LAMPORTS_PER_SOL,
    clusterApiUrl
} from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";

export default function Airdrop() {
    const wallet = useWallet();
    const [loading, setLoading] = useState(false);

    // You can also use clusterApiUrl("devnet")
    const connection = new Connection("https://api.devnet.solana.com");

    const airdropSol = async () => {
        if (!wallet.publicKey) return alert("Connect wallet first!");

        try {
            setLoading(true);

            // Request airdrop
            const signature = await connection.requestAirdrop(
                wallet.publicKey,
                1 * LAMPORTS_PER_SOL
            );

            // Get latest blockhash (NEW WAY)
            const latestBlockHash = await connection.getLatestBlockhash();

            // Confirm using the NEW confirmation API
            await connection.confirmTransaction({
                signature,
                ...latestBlockHash,
            });

            alert("Airdrop Successful!");
        } catch (err) {
            console.error("Airdrop error:", err);
            alert("Airdrop failed. Try changing RPC.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Airdrop SOL (Devnet)</h1>

            {wallet.connected ? (
                <button onClick={airdropSol} disabled={loading}>
                    {loading ? "Airdropping..." : "Airdrop 1 SOL"}
                </button>
            ) : (
                <p>Please connect your wallet first</p>
            )}
        </div>
    );
}
