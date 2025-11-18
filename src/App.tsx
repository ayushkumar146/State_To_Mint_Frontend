import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useState } from 'react';
import Connection from './components/sol/Connection.tsx';
import UserBalance from "./components/sol/WalletBalance.tsx";
import AirDrop from "./components/sol/AirDrop.tsx";
import SendPage from "./components/sol/SignandSendToken.tsx";
import CreateMint from "./components/spl/CreateMint.tsx";
import ViewTokens from "./components/spl/ViewTokens.tsx";
import CreateCustom from "./components/spl/CreateCustomToken.tsx";
import MintTokens from "./components/spl/MintToken.tsx";

function App() {
  const [count, setCount] = useState(0)

  return (
   <BrowserRouter>
      <div style={{ padding: 20 }}>
        {/* Simple Navigation */}
        <Link to="/" style={{ marginRight: 20 }}>Home</Link>
        <Link to="/balance" style={{ marginRight: 20 }}>Balance</Link>
        <Link to="/airdrop" style={{ marginRight: 20 }}>Airdrop SOL</Link>
        <Link to="/send" style={{ marginRight: 20 }}>Send Tokens</Link>
        <Link to="/createmint" style={{ marginRight: 20 }}>Create Mint</Link>
        <Link to="/view-tokens" style={{ marginRight: 20 }}>View Tokens</Link>
        <Link to="/createcustomtokens" style={{ marginRight: 20 }}>Create Custom Tokens</Link>
        <Link to="/minttokens" style={{ marginRight: 20 }}>Mint Tokens</Link>

        

      </div>

      <Routes>
        <Route path="/" element={<Connection />} />
        <Route path="/balance" element={<UserBalance />} />
        <Route path="/airdrop" element={<AirDrop />} />
        <Route path="/send" element={<SendPage />} />
        <Route path="/createmint" element={<CreateMint />} />
        <Route path="/view-tokens" element={<ViewTokens />} />
        <Route path="/createcustomtokens" element={<CreateCustom />} />
        <Route path="/minttokens" element={<MintTokens />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App
