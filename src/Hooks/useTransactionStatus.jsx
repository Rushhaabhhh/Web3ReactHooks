import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';

export const useTransactionStatus = (provider, txHash, options = {}) => {
  const {
    initialPollingInterval = 5000,
    requiredConfirmations = 1,
    onStatusChange,
    onConfirmation,
    onError
  } = options;

  const [transactionInfo, setTransactionInfo] = useState({
    status: 'pending',
    confirmations: 0,
    gasUsed: null,
    effectiveGasPrice: null,
    error: null,
    history: [],
    mempoolPosition: null,
    gasPriceRecommendations: null
  });

  const [pollingInterval, setPollingInterval] = useState(initialPollingInterval);
  const prevStatusRef = useRef(transactionInfo.status);

  const getNetworkCongestion = useCallback(async () => {
    try {
      const feeData = await provider.getFeeData();
      const maxFeePerGas = ethers.utils.formatUnits(feeData.maxFeePerGas, 'gwei');
      return parseFloat(maxFeePerGas) > 100 ? 'high' : 'normal';
    } catch (error) {
      console.error('Failed to get network congestion', error);
      return 'unknown';
    }
  }, [provider]);

  const getGasPriceRecommendations = useCallback(async () => {
    try {
      const feeData = await provider.getFeeData();
      return {
        slow: ethers.utils.formatUnits(feeData.maxFeePerGas.mul(80).div(100), 'gwei'),
        standard: ethers.utils.formatUnits(feeData.maxFeePerGas, 'gwei'),
        fast: ethers.utils.formatUnits(feeData.maxFeePerGas.mul(120).div(100), 'gwei')
      };
    } catch (error) {
      console.error('Failed to get gas price recommendations', error);
      return null;
    }
  }, [provider]);

  const getMempoolPosition = useCallback(async (txHash) => {
    // This is a placeholder. Actual implementation would depend on the specific blockchain and available APIs
    try {
      const pendingTransactions = await provider.send('eth_getBlockByNumber', ['pending', false]);
      const position = pendingTransactions.transactions.indexOf(txHash);
      return position === -1 ? null : position + 1;
    } catch (error) {
      console.error('Failed to get mempool position', error);
      return null;
    }
  }, [provider]);

  const getTransactionStatus = useCallback(async () => {
    if (!provider || !txHash) return;

    try {
      const tx = await provider.getTransaction(txHash);
      if (!tx) {
        setTransactionInfo(prev => ({
          ...prev,
          status: 'not found',
          error: 'Transaction not found',
          history: [...prev.history, { status: 'not found', timestamp: Date.now() }]
        }));
        return;
      }

      const receipt = await provider.getTransactionReceipt(txHash);
      if (receipt) {
        const currentBlock = await provider.getBlockNumber();
        const confirmations = currentBlock - receipt.blockNumber + 1;

        const newStatus = receipt.status === 1
          ? (confirmations >= requiredConfirmations ? 'confirmed' : 'confirming')
          : 'failed';

        setTransactionInfo(prev => ({
          ...prev,
          status: newStatus,
          confirmations,
          gasUsed: receipt.gasUsed.toString(),
          effectiveGasPrice: receipt.effectiveGasPrice.toString(),
          error: null,
          history: [...prev.history, { status: newStatus, timestamp: Date.now() }],
          mempoolPosition: null
        }));
      } else {
        const mempoolPosition = await getMempoolPosition(txHash);
        const gasPriceRecommendations = await getGasPriceRecommendations();
        
        setTransactionInfo(prev => ({
          ...prev,
          status: 'pending',
          mempoolPosition,
          gasPriceRecommendations,
          history: [...prev.history, { status: 'pending', timestamp: Date.now() }]
        }));
      }

      // Adjust polling interval based on network congestion
      const congestion = await getNetworkCongestion();
      setPollingInterval(prevInterval => 
        congestion === 'high' ? prevInterval * 1.5 : initialPollingInterval
      );

    } catch (error) {
      console.error('Failed to get transaction status', error);
      setTransactionInfo(prev => ({
        ...prev,
        status: 'error',
        error: error.message,
        history: [...prev.history, { status: 'error', timestamp: Date.now() }]
      }));
    }
  }, [provider, txHash, requiredConfirmations, getMempoolPosition, getGasPriceRecommendations, getNetworkCongestion, initialPollingInterval]);

  useEffect(() => {
    getTransactionStatus();
    const intervalId = setInterval(getTransactionStatus, pollingInterval);
    return () => clearInterval(intervalId);
  }, [getTransactionStatus, pollingInterval]);

  useEffect(() => {
    const currentStatus = transactionInfo.status;
    if (currentStatus !== prevStatusRef.current) {
      if (onStatusChange) onStatusChange(currentStatus, prevStatusRef.current);
      prevStatusRef.current = currentStatus;
    }

    if (currentStatus === 'confirmed' && onConfirmation) {
      onConfirmation(transactionInfo);
    }

    if (currentStatus === 'error' && onError) {
      onError(transactionInfo.error);
    }
  }, [transactionInfo, onStatusChange, onConfirmation, onError]);

  return transactionInfo;
};
