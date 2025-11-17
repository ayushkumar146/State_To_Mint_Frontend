import { useState } from "react";
import {
    Connection,
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction
} from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";

export default function SendPage() {
    const wallet = useWallet();

    const [receiver, setReceiver] = useState("");
    const [amount, setAmount] = useState("");
    const [message, setMessage] = useState("");

    const connection = new Connection("https://api.devnet.solana.com");

    // ------------------------------------------------
    // 1) SIGN MESSAGE
    // ------------------------------------------------
    const signUserMessage = async () => {
        if (!wallet.signMessage) {
            return alert("Your wallet cannot sign messages!");
        }
        if (!message) return alert("Enter a message first!");

        try {
            const encoded = new TextEncoder().encode(message);

            const signature = await wallet.signMessage(encoded);

            alert("Message signed! Check console.");
            console.log("SIGNED MESSAGE:", signature);
        } catch (err) {
            console.error(err);
            alert("Failed to sign message");
        }
    };

    // ------------------------------------------------
    // 2) SEND SOL TOKENS (updated, no deprecated API)
    // ------------------------------------------------
    const sendSol = async () => {
        try {
            if (!wallet.publicKey) return alert("Connect Phantom first!");

            const receiverKey = new PublicKey(receiver);
            const lamports = Number(amount) * LAMPORTS_PER_SOL;

            // Build transaction
            const tx = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: wallet.publicKey,
                    toPubkey: receiverKey,
                    lamports,
                })
            );

            // Get recent blockhash (required in newer versions)
            const { blockhash, lastValidBlockHeight } =
                await connection.getLatestBlockhash();

            tx.recentBlockhash = blockhash;
            tx.feePayer = wallet.publicKey;

            // Phantom signs the transaction
            const signedTx = await wallet.signTransaction(tx);

            // Send + confirm in the modern recommended way
            const signature = await sendAndConfirmTransaction(
                connection,
                signedTx,
                [],
                { skipPreflight: false, maxRetries: 3 }
            );

            alert("SOL Sent Successfully!");
            console.log("TX Signature:", signature);

        } catch (err) {
            console.error(err);
            alert("Failed to send SOL");
        }
    };

    return (
        <div style={{ padding: 40 }}>
            <h1>Send Tokens & Sign Message</h1>

            {wallet.connected ? (
                <>
                    {/* SIGN MESSAGE */}
                    <div style={{ marginTop: 30, padding: 20, border: "1px solid #ccc", borderRadius: 8 }}>
                        <h2>Sign a Message</h2>

                        <input
                            type="text"
                            placeholder="Enter message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            style={{ width: 300, padding: 8 }}
                        />

                        <br /><br />

                        <button onClick={signUserMessage}>Sign Message</button>
                    </div>

                    {/* SEND SOL */}
                    <div style={{ marginTop: 30, padding: 20, border: "1px solid #ccc", borderRadius: 8 }}>
                        <h2>Send SOL Tokens</h2>

                        <input
                            type="text"
                            placeholder="Receiver Wallet Address"
                            value={receiver}
                            onChange={(e) => setReceiver(e.target.value)}
                            style={{ width: 300, padding: 8 }}
                        />

                        <br /><br />

                        <input
                            type="number"
                            placeholder="Amount in SOL"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            style={{ width: 300, padding: 8 }}
                        />

                        <br /><br />

                        <button onClick={sendSol}>Send SOL</button>
                    </div>
                </>
            ) : (
                <p>Please connect your Phantom wallet first.</p>
            )}
        </div>
    );
}
