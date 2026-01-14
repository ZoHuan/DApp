import { useState } from 'react';

import { Box, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';

import { formatUnits, parseEther } from 'viem';
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useSendTransaction,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';

import SignMessage from '../../components/wagmi/SignMessage';
import Transfer from '../../components/wagmi/TransferNativeCurrency';
import { stakeAbi } from '../../abis/stakeAbi';
import { Pid, RccStakeContract } from '../../utils';

export default function Page() {
  const [loading, setLoading] = useState(false);
  const account = useAccount();

  // 合约读取 - 用户质押余额
  const result = useReadContract({
    abi: stakeAbi,
    address: RccStakeContract,
    functionName: 'stakingBalance',
    args: [BigInt(Pid), account.address!],
    query: { enabled: Boolean(account.address) },
  });

  // 合约读取 - 多合约调用（区块信息）
  const resArr = useReadContracts({
    contracts: [
      {
        abi: stakeAbi,
        address: RccStakeContract,
        functionName: 'endBlock',
      },
      {
        abi: stakeAbi,
        address: RccStakeContract,
        functionName: 'startBlock',
      },
    ],
  });

  // 合约写入
  const { writeContractAsync, status: writeStatus, data } = useWriteContract();

  // 交易确认
  const confirmRes = useWaitForTransactionReceipt({
    hash: data,
  });

  // 事件处理函数
  const handleStake = async () => {
    try {
      setLoading(true);
      const hash = await writeContractAsync({
        abi: stakeAbi,
        address: RccStakeContract,
        functionName: 'depositETH',
        value: parseEther('0.001'),
      });
      console.log(hash, 'hash');
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  // 调试日志
  console.log({ confirmRes });
  console.log({ multiCall: resArr });

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '800px',
        margin: 'auto',
        mt: '40px',
        p: '30px',
        border: '1px solid #000',
      }}
    >
      <Typography component={'h3'}>Deposit</Typography>

      {/* 质押信息显示 */}
      <Box>Staked Amount: {result.data && formatUnits(result.data, 18)}ETH</Box>

      {/* 质押按钮 */}
      <Box>
        <LoadingButton loading={loading} onClick={handleStake} variant='contained'>
          Stake 0.001
        </LoadingButton>
      </Box>

      {/* 其他功能组件 */}
      <Box mt='20px' width={'100%'} display={'flex'} flexDirection={'column'} alignItems={'center'}>
        <SignMessage />
        <Transfer />
      </Box>
    </Box>
  );
}
