import React from 'react';
import { useWalletMultiChain } from './Hooks/useWalletMultiChain';
function App() {
  const {
    provider,
    network,
    networkName,
    walletAddress,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    isConnected
  } = useWalletMultiChain({
    supportedChains: [1, 3, 4, 11155111, 42],
    autoConnect: true
  });

  const handleSwitchNetwork = async () => {
    try {
      await switchNetwork(11155111);
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  return (
    <div className="App">
      <h1>Wallet MultiChain Demo</h1>
      {!isConnected ? (
        <button onClick={connectWallet} disabled={isConnecting}>
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <div>
          <p>Connected Address: {walletAddress}</p>
          <p>Network: {networkName}</p>
          <button onClick={disconnectWallet}>Disconnect Wallet</button>
          <div></div>
          <button onClick={handleSwitchNetwork}>Switch to Rinkeby</button>
        </div>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {provider && <p>Provider is available</p>}
    </div>
  );
}

export default App;