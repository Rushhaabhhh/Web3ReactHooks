import { renderHook, act } from '@testing-library/react-hooks';
import { ethers } from 'ethers';
import { useGasEstimator } from '../src/hooks/useGasEstimator';

// Mock the entire ethers library
jest.mock('ethers', () => ({
  utils: {
    formatUnits: jest.fn().mockReturnValue('0.021'),
  },
  BigNumber: {
    from: jest.fn().mockReturnValue('21000'),
  },
}));

describe('useGasEstimator', () => {
  let mockProvider;
  let mockTransaction;

  beforeEach(() => {
    mockProvider = {
      estimateGas: jest.fn(),
    };
    mockTransaction = {
      to: '0xAddress',
      value: '0x1',
    };
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it('should estimate gas correctly', async () => {
    mockProvider.estimateGas.mockResolvedValue('21000');

    const { result, waitForNextUpdate } = renderHook(() => useGasEstimator(mockProvider, mockTransaction));

    await waitForNextUpdate();

    expect(result.current).toBe('0.021');
    expect(mockProvider.estimateGas).toHaveBeenCalledWith(mockTransaction);
    expect(ethers.utils.formatUnits).toHaveBeenCalledWith('21000', 'gwei');
  });

  it('should handle errors gracefully', async () => {
    mockProvider.estimateGas.mockRejectedValue(new Error('Error estimating gas'));

    const { result, waitForNextUpdate } = renderHook(() => useGasEstimator(mockProvider, mockTransaction));

    await waitForNextUpdate();

    expect(result.current).toBeNull();
    expect(mockProvider.estimateGas).toHaveBeenCalledWith(mockTransaction);
    expect(console.error).toHaveBeenCalledWith('Gas estimation failed', expect.any(Error));
  });

  it('should not estimate gas when provider or transaction is missing', () => {
    const { result: result1 } = renderHook(() => useGasEstimator(null, mockTransaction));
    expect(result1.current).toBeNull();

    const { result: result2 } = renderHook(() => useGasEstimator(mockProvider, null));
    expect(result2.current).toBeNull();

    expect(mockProvider.estimateGas).not.toHaveBeenCalled();
  });
});