import React from 'react';
import { useWalletMultiChain } from './hooks/useWalletMultiChain';

const supportedChains = [1, 3, 4, 5, 42, 11155111, 42161]; // Mainnet, Ropsten, Rinkeby, Goerli, Kovan, Sepolia, Arbitrum

function App() {
  const {
    provider,
    network,
    walletAddress,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    switchNetwork
  } = useWalletMultiChain(supportedChains);

  const handleSwitchNetwork = async () => {
    try {
      await switchNetwork(4); // Switch to Rinkeby (chainId 4)
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  return (
    <div className="App">
      <h1>Wallet MultiChain Demo</h1>
      {!walletAddress ? (
        <button onClick={connectWallet} disabled={isConnecting}>
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <div>
          <p>Connected Address: {walletAddress}</p>
          <p>Network: {network ? `Chain ID ${network}` : 'Unknown'}</p>
          <button onClick={disconnectWallet}>Disconnect Wallet</button>
          <button onClick={handleSwitchNetwork}>Switch to Rinkeby</button>
        </div>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {provider && <p>Provider is available</p>}
    </div>
  );
}

export default App;