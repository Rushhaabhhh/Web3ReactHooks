import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

// Define network names for common chain IDs
const NETWORK_NAMES = {
  1: 'Ethereum Mainnet',
  3: 'Ropsten Testnet',
  4: 'Rinkeby Testnet',
  5: 'Goerli Testnet',
  42: 'Kovan Testnet',
  56: 'Binance Smart Chain',
  137: 'Polygon Mainnet',
  11155111 : 'Sepolia Testnet',
  // Add more networks as needed
};

export const useWalletMultiChain = (config = {}) => {
  // Destructure config with default values
  const { supportedChains = [1, 3, 4, 5, 42], autoConnect = false } = config;

  // State variables for wallet connection
  const [provider, setProvider] = useState(null);
  const [network, setNetwork] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Connect wallet function
  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Check for Ethereum provider (e.g., MetaMask)
      if (!window.ethereum) throw new Error('No Web3 wallet detected. Please install MetaMask or another Web3 wallet.');

      const tempProvider = new ethers.providers.Web3Provider(window.ethereum);
      const { chainId } = await tempProvider.getNetwork();

      // Check if the current chain is supported
      if (!supportedChains.includes(chainId)) {
        throw new Error(`Unsupported chain. Please switch to one of the following networks: ${supportedChains.map(id => NETWORK_NAMES[id] || id).join(', ')}`);
      }

      // Request account access
      await tempProvider.send('eth_requestAccounts', []);
      const signer = tempProvider.getSigner();
      const address = await signer.getAddress();

      // Set state variables
      setProvider(tempProvider);
      setNetwork(chainId);
      setWalletAddress(address);
    } catch (err) {
      setError(err.message);
      setProvider(null);
      setNetwork(null);
      setWalletAddress(null);
    } finally {
      setIsConnecting(false);
    }
  }, [supportedChains]);

  // Disconnect wallet function
  const disconnectWallet = useCallback(() => {
    setProvider(null);
    setNetwork(null);
    setWalletAddress(null);
    setError(null);
  }, []);

  // Switch network function
  const switchNetwork = useCallback(async (chainId) => {
    if (!window.ethereum) throw new Error('No Web3 wallet detected');

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        throw new Error('This network is not available in your wallet. Please add it manually.');
      }
      throw switchError;
    }
  }, []);

  // Effect for handling network and account changes
  useEffect(() => {
    const handleChainChanged = (chainId) => setNetwork(parseInt(chainId, 16));
    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) setWalletAddress(accounts[0]);
      else disconnectWallet();
    };

    if (window.ethereum) {
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [disconnectWallet]);

  // Auto-connect effect
  useEffect(() => {
    if (autoConnect) connectWallet();
  }, [autoConnect, connectWallet]);

  // Return hook values and functions
  return {
    provider,
    network,
    networkName: NETWORK_NAMES[network] || `Unknown Network (${network})`,
    walletAddress,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    isConnected: !!walletAddress,
  };
};