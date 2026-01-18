import { useEffect, useState } from 'react';

import { Box } from '@mui/material';
import { LoadingButton } from '@mui/lab';

import { parseUnits } from 'viem';
import { sepolia } from 'viem/chains';

import { useEthersSigner } from '../../hooks/useEthersSigner';
import { useStakeContract } from '../../hooks/useContract';

export default function Page() {
  const [end, setEnd] = useState('');
  const [loading, setLoading] = useState(false);

  const signer = useEthersSigner({ chainId: sepolia.id });
  const stakeContract = useStakeContract(signer);

  const handleStake = async () => {
    try {
      setLoading(true);
      const tx = await stakeContract.depositETH({ value: parseUnits('0.1', 18) });
      if (tx.wait) {
        const res = await tx.wait();
        console.log(res, 'deposit');
      }
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const getStartBlock = async () => {
      const res = await stakeContract.endBlock();
      setEnd(Number(res).toString());
    };

    if (stakeContract) {
      getStartBlock();
    }
  }, [stakeContract.provider]);

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        mt: '20px',
      }}
    >
      {/* 区块信息显示 */}
      <Box>EndBlock: {end}</Box>

      {/* 质押按钮 */}
      <Box mt='10px'>
        <LoadingButton loading={loading} onClick={handleStake} variant='contained'>
          Stake 0.1
        </LoadingButton>
      </Box>
    </Box>
  );
}
