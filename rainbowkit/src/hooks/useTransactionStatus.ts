import { useState, useCallback } from 'react';

export type TransferStatus = {
  type: 'none' | 'loading' | 'success' | 'error' | 'info';
  message: string;
};

export const useTransactionStatus = (initialStatus?: Partial<TransferStatus>) => {
  const [status, setStatus] = useState<TransferStatus>({
    type: 'none',
    message: '',
    ...initialStatus,
  });

  const updateStatus = useCallback((newStatus: Partial<TransferStatus>) => {
    setStatus((prev) => ({ ...prev, ...newStatus }));
  }, []);

  const reset = useCallback(() => {
    setStatus({ type: 'none', message: '' });
  }, []);

  return {
    status,
    updateStatus,
    reset,
  };
};
