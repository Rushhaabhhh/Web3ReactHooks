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

function GasEstimatorPanel({ provider, transaction }) {
  const { loading, error, estimation } = useGasEstimator({
    provider,
    refreshInterval: 12000,
    historicalBlocks: 20,
    onError: (err) => console.error('Gas estimation error:', err),
  });

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
      <h3 className="text-lg font-semibold mb-3">Gas Estimation</h3>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Base Fee:</span>
          <span className="font-mono">{formatGwei(estimation.baseFee)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Max Fee:</span>
          <span className="font-mono">{formatGwei(estimation.maxFeePerGas)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Priority Fee:</span>
          <span className="font-mono">{formatGwei(estimation.maxPriorityFeePerGas)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Estimated Cost:</span>
          <span className="font-mono">{formatEther(estimation.estimatedCost)}</span>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-semibold mb-2">Estimated Confirmation Time</h4>
          <div className="bg-gray-100 rounded p-2">
            <div className="flex justify-between text-sm">
              <span>Likely: {estimation.timeEstimates.likely}s</span>
              <span>Fast: {estimation.timeEstimates.fast}s</span>
              <span>Urgent: {estimation.timeEstimates.urgent}s</span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-semibold mb-2">Confidence Levels</h4>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="bg-green-100 rounded p-2 text-center">
              <div className="font-semibold">Low</div>
              <div className="font-mono text-xs">{formatGwei(estimation.confidence.low)}</div>
            </div>
            <div className="bg-yellow-100 rounded p-2 text-center">
              <div className="font-semibold">Medium</div>
              <div className="font-mono text-xs">{formatGwei(estimation.confidence.medium)}</div>
            </div>
            <div className="bg-red-100 rounded p-2 text-center">
              <div className="font-semibold">High</div>
              <div className="font-mono text-xs">{formatGwei(estimation.confidence.high)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TransactionMonitor({ txHash }) {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const transactionInfo = useTransactionStatus(provider, txHash, {
    initialPollingInterval: 5000,
    requiredConfirmations: 3,
    onStatusChange: (newStatus, oldStatus) =>
      console.log(`Status changed from ${oldStatus} to ${newStatus}`),
    onConfirmation: (info) => console.log('Transaction confirmed:', info),
    onError: (error) => console.error('Transaction error:', error),
  });

  return (
    <div className="mt-6 p-4 bg-gray-100 rounded shadow">
      <h2 className="text-xl font-bold mb-2">Transaction Status</h2>
      <p><strong>Status:</strong> {transactionInfo.status}</p>
      <p><strong>Confirmations:</strong> {transactionInfo.confirmations}</p>
      <p><strong>Gas Used:</strong> {transactionInfo.gasUsed || 'N/A'}</p>
      <p><strong>Effective Gas Price:</strong> {transactionInfo.effectiveGasPrice || 'N/A'}</p>
      <p><strong>Mempool Position:</strong> {transactionInfo.mempoolPosition || 'N/A'}</p>
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
  const [pendingTransaction, setPendingTransaction] = useState(null);

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

    const transaction = {
      to: walletAddress,
      value: ethers.utils.parseEther('0.001'),
    };

    setPendingTransaction(transaction);

    try {
      const signer = provider.getSigner();
      const tx = await signer.sendTransaction(transaction);
      setTransactionHash(tx.hash);
      setPendingTransaction(null);
    } catch (error) {
      console.error('Transaction error:', error);
      alert('Transaction failed. Check the console for details.');
      setPendingTransaction(null);
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

            {provider && pendingTransaction && (
              <GasEstimatorPanel 
                provider={provider} 
                transaction={pendingTransaction} 
              />
            )}

            <button
              onClick={handleSimulateTransaction}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
            >
              Simulate Transaction
            </button>
          </div>
        )}

        {transactionHash && <TransactionMonitor txHash={transactionHash} />}
      </div>
    </div>
  );
}

export default App;