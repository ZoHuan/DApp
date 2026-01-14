import { useState } from 'react';
import { Box, Button } from '@mui/material';
import { useReadContracts, useSignMessage } from 'wagmi';

const SignMessage = () => {
  const { signMessageAsync } = useSignMessage();
  const [signature, setSignature] = useState('');
  const handleSign = async () => {
    try {
      const res = await signMessageAsync({ message: 'hello world' });
      console.log(res, 'res');
      setSignature(res);
    } catch (error) {
      console.log(error, 'error');
    }
  };
  return (
    <Box p='20px' sx={{ border: '1px solid #888', width: '100%' }}>
      <Button variant='outlined' onClick={handleSign}>
        sign 'hello world'
      </Button>
      <Box sx={{ wordBreak: 'break-all', mt: '10px' }}>signedMessage: {signature}</Box>
    </Box>
  );
};

export default SignMessage;
