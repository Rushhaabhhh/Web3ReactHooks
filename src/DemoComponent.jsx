import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useTransactionStatus } from './Hooks/useTransactionStatus';
import { useGasEstimator } from './Hooks/useGasEstimator';
import { useWalletMultiChain } from './Hooks/useWalletMultiChain';
import { motion } from "framer-motion";

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


function TransactionMonitor({ txHash }) {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const transactionInfo = useTransactionStatus(provider, txHash, {
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

function DemoComponent() {
  const { wallet, actions } = useWalletMultiChain(supportedChains);
  const { provider, network, walletAddress } = wallet;
  const { connectWallet, disconnectWallet, switchNetwork } = actions;

  const [availableChains, setAvailableChains] = useState([]);
  const [selectedChain, setSelectedChain] = useState(network);
  const [transactionHash, setTransactionHash] = useState('');
  const [pendingTransaction, setPendingTransaction] = useState(null);
  const [balance, setBalance] = useState('0');

  const {
    loading,
    error,
    estimation,
    estimateGas,
    blockHistory,
  } = useGasEstimator({
    provider,
    refreshInterval: 15000, // Refresh every 15 seconds
    historicalBlocks: 10, // Use fewer blocks for faster results in local testing
    priorityFeeBump: 5, // Smaller bump for testing
    onError: (err) => console.error('Gas estimation error:', err),
    onSuccess: (estimation) => {
        console.log('Gas estimation success:', estimation), 
        console.log('Provider : ', provider)
    }
  });

  useEffect(() => {
    if (window.ethereum) {
      setAvailableChains(supportedChains);
    }
  }, []);

  useEffect(() => {
    if (walletAddress && provider) {
      // Fetch the balance when the wallet address is set
      const getBalance = async () => {
        try {
          const balance = await provider.getBalance(walletAddress);
          setBalance(ethers.utils.formatEther(balance));
        } catch (error) {
          console.error('Error fetching balance:', error);
        }
      };

      getBalance();
    }
  }, [walletAddress, provider]);

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
    <section className="container mx-auto px-6 py-20 bg-cover bg-center" id="wallet-demo">
      <div className="text-center mb-16">
        <motion.h2
          className="text-4xl font-bold"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          Demonstration
        </motion.h2>
        <motion.p
          className="mt-4 text-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          Interact with blockchain wallets and estimate gas fees seamlessly!
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* Gas Estimator */}
        <motion.div
          className="bg-gray-800 p-8 rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <motion.h3
            className="text-2xl font-bold"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            Gas Estimator
          </motion.h3>
          <motion.p
            className="mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            Estimate gas fees to optimize transaction costs across networks.
          </motion.p>

          <div className="mt-6">
            {loading && <p className="text-yellow-400">Loading gas estimation...</p>}
            {error && <p className="text-red-500">Error: {error.message}</p>}
            {estimation && (
              <div className="mt-4 text-sm text-gray-300">
                <p><span className="font-semibold">Base Fee:</span> {estimation.baseFee.toString()}</p>
                <p><span className="font-semibold">Max Fee Per Gas:</span> {estimation.maxFeePerGas.toString()}</p>
                <p><span className="font-semibold">Max Priority Fee Per Gas:</span> {estimation.maxPriorityFeePerGas.toString()}</p>
                <p><span className="font-semibold">Gas Limit:</span> {estimation.gasLimit.toString()}</p>
                <p><span className="font-semibold">Estimated Cost:</span> {estimation.estimatedCost.toString()}</p>
              </div>
            )}
          </div>

          <motion.button
            className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition duration-200 mt-6"
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            Estimate Gas
          </motion.button>
        </motion.div>

        {/* Wallet Connection */}
        <motion.div
          className="bg-gray-800 p-8 rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <motion.h3
            className="text-2xl font-bold"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            Wallet Connection
          </motion.h3>
          <motion.p
            className="mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            Connect your wallet and view your balance, network, and transactions.
          </motion.p>

          {!walletAddress ? (
            <motion.button
              onClick={connectWallet}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-200 mt-6"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              Connect Wallet
            </motion.button>
          ) : (
            <div className="mt-6 text-sm text-gray-300">
              <p><span className="font-semibold">Connected Address:</span> {walletAddress}</p>
              <p><span className="font-semibold">Balance:</span> {balance} ETH</p>
              <p><span className="font-semibold">Network:</span> {networkNames[network] || `Chain ID ${network}`}</p>

              <div className="mt-4">
                <motion.button
                  onClick={disconnectWallet}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition duration-200"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  Disconnect Wallet
                </motion.button>

                <motion.select
                  value={selectedChain}
                  onChange={(e) => handleSwitchNetwork(parseInt(e.target.value))}
                  className="w-full bg-blue-500 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold mt-4"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  {availableChains.map((chainId) => (
                    <option key={chainId} value={chainId}>
                      {networkNames[chainId] || `Chain ID ${chainId}`}
                    </option>
                  ))}
                </motion.select>
              </div>
            </div>
          )}
        </motion.div>

        {/* Transaction Status */}
        <motion.div
          className="bg-gray-800 p-8 rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <motion.h3
            className="text-2xl font-bold"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            Transaction Status
          </motion.h3>
          <motion.p
            className="mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            Track the status of your blockchain transactions in real time.
          </motion.p>

          <div className="mt-6">
            {transactionHash ? (
              <div className="text-sm text-gray-300">
                <p><span className="font-semibold">Transaction Hash:</span> {transactionHash}</p>
                <TransactionMonitor txHash={transactionHash} />
              </div>
            ) : (
              <p className="text-gray-400">No transaction in progress.</p>
            )}
          </div>

          <motion.button
            onClick={handleSimulateTransaction}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition duration-200 mt-6"
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            Simulate Transaction
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

export default DemoComponent;