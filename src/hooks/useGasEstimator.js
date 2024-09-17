import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export const useGasEstimator = (provider, transaction) => {
    const [gasEstimate, setGasEstimate] = useState(null);

    useEffect(() => {
        const estimateGas = async () => {
            if (provider && transaction) {
                try {
                    const gas = await provider.estimateGas(transaction);
                    setGasEstimate(ethers.utils.formatUnits(gas, 'gwei'));
                } catch (error) {
                    console.error('Gas estimation failed', error);
                    setGasEstimate(null);
                }
            }
        };

        estimateGas();
    }, [provider, transaction]);

    return gasEstimate;
};