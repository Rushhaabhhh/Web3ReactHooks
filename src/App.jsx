import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWalletMultiChain } from './Hooks/useWalletMultiChain';
import { useTransactionStatus } from './Hooks/useTransactionStatus';
import { useGasEstimator } from './Hooks/useGasEstimator';

const supportedChains = [1, 11155111, 3, 4, 42, 56, 137, 250, 42161, 43114];

const networkNames = {
  1: 'Ethereum Mainnet',
  3: 'Ropsten Testnet',
  4: 'Rinkeby Testnet',
  42: 'Kovan Testnet',
  56: 'Binance Smart Chain',
  137: 'Polygon Mainnet',
  250: 'Fantom Opera',
  42161: 'Arbitrum One',
  43114: 'Avalanche C-Chain',
  11155111: 'Sepolia Testnet',
};

function GasEstimatorPanel({ provider }) {
  const { loading, error, estimation } = useGasEstimator({
    provider,
    refreshInterval: 12000,
    historicalBlocks: 20,
    onError: (err) => console.error('Gas estimation error:', err),
  });

  if (!provider) {
    return null;
  }

  if (loading) {
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 p-4 bg-red-50 rounded-lg text-red-600">
        Failed to estimate gas: {error.message}
      </div>
    );
  }

  if (!estimation) return null;

  const formatGwei = (value) => {
    if (!value) return 'N/A';
    return `${ethers.utils.formatUnits(value, 'gwei')} Gwei`;
  };

  const formatEther = (value) => {
    if (!value) return 'N/A';
    return `${parseFloat(ethers.utils.formatEther(value)).toFixed(6)} ETH`;
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-3">Current Gas Prices</h3>
      
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-gray-600">Base Fee</div>
            <div className="font-mono text-lg">{formatGwei(estimation.baseFee)}</div>
          </div>
          
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-sm text-gray-600">Priority Fee</div>
            <div className="font-mono text-lg">{formatGwei(estimation.maxPriorityFeePerGas)}</div>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-semibold mb-2">Expected Transaction Cost</h4>
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="font-mono text-xl text-center">
              {formatEther(estimation.estimatedCost)}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-semibold mb-2">Estimated Wait Times</h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-green-100 p-2 rounded-lg text-center">
              <div className="text-xs text-gray-600">Fast</div>
              <div className="font-semibold">{estimation.timeEstimates.fast}s</div>
            </div>
            <div className="bg-yellow-100 p-2 rounded-lg text-center">
              <div className="text-xs text-gray-600">Average</div>
              <div className="font-semibold">{estimation.timeEstimates.likely}s</div>
            </div>
            <div className="bg-red-100 p-2 rounded-lg text-center">
              <div className="text-xs text-gray-600">Slow</div>
              <div className="font-semibold">{estimation.timeEstimates.urgent}s</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const { wallet, actions } = useWalletMultiChain(supportedChains);
  const { provider, network, walletAddress } = wallet;
  const { connectWallet, disconnectWallet, switchNetwork } = actions;

  const [availableChains, setAvailableChains] = useState([]);
  const [selectedChain, setSelectedChain] = useState(network);
  const [transactionHash, setTransactionHash] = useState('');

  // Remove pendingTransaction state since we'll show gas estimates always
  
  useEffect(() => {
    if (window.ethereum) {
      setAvailableChains(supportedChains);
    }
  }, []);

  const handleSwitchNetwork = async (chainId) => {
    try {
      await switchNetwork(chainId);
      setSelectedChain(chainId);
    } catch (error) {
      alert(error.message || 'Failed to switch network');
      console.error('Failed to switch network:', error);
    }
  };

  const handleSimulateTransaction = async () => {
    if (!provider) {
      alert('Connect your wallet first!');
      return;
    }

    try {
      const signer = provider.getSigner();
      const tx = await signer.sendTransaction({
        to: walletAddress,
        value: ethers.utils.parseEther('0.001'),
      });
      setTransactionHash(tx.hash);
    } catch (error) {
      console.error('Transaction error:', error);
      alert('Transaction failed. Check the console for details.');
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
              <span className="font-semibold">Network:</span> {networkNames[network] || `Chain ID ${network}`}
            </p>

            <div className="flex flex-col space-y-4">
              <button
                onClick={disconnectWallet}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
              >
                Disconnect Wallet
              </button>

              <select
                value={selectedChain}
                onChange={(e) => handleSwitchNetwork(parseInt(e.target.value))}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg"
              >
                {availableChains.map((chainId) => (
                  <option key={chainId} value={chainId}>
                    {networkNames[chainId] || `Chain ID ${chainId}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Show gas estimator as soon as wallet is connected */}
            {provider && <GasEstimatorPanel provider={provider} />}

            <button
              onClick={handleSimulateTransaction}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
            >
              Simulate Transaction
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;