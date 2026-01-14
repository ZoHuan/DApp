import { Box, Button } from '@mui/material';
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';

const Transfer = () => {
  const { sendTransaction, data } = useSendTransaction();
  const { status, data: txData } = useWaitForTransactionReceipt({
    hash: data,
  });
  const handleTransfer = () => {
    const res = sendTransaction({
      to: '0x756A6aa43547fA8cCF02ab417E6c4c4747137346',
      value: parseEther('0.001'),
    });
  };
  console.log(status, 'status', data, 'data', txData, 'txData');
  return (
    <Box p='20px' sx={{ border: '1px solid #888', width: '100%' }}>
      <Button onClick={handleTransfer} variant='contained'>
        Transfer 0.001 ETH
      </Button>
    </Box>
  );
};

export default Transfer;
