import { Contract, Signer } from 'ethers';
import { sepolia } from 'viem/chains';

import { USDC_CONTRACT_ADDRESS } from '../utils';
import { ERC20_ABI } from '../abis/abi';
import { useEthersProvider } from './useEthersProvider';

const useUsdcContract = (signer?: Signer) => {
  const provider = useEthersProvider({ chainId: sepolia.id });
  console.log(provider, 'provider');
  return new Contract(USDC_CONTRACT_ADDRESS, ERC20_ABI, signer || provider);
};

export { useUsdcContract };
