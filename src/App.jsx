import React from 'react';
import { useWalletMultiChain } from './Hooks/useWalletMultiChain';

const supportedChains = [1,11155111];

function App() {
  const { wallet, actions } = useWalletMultiChain(supportedChains);
  const { provider, network, walletAddress } = wallet;
  const { connectWallet, disconnectWallet, switchNetwork } = actions;

  const handleSwitchNetwork = async () => {
    try {
      await switchNetwork(11155111); 
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message); 
      }
      console.error('Failed to switch network:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Wallet MultiChain Demo</h1>

        {!walletAddress ? (
          <button
            onClick={connectWallet} 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
          >
            Connect Wallet
          </button>
        ) : (
          <div className="space-y-4">

            <p className="text-gray-700">
              <span className="font-semibold">Connected Address:</span> {walletAddress}
            </p>

            <p className="text-gray-700">
              <span className="font-semibold">Network:</span> {network ? `Chain ID ${network}` : 'Unknown'}
            </p>
            <div className="flex space-x-4">

              <button
                onClick={disconnectWallet} 
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
              >
                Disconnect Wallet
              </button>

              <button
                onClick={handleSwitchNetwork} 
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
              >
                Switch to Sepolia
              </button>
            </div>
          </div>
        )}
        {provider && (
          <p className="mt-4 text-green-600 text-center">Provider is available</p>
        )}
      </div>
    </div>
  );
}

export default App;
