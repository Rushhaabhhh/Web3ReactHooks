import { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import { ethers } from 'ethers';
import { debounce, throttle } from 'lodash';

// Create a Context for wallet state
const WalletContext = createContext(null);

// WalletProvider component that provides wallet state and actions to its children
export const WalletProvider = ({ children, supportedChains }) => {
  const wallet = useWalletMultiChain(supportedChains);
  
  return <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>;
};

// Custom hook to use the wallet context
export const useWallet = () => useContext(WalletContext);

// Hook to manage wallet state and interactions with multiple chains
export const useWalletMultiChain = (supportedChains) => {
  const [walletState, setWalletState] = useState({
    provider: null,
    network: null,
    walletAddress: null,
  });

  const hasEthereum = useMemo(() => typeof window !== 'undefined' && window.ethereum, []);

  // Function to get the Web3 provider
  const getProvider = useCallback(() => {
    if (!walletState.provider && hasEthereum) {
      const tempProvider = new ethers.providers.Web3Provider(window.ethereum);
      setWalletState((prevState) => ({ ...prevState, provider: tempProvider }));
    }
    return walletState.provider;
  }, [hasEthereum, walletState.provider]);

  // Function to reset the wallet state
  const resetState = useCallback(() => {
    setWalletState({ provider: null, network: null, walletAddress: null });
  }, []);

  // Function to connect the wallet
  const connectWallet = useCallback(async () => {
    if (!hasEthereum) {
      throw new Error('Please install MetaMask or another Web3 wallet.');
    }

    try {
      const provider = getProvider() || new ethers.providers.Web3Provider(window.ethereum);
      const { chainId } = await provider.getNetwork();

      if (!supportedChains.includes(chainId)) {
        throw new Error('Unsupported chain. Please switch your network.');
      }

      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();

      setWalletState({ provider, network: chainId, walletAddress: address });
    } catch (err) {
      resetState();
      throw err;
    }
  }, [hasEthereum, getProvider, supportedChains, resetState]);

  // Function to disconnect the wallet
  const disconnectWallet = useCallback(() => resetState(), [resetState]);

  // Function to switch the network
  const switchNetwork = useCallback(async (chainId) => {
    if (!hasEthereum) {
      throw new Error('No Web3 wallet detected');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        throw new Error('This network is not available in your MetaMask, please add it manually.');
      }
      throw switchError;
    }
  }, [hasEthereum]);

  // Handle chain changes with debouncing
  const handleChainChanged = useMemo(
    () => debounce((chainId) => {
      const newNetwork = parseInt(chainId, 16);
      setWalletState((prev) => ({ ...prev, network: newNetwork }));
    }, 300),
    []
  );

  // Handle account changes with throttling
  const handleAccountsChanged = useMemo(
    () => throttle((accounts) => {
      if (accounts.length > 0) {
        setWalletState((prev) => ({ ...prev, walletAddress: accounts[0] }));
      } else {
        disconnectWallet();
      }
    }, 300),
    [disconnectWallet]
  );

  // Set up event listeners for Ethereum account and network changes
  useEffect(() => {
    if (!hasEthereum) return;

    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('accountsChanged', handleAccountsChanged);

    return () => {
      window.ethereum.removeListener('chainChanged', handleChainChanged);
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [hasEthereum, handleChainChanged, handleAccountsChanged]);

  // Define actions that can be used with the wallet
  const actions = useMemo(() => ({
    connectWallet,
    disconnectWallet,
    switchNetwork,
  }), [connectWallet, disconnectWallet, switchNetwork]);

  return {
    wallet: walletState,
    actions,
  };
};
