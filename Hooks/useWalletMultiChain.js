import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

export const useWalletMultiChain = (supportedChains) => {
    const [provider, setProvider] = useState(null);
    const [network, setNetwork] = useState(null);
    const [walletAddress, setWalletAddress] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);

    const connectWallet = useCallback(async () => {
        setIsConnecting(true);
        setError(null);

        try {
            if (window.ethereum) {
                const tempProvider = new ethers.providers.Web3Provider(window.ethereum);
                const { chainId } = await tempProvider.getNetwork();

                if (supportedChains.includes(chainId)) {
                    await tempProvider.send('eth_requestAccounts', []);
                    const signer = tempProvider.getSigner();
                    const address = await signer.getAddress();

                    setProvider(tempProvider);
                    setNetwork(chainId);
                    setWalletAddress(address);
                } else {
                    throw new Error('Unsupported chain. Please switch your network.');
                }
            } else {
                throw new Error('Please install MetaMask or another Web3 wallet.');
            }
        } catch (err) {
            setError(err.message);
            setProvider(null);
            setNetwork(null);
            setWalletAddress(null);
        } finally {
            setIsConnecting(false);
        }
    }, [supportedChains]);

    const disconnectWallet = useCallback(() => {
        setProvider(null);
        setNetwork(null);
        setWalletAddress(null);
        setError(null);
    }, []);

    const switchNetwork = useCallback(async (chainId) => {
        if (!window.ethereum) {
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
    }, []);

    useEffect(() => {
        const handleChainChanged = (chainId) => {
            setNetwork(parseInt(chainId, 16));
        };

        const handleAccountsChanged = (accounts) => {
            if (accounts.length > 0) {
                setWalletAddress(accounts[0]);
            } else {
                disconnectWallet();
            }
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

    return {
        provider,
        network,
        walletAddress,
        isConnecting,
        error,
        connectWallet,
        disconnectWallet,
        switchNetwork
    };
};
