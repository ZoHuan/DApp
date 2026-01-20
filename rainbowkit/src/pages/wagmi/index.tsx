import { useState, useEffect } from 'react';
import { formatUnits, parseEther, parseUnits } from 'viem';
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useSendTransaction,
  useWaitForTransactionReceipt,
  useWriteContract,
  useSignMessage,
} from 'wagmi';
import { ERC20_ABI } from '../../abis/abi';
import { USDC_CONTRACT_ADDRESS, RECEIVER_ADDRESS } from '../../utils';
import { useTransactionStatus } from '../../hooks/useTransactionStatus';

export default function WagmiPage() {
  const account = useAccount();

  const [isUsdcTransferring, setIsUsdcTransferring] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [signature, setSignature] = useState('');
  const [isEthTransferring, setIsEthTransferring] = useState(false);

  const {
    status: usdcStatus,
    updateStatus: updateUsdcStatus,
    reset: resetUsdcStatus,
  } = useTransactionStatus();
  const {
    status: ethStatus,
    updateStatus: updateEthStatus,
    reset: resetEthStatus,
  } = useTransactionStatus();

  // 代币信息查询
  const tokenInfoQuery = useReadContracts({
    contracts: [
      {
        abi: ERC20_ABI,
        address: USDC_CONTRACT_ADDRESS,
        functionName: 'name',
      },
      {
        abi: ERC20_ABI,
        address: USDC_CONTRACT_ADDRESS,
        functionName: 'symbol',
      },
      {
        abi: ERC20_ABI,
        address: USDC_CONTRACT_ADDRESS,
        functionName: 'decimals',
      },
      {
        abi: ERC20_ABI,
        address: USDC_CONTRACT_ADDRESS,
        functionName: 'totalSupply',
      },
    ],
  });

  // 余额查询
  const balanceQuery = useReadContract({
    abi: ERC20_ABI,
    address: USDC_CONTRACT_ADDRESS,
    functionName: 'balanceOf',
    args: [account.address!],
    query: { enabled: Boolean(account.address) },
  });

  // USDC转账
  const { writeContractAsync, data: usdcTxHash } = useWriteContract();
  const { status: usdcTxStatus } = useWaitForTransactionReceipt({
    hash: usdcTxHash,
  });

  // ETH转账
  const { sendTransaction, data: ethTxHash } = useSendTransaction();
  const { status: ethTxStatus } = useWaitForTransactionReceipt({
    hash: ethTxHash,
  });

  // 消息签名Hook
  const { signMessageAsync } = useSignMessage();

  // USDC转账处理函数
  const handleUsdcTransfer = async () => {
    if (!account.isConnected) return;

    try {
      setIsUsdcTransferring(true);
      updateUsdcStatus({ type: 'loading', message: '⏳ USDC转账处理中...' });

      const hash = await writeContractAsync({
        abi: ERC20_ABI,
        address: USDC_CONTRACT_ADDRESS,
        functionName: 'transfer',
        args: [RECEIVER_ADDRESS, parseUnits('1', 6)],
      });
      console.log('USDC转账哈希:', hash);
    } catch (error) {
      console.error('USDC转账失败:', error);
      updateUsdcStatus({
        type: 'error',
        message: `❌ USDC转账失败: ${error instanceof Error ? error.message : '未知错误'}`,
      });
    } finally {
      setIsUsdcTransferring(false);
    }
  };

  // ETH转账处理函数
  const handleEthTransfer = () => {
    if (!account.isConnected) return;

    setIsEthTransferring(true);
    updateEthStatus({ type: 'loading', message: '⏳ ETH转账发送中...' });

    sendTransaction({
      to: RECEIVER_ADDRESS,
      value: parseEther('0.001'),
    });
  };

  // 消息签名处理
  const handleSign = async () => {
    if (!account.isConnected) return;

    try {
      const sig = await signMessageAsync({ message: 'hello world' });
      console.log('签名结果:', sig);
      setSignature(sig);
    } catch (error) {
      console.error('签名失败:', error);
    }
  };

  // 更新代币信息
  useEffect(() => {
    if (tokenInfoQuery.data) {
      const [name, symbol, decimals, totalSupply] = tokenInfoQuery.data;
      if (name.result && symbol.result && decimals.result) {
        setTokenInfo({
          name: name.result,
          symbol: symbol.result,
          decimals: decimals.result,
          totalSupply: totalSupply.result,
        });
      }
    }
  }, [tokenInfoQuery.data]);

  // 监听USDC交易状态变化
  useEffect(() => {
    if (isUsdcTransferring && usdcTxStatus === 'pending') {
      updateUsdcStatus({ type: 'loading', message: '⏳ USDC转账处理中...' });
    } else if (usdcTxStatus === 'success') {
      updateUsdcStatus({ type: 'success', message: '✅ USDC转账成功' });
      setIsUsdcTransferring(false);
    } else if (usdcTxStatus === 'error') {
      updateUsdcStatus({ type: 'error', message: '❌ USDC转账失败' });
      setIsUsdcTransferring(false);
    }
  }, [isUsdcTransferring, usdcTxStatus, updateUsdcStatus]);

  // 监听ETH交易状态变化
  useEffect(() => {
    if (isEthTransferring && ethTxStatus === 'pending') {
      updateEthStatus({ type: 'loading', message: '⏳ ETH转账处理中...' });
    } else if (ethTxStatus === 'success') {
      updateEthStatus({ type: 'success', message: '✅ ETH转账成功' });
      setIsEthTransferring(false);
    } else if (ethTxStatus === 'error') {
      updateEthStatus({ type: 'error', message: '❌ ETH转账失败' });
      setIsEthTransferring(false);
    }
  }, [isEthTransferring, ethTxStatus, updateEthStatus]);

  // 获取USDC按钮文本
  const getUsdcButtonText = () => {
    if (isUsdcTransferring) return '⏳ 转账中...';
    return '💸 转账 1 USDC';
  };

  // 获取ETH按钮文本
  const getEthButtonText = () => {
    if (isEthTransferring) return '⏳ 发送中...';
    return '🌟 转账 0.001 ETH';
  };

  // 根据状态类型获取对应的CSS类名
  const getStatusClassName = (type: string) => {
    switch (type) {
      case 'success':
        return 'message-success';
      case 'error':
        return 'message-error';
      case 'loading':
      case 'info':
        return 'message-info';
      default:
        return 'message-info';
    }
  };

  return (
    <div className='container'>
      <h1 className='card-header'>Wagmi 功能演示</h1>

      <div className='status-panel mb-20'>
        <h3 className='text-muted mb-20'>📊 当前状态:</h3>
        <div className='status-grid'>
          <div className='status-item'>
            <strong>🌐 钱包连接:</strong>
            <span
              className={`status-indicator ${account.isConnected ? 'status-connected' : 'status-disconnected'}`}
            >
              {account.isConnected ? '✅ 已连接' : '❌ 未连接'}
            </span>
          </div>
          <div className='status-item'>
            <strong>👤 账户:</strong>{' '}
            {account.address ? `${account.address.substring(0, 8)}...` : '未连接'}
          </div>
          <div className='status-item'>
            <strong>💵 USDC 余额:</strong>{' '}
            {balanceQuery.data && typeof balanceQuery.data === 'bigint'
              ? `${formatUnits(balanceQuery.data, 6)} USDC`
              : '0 USDC'}
          </div>
          <div className='status-item'>
            <strong>🔐 签名状态:</strong>
            <span
              className={`status-indicator ${signature ? 'status-connected' : 'status-disconnected'}`}
            >
              {signature ? '✅ 已签名' : '❌ 未签名'}
            </span>
          </div>
        </div>

        {!account.isConnected && (
          <div className='message message-info mt-20'>💡 请先连接钱包使用 Wagmi 功能</div>
        )}
      </div>

      {/* 代币信息 */}
      <div className='status-panel mb-20'>
        <h3 className='text-muted mb-20'>📋 代币信息</h3>
        {tokenInfoQuery.isLoading && (
          <div className='message message-info'>⏳ 正在加载代币信息...</div>
        )}
        {tokenInfoQuery.isError && (
          <div className='message message-error'>❌ 代币信息读取失败，请检查合约地址是否正确</div>
        )}
        {tokenInfo && (
          <div className='status-grid'>
            <div className='status-item'>
              <strong>📄 代币名称:</strong> {tokenInfo.name}
            </div>
            <div className='status-item'>
              <strong>🔤 代币符号:</strong> {tokenInfo.symbol}
            </div>
            <div className='status-item'>
              <strong>🔢 小数位数:</strong> {tokenInfo.decimals}
            </div>
            <div className='status-item'>
              <strong>🏦 合约地址:</strong> {USDC_CONTRACT_ADDRESS.substring(0, 8)}...
            </div>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className='flex mb-20'>
        {/* USDC转账按钮 */}
        <button
          onClick={handleUsdcTransfer}
          disabled={isUsdcTransferring || usdcStatus.type === 'loading' || !account.isConnected}
          className='btn btn-primary'
        >
          {getUsdcButtonText()}
        </button>

        <button onClick={handleSign} disabled={!account.isConnected} className='btn btn-secondary'>
          ✍️ 签名消息
        </button>

        {/* ETH转账按钮 */}
        <button
          onClick={handleEthTransfer}
          disabled={isEthTransferring || ethStatus.type === 'loading' || !account.isConnected}
          className='btn btn-success'
        >
          {getEthButtonText()}
        </button>
      </div>

      {/* USDC交易状态 */}
      {usdcStatus.type !== 'none' && (
        <div className='status-panel mb-20'>
          <h3 className='text-muted mb-20'>💵 USDC交易状态</h3>
          <div className={`message ${getStatusClassName(usdcStatus.type)}`}>
            {usdcStatus.message}
          </div>
        </div>
      )}

      {/* ETH交易状态 */}
      {ethStatus.type !== 'none' && (
        <div className='status-panel mb-20'>
          <h3 className='text-muted mb-20'>💰 ETH交易状态</h3>
          <div className={`message ${getStatusClassName(ethStatus.type)}`}>{ethStatus.message}</div>
        </div>
      )}

      {/* 签名结果 */}
      {signature && (
        <div className='status-panel mb-20'>
          <h3 className='text-muted mb-20'>🔏 签名结果</h3>
          <div className='message message-info' style={{ wordBreak: 'break-all' }}>
            <strong>📄 签名内容:</strong> "hello world"
            <br />
            <strong>🔐 签名结果:</strong> {signature}
          </div>
        </div>
      )}
    </div>
  );
}
