import { useState, useEffect, useCallback } from 'react';
import { BigNumber } from 'ethers';

interface GasEstimatorOptions {
  provider: any;
  refreshInterval?: number;
  historicalBlocks?: number;
  priorityFeeBump?: number;
  onError?: (error: Error) => void;
  onSuccess?: (estimation: GasEstimation) => void;
}

interface GasEstimation {
  baseFee: BigNumber;
  maxFeePerGas: BigNumber;
  maxPriorityFeePerGas: BigNumber;
  gasLimit: BigNumber;
  estimatedCost: BigNumber;
  confidence: {
    low: BigNumber;
    medium: BigNumber;
    high: BigNumber;
  };
  historicalTrends: {
    average: BigNumber;
    median: BigNumber;
    percentile90: BigNumber;
  };
  timeEstimates: {
    likely: number;
    fast: number;
    urgent: number;
  };
}

export const useGasEstimator = ({
  provider,
  refreshInterval = 15000,
  historicalBlocks = 20,
  priorityFeeBump = 10,
  onError,
  onSuccess
}: GasEstimatorOptions) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [estimation, setEstimation] = useState<GasEstimation | null>(null);
  const [blockHistory, setBlockHistory] = useState<any[]>([]);

  const estimateGas = useCallback(async (transaction?: any) => {
    if (!provider) {
      setError(new Error('Provider not available'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get current block
      const currentBlock = await provider.getBlock('latest');
      const baseFee = currentBlock.baseFeePerGas || BigNumber.from(0);

      // Get historical blocks for trend analysis
      const latestBlockNumber = currentBlock.number;
      const historicalFees = await Promise.all(
        Array.from({ length: historicalBlocks }, (_, i) => 
          provider.getBlock(latestBlockNumber - i)
            .catch(() => null) // Handle failed block fetches gracefully
        )
      );

      // Filter out null blocks and extract valid base fees
      const validHistoricalBlocks = historicalFees.filter(block => block && block.baseFeePerGas);
      setBlockHistory(prev => {
        const newHistory = [...validHistoricalBlocks, ...prev].slice(0, 100);
        return newHistory;
      });

      // Calculate priority fee and max fee
      const maxPriorityFeePerGas = BigNumber.from(priorityFeeBump).mul(1e9); // GWEI
      const maxFeePerGas = baseFee.mul(2).add(maxPriorityFeePerGas);

      // Calculate gas limit with fallback
      let gasLimit;
      try {
        gasLimit = transaction ? 
          await provider.estimateGas(transaction) :
          BigNumber.from(21000); // Default ETH transfer
      } catch (err) {
        gasLimit = BigNumber.from(21000);
      }

      // Extract historical base fees with fallback for missing data
      const historicalBaseFees = validHistoricalBlocks
        .map(block => block.baseFeePerGas)
        .filter(fee => fee && !fee.isZero());

      // Handle empty historical data
      if (historicalBaseFees.length === 0) {
        historicalBaseFees.push(baseFee);
      }

      // Sort fees for percentile calculations
      const sortedFees = [...historicalBaseFees].sort((a, b) => 
        a.sub(b).isNegative() ? -1 : 1
      );

      // Calculate confidence levels with fallbacks
      const confidence = {
        low: sortedFees[0] || baseFee,
        medium: sortedFees[Math.floor(sortedFees.length / 2)] || baseFee,
        high: sortedFees[sortedFees.length - 1] || baseFee
      };

      // Calculate historical trends with safe division
      const average = historicalBaseFees.length > 0
        ? historicalBaseFees.reduce((acc, fee) => acc.add(fee), BigNumber.from(0))
            .div(BigNumber.from(historicalBaseFees.length))
        : baseFee;

      const median = sortedFees[Math.floor(sortedFees.length / 2)] || baseFee;
      const percentile90 = sortedFees[Math.floor(sortedFees.length * 0.9)] || baseFee;

      // Calculate estimated cost
      const estimatedCost = maxFeePerGas.mul(gasLimit);

      const estimationResult: GasEstimation = {
        baseFee,
        maxFeePerGas,
        maxPriorityFeePerGas,
        gasLimit,
        estimatedCost,
        confidence,
        historicalTrends: {
          average,
          median,
          percentile90
        },
        timeEstimates: {
          likely: 15,
          fast: 30,
          urgent: 60
        }
      };

      setEstimation(estimationResult);
      setError(null);
      onSuccess?.(estimationResult);
      
    } catch (err: any) {
      const error = new Error(err.message || 'Failed to estimate gas');
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [provider, historicalBlocks, priorityFeeBump, onError, onSuccess]);

  // Auto-refresh estimates
  useEffect(() => {
    if (provider) {
      estimateGas();
      const interval = setInterval(estimateGas, refreshInterval);
      return () => clearInterval(interval as NodeJS.Timeout);
    }
  }, [estimateGas, refreshInterval, provider]);

  return {
    loading,
    error,
    estimation,
    estimateGas,
    blockHistory
  };
};



import React from 'react';
import { ethers } from 'ethers';
import { useGasEstimator } from './Hooks/useGasEstimator';


const App = () => {
  // Connect to a local Ethereum node (Ganache)
  const provider = new ethers.providers.JsonRpcProvider('https://sepolia.infura.io/v3/96a5eaee541f4b9ba92d115040b83a53');

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
    onSuccess: (estimation) => console.log('Gas estimation success:', estimation),
  });

  return (
    <div style={{ padding: '20px' }}>
      <h1>Gas Estimator</h1>
      {loading && <p>Loading gas estimation...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
      {estimation && (
        <div>
          <h2>Gas Estimation</h2>
          <p>Base Fee: {estimation.baseFee.toString()}</p>
          <p>Max Fee Per Gas: {estimation.maxFeePerGas.toString()}</p>
          <p>Max Priority Fee Per Gas: {estimation.maxPriorityFeePerGas.toString()}</p>
          <p>Gas Limit: {estimation.gasLimit.toString()}</p>
          <p>Estimated Cost: {estimation.estimatedCost.toString()}</p>

          <h3>Confidence Levels</h3>
          <p>Low: {estimation.confidence.low.toString()}</p>
          <p>Medium: {estimation.confidence.medium.toString()}</p>
          <p>High: {estimation.confidence.high.toString()}</p>

          <h3>Gas Price Recommendations</h3>
          <p>Slow: {estimation.gasPriceRecommendations.slow}</p>
          <p>Standard: {estimation.gasPriceRecommendations.standard}</p>
          <p>Fast: {estimation.gasPriceRecommendations.fast}</p>

          <h3>Network Congestion</h3>
          <p>{estimation.networkCongestion}</p>

        </div>
      )}
    </div>
  );
};

export default App;
