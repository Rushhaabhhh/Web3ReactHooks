import { useState, useEffect, useCallback } from 'react';
import { BigNumber } from 'ethers';

// Interface for options to configure the gas estimator
interface GasEstimatorOptions {
  provider: any; // Ethereum provider 
  refreshInterval?: number; // Refresh interval in ms (default 15000)
  historicalBlocks?: number; // Number of historical blocks to analyze (default 20)
  priorityFeeBump?: number; // Additional priority fee for gas (default 10 GWEI)
  onError?: (error: Error) => void; // Callback for error handling
  onSuccess?: (estimation: GasEstimation) => void; // Callback for successful estimation
}

// Interface for gas estimation result
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

// Custom hook to estimate gas fees
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

  // Function to estimate gas fees for a given transaction
  const estimateGas = useCallback(async (transaction?: any) => {
    if (!provider) {
      setError(new Error('Provider not available'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get current block to estimate the base fee
      const currentBlock = await provider.getBlock('latest');
      const baseFee = currentBlock.baseFeePerGas || BigNumber.from(0);

      // Fetch historical block data for fee trends
      const latestBlockNumber = currentBlock.number;
      const historicalFees = await Promise.all(
        Array.from({ length: historicalBlocks }, (_, i) => 
          provider.getBlock(latestBlockNumber - i)
            .catch(() => null) 
        )
      );

      // Filter and update block history with valid data
      const validHistoricalBlocks = historicalFees.filter(block => block && block.baseFeePerGas);
      setBlockHistory(prev => {
        const newHistory = [...validHistoricalBlocks, ...prev].slice(0, 100); // Keep the last 100 blocks
        return newHistory;
      });

      // Estimate gas fees and limits
      const maxPriorityFeePerGas = BigNumber.from(priorityFeeBump).mul(1e9); // Convert to GWEI
      const maxFeePerGas = baseFee.mul(2).add(maxPriorityFeePerGas);

      // Estimate gas limit, default to ETH transfer gas limit if unavailable
      let gasLimit;
      try {
        gasLimit = transaction ? 
          await provider.estimateGas(transaction) : 
          BigNumber.from(21000); // Default for ETH transfer
      } catch (err) {
        gasLimit = BigNumber.from(21000); // Fallback if estimation fails
      }

      // Process historical base fees for trend analysis
      const historicalBaseFees = validHistoricalBlocks
        .map(block => block.baseFeePerGas)
        .filter(fee => fee && !fee.isZero());

      // Use current base fee if historical data is insufficient
      if (historicalBaseFees.length === 0) {
        historicalBaseFees.push(baseFee);
      }

      // Sort historical fees for confidence and trend calculations
      const sortedFees = [...historicalBaseFees].sort((a, b) => 
        a.sub(b).isNegative() ? -1 : 1
      );

      // Calculate confidence levels (low, medium, high) based on sorted fees
      const confidence = {
        low: sortedFees[0] || baseFee,
        medium: sortedFees[Math.floor(sortedFees.length / 2)] || baseFee,
        high: sortedFees[sortedFees.length - 1] || baseFee
      };

      // Calculate historical trends (average, median, percentile90)
      const average = historicalBaseFees.length > 0
        ? historicalBaseFees.reduce((acc, fee) => acc.add(fee), BigNumber.from(0))
            .div(BigNumber.from(historicalBaseFees.length)) // Average fee
        : baseFee;

      const median = sortedFees[Math.floor(sortedFees.length / 2)] || baseFee;
      const percentile90 = sortedFees[Math.floor(sortedFees.length * 0.9)] || baseFee;

      // Calculate estimated cost based on maxFeePerGas and gasLimit
      const estimatedCost = maxFeePerGas.mul(gasLimit);

      // Construct the gas estimation result
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
          likely: 15, // Likely time for transaction to confirm (in minutes)
          fast: 30,   // Fast confirmation time (in minutes)
          urgent: 60  // Urgent confirmation time (in minutes)
        }
      };

      setEstimation(estimationResult);
      setError(null);
      onSuccess?.(estimationResult); // Call success callback if provided
      
    } catch (err: any) {
      const error = new Error(err.message || 'Failed to estimate gas');
      setError(error);
      onError?.(error); // Call error callback if provided
    } finally {
      setLoading(false);
    }
  }, [provider, historicalBlocks, priorityFeeBump, onError, onSuccess]);

  // Auto-refresh gas estimation at specified interval
  useEffect(() => {
    if (provider) {
      estimateGas();
      const interval = setInterval(estimateGas, refreshInterval);
      return () => clearInterval(interval as NodeJS.Timeout); // Cleanup interval on unmount
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





// const App = () => {
  // Connect to a local Ethereum node (Ganache)
  // const provider = new ethers.providers.JsonRpcProvider('https://sepolia.infura.io/v3/96a5eaee541f4b9ba92d115040b83a53');
// 
//   const {
//     loading,
//     error,
//     estimation,
//     estimateGas,
//     blockHistory,
//   } = useGasEstimator({
//     provider,
//     refreshInterval: 15000, // Refresh every 15 seconds
//     historicalBlocks: 10, // Use fewer blocks for faster results in local testing
//     priorityFeeBump: 5, // Smaller bump for testing
//     onError: (err) => console.error('Gas estimation error:', err),
//     onSuccess: (estimation) => console.log('Gas estimation success:', estimation),
//   });

//   return (
//     <div style={{ padding: '20px' }}>
//       <h1>Gas Estimator</h1>
//       {loading && <p>Loading gas estimation...</p>}
//       {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
//       {estimation && (
//         <div>
//           <h2>Gas Estimation</h2>
//           <p>Base Fee: {estimation.baseFee.toString()}</p>
//           <p>Max Fee Per Gas: {estimation.maxFeePerGas.toString()}</p>
//           <p>Max Priority Fee Per Gas: {estimation.maxPriorityFeePerGas.toString()}</p>
//           <p>Gas Limit: {estimation.gasLimit.toString()}</p>
//           <p>Estimated Cost: {estimation.estimatedCost.toString()}</p>

//           <h3>Confidence Levels</h3>
//           <p>Low: {estimation.confidence.low.toString()}</p>
//           <p>Medium: {estimation.confidence.medium.toString()}</p>
//           <p>High: {estimation.confidence.high.toString()}</p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default App;


