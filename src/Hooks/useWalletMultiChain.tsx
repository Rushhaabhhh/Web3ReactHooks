import React, { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import { ethers, providers } from 'ethers';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';

declare global {
  interface Window {
    ethereum: any;
  }
}

// Wallet context to provide wallet state
interface WalletState {
  provider: providers.Web3Provider | null;
  network: number | null;
  walletAddress: string | null;
  balance: string | null;
}

interface WalletActions {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
}

const WalletContext = createContext<{
  wallet: WalletState;
  actions: WalletActions;
} | null>(null);

// WalletProvider component to wrap app with context
export const WalletProvider: React.FC<{ children: React.ReactNode; supportedChains: number[] }> = ({ children, supportedChains }) => {
  const wallet = useWalletMultiChain(supportedChains);
  return <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>;
};

// Custom hook to access wallet context
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

// Hook for managing wallet state with support for multiple chains
export const useWalletMultiChain = (supportedChains: number[]) => {
  const [walletState, setWalletState] = useState<WalletState>({
    provider: null,
    network: null,
    walletAddress: null,
    balance: null,
  });

  const hasEthereum = useMemo(() => typeof window !== 'undefined' && window.ethereum, []);

  // Get Web3 provider
  const getProvider = useCallback(() => {
    if (!walletState.provider && hasEthereum) {
      const tempProvider = new ethers.providers.Web3Provider(window.ethereum);
      setWalletState((prevState) => ({ ...prevState, provider: tempProvider }));
    }
    return walletState.provider;
  }, [hasEthereum, walletState.provider]);

  // Reset wallet state
  const resetState = useCallback(() => {
    setWalletState({ provider: null, network: null, walletAddress: null, balance: null });
  }, []);

  // Connect wallet to provider
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

      setWalletState({ provider, network: chainId, walletAddress: address, balance: null });
      await updateBalance(provider, address); 
    } catch (err) {
      resetState();
      throw err;
    }
  }, [hasEthereum, getProvider, supportedChains, resetState]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => resetState(), [resetState]);

  // Switch network to a supported chain
  const switchNetwork = useCallback(async (chainId: number) => {
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

  // Handle chain change with debounce
  const handleChainChanged = useMemo(
    () => debounce((chainId: string) => {
      const newNetwork = parseInt(chainId, 16);
      setWalletState((prev) => ({ ...prev, network: newNetwork }));
    }, 300),
    []
  );

  // Handle account change with throttle
  const handleAccountsChanged = useMemo(
    () => throttle((accounts: string[]) => {
      if (accounts.length > 0) {
        setWalletState((prev) => ({ ...prev, walletAddress: accounts[0] }));
      } else {
        disconnectWallet();
      }
    }, 300),
    [disconnectWallet]
  );

  // Set up event listeners for account and network changes
  useEffect(() => {
    if (!hasEthereum) return;

    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('accountsChanged', handleAccountsChanged);

    return () => {
      window.ethereum.removeListener('chainChanged', handleChainChanged);
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [hasEthereum, handleChainChanged, handleAccountsChanged]);

  // Update wallet balance
  const updateBalance = useCallback(async (provider: providers.Web3Provider, address: string) => {
    if (provider && address) {
      const balanceInWei = await provider.getBalance(address);
      const balanceInEther = ethers.utils.formatEther(balanceInWei);
      setWalletState((prev) => ({ ...prev, balance: balanceInEther }));
    }
  }, []);

  // Actions related to wallet management
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
