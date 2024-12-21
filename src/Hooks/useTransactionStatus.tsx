import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers, providers } from 'ethers';

// Type for options to configure the hook behavior
interface TransactionStatusOptions {
  initialPollingInterval?: number;
  requiredConfirmations?: number;
  onStatusChange?: (currentStatus: string, prevStatus: string) => void;
  onConfirmation?: (transactionInfo: any) => void;
  onError?: (error: string) => void;
}

// Type for transaction info
interface TransactionInfo {
  status: string;
  confirmations: number;
  gasUsed: string | null;
  effectiveGasPrice: string | null;
  error: string | null;
  history: Array<{ status: string; timestamp: number }>;
  mempoolPosition: number | null;
  gasPriceRecommendations: { slow: string; standard: string; fast: string } | null;
}

// Custom hook to monitor transaction status
export const useTransactionStatus = (
  provider: providers.JsonRpcProvider,
  txHash: string,
  options: TransactionStatusOptions = {}
) => {
  const {
    initialPollingInterval = 5000,
    requiredConfirmations = 1,
    onStatusChange,
    onConfirmation,
    onError,
  } = options;

  // State to hold transaction status and details
  const [transactionInfo, setTransactionInfo] = useState<TransactionInfo>({
    status: 'pending',
    confirmations: 0,
    gasUsed: null,
    effectiveGasPrice: null,
    error: null,
    history: [],
    mempoolPosition: null,
    gasPriceRecommendations: null,
  });

  const [pollingInterval, setPollingInterval] = useState(initialPollingInterval);
  const prevStatusRef = useRef(transactionInfo.status);

  // Get network congestion based on fee data
  const getNetworkCongestion = useCallback(async () => {
    try {
      const feeData = await provider.getFeeData();
      const maxFeePerGas = feeData.maxFeePerGas ? ethers.utils.formatUnits(feeData.maxFeePerGas, 'gwei') : '0';
      return parseFloat(maxFeePerGas) > 100 ? 'high' : 'normal';
    } catch (error) {
      console.error('Failed to get network congestion', error);
      return 'unknown';
    }
  }, [provider]);

  // Get gas price recommendations based on fee data
  const getGasPriceRecommendations = useCallback(async () => {
    try {
      const feeData = await provider.getFeeData();
      return {
        slow: feeData.maxFeePerGas ? ethers.utils.formatUnits(feeData.maxFeePerGas.mul(80).div(100), 'gwei') : '0',
        standard: feeData.maxFeePerGas ? ethers.utils.formatUnits(feeData.maxFeePerGas, 'gwei') : '0',
        fast: feeData.maxFeePerGas ? ethers.utils.formatUnits(feeData.maxFeePerGas.mul(120).div(100), 'gwei') : '0',
      };
    } catch (error) {
      console.error('Failed to get gas price recommendations', error);
      return null;
    }
  }, [provider]);

  // Get position of the transaction in the mempool
  const getMempoolPosition = useCallback(async (txHash: string) => {
    try {
      const pendingTransactions = await provider.send('eth_getBlockByNumber', ['pending', false]);
      const position = pendingTransactions.transactions.indexOf(txHash);
      return position === -1 ? null : position + 1;
    } catch (error) {
      console.error('Failed to get mempool position', error);
      return null;
    }
  }, [provider]);

  // Get the transaction status and details
  const getTransactionStatus = useCallback(async () => {
    if (!provider || !txHash) return;

    try {
      const tx = await provider.getTransaction(txHash);
      if (!tx) {
        setTransactionInfo((prev) => ({
          ...prev,
          status: 'not found',
          error: 'Transaction not found',
          history: [...prev.history, { status: 'not found', timestamp: Date.now() }],
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

        setTransactionInfo((prev) => ({
          ...prev,
          status: newStatus,
          confirmations,
          gasUsed: receipt.gasUsed.toString(),
          effectiveGasPrice: receipt.effectiveGasPrice.toString(),
          error: null,
          history: [...prev.history, { status: newStatus, timestamp: Date.now() }],
          mempoolPosition: null,
        }));
      } else {
        const mempoolPosition = await getMempoolPosition(txHash);
        const gasPriceRecommendations = await getGasPriceRecommendations();
        
        setTransactionInfo((prev) => ({
          ...prev,
          status: 'pending',
          mempoolPosition,
          gasPriceRecommendations,
          history: [...prev.history, { status: 'pending', timestamp: Date.now() }],
        }));
      }

      // Adjust polling interval based on network congestion
      const congestion = await getNetworkCongestion();
      setPollingInterval((prevInterval) =>
        congestion === 'high' ? Math.min(prevInterval * 1.5, 30000) : initialPollingInterval
      );
    } catch (error) {
      console.error('Failed to get transaction status', error);
      setTransactionInfo((prev) => ({
        ...prev,
        status: 'error',
        error: error.message,
        history: [...prev.history, { status: 'error', timestamp: Date.now() }],
      }));
    }
  }, [provider, txHash, requiredConfirmations, getMempoolPosition, getGasPriceRecommendations, getNetworkCongestion, initialPollingInterval]);

  useEffect(() => {
    getTransactionStatus();
    const intervalId: ReturnType<typeof setInterval> = setInterval(getTransactionStatus, pollingInterval);
    return () => clearInterval(intervalId as unknown as number);
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
      if (transactionInfo.error) {
        onError(transactionInfo.error);
      }
    }
  }, [transactionInfo, onStatusChange, onConfirmation, onError]);

  return transactionInfo;
};
