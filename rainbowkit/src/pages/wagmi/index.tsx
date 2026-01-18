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

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [signature, setSignature] = useState('');
  const [ethTransferSending, setEthTransferSending] = useState(false);

  const account = useAccount();

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
  const {
    status: usdcTxStatus,
    isSuccess: usdcTxIsSuccess,
    isError: usdcTxIsError,
    isLoading: usdcTxIsLoading,
  } = useWaitForTransactionReceipt({
    hash: usdcTxHash,
  });

  // USDC转账处理函数
  const handleUsdcTransfer = async () => {
    try {
      setLoading(true);
      const hash = await writeContractAsync({
        abi: ERC20_ABI,
        address: USDC_CONTRACT_ADDRESS,
        functionName: 'transfer',
        args: [RECEIVER_ADDRESS, parseUnits('1', 6)],
      });
      console.log('USDC转账哈希:', hash);
    } catch (error) {
      console.error('USDC转账失败:', error);
    }
    setLoading(false);
  };
  // 消息签名功能
  const { signMessageAsync } = useSignMessage();

  // 消息签名处理
  const handleSign = async () => {
    try {
      const sig = await signMessageAsync({ message: 'hello world' });
      console.log('签名结果:', sig);
      setSignature(sig);
    } catch (error) {
      console.error('签名失败:', error);
    }
  };

  // ETH转账
  const { sendTransaction, data: ethTxHash } = useSendTransaction();
  const {
    status: ethTxStatus,
    isSuccess: ethTxIsSuccess,
    isError: ethTxIsError,
    isLoading: ethTxIsLoading,
  } = useWaitForTransactionReceipt({
    hash: ethTxHash,
  });

  // ETH转账处理函数
  const handleEthTransfer = () => {
    setEthTransferSending(true);
    sendTransaction({
      to: RECEIVER_ADDRESS,
      value: parseEther('0.001'),
    });
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

  // 获取USDC转账状态文本
  const getUsdcStatusText = () => {
    if (usdcTxIsLoading) return '⏳ USDC转账处理中...';
    if (usdcTxIsSuccess) return '✅ USDC转账成功';
    if (usdcTxIsError) return '❌ USDC转账失败';
    return '';
  };

  // 获取ETH转账状态文本
  const getEthStatusText = () => {
    if (ethTransferSending && ethTxIsLoading) return '⏳ ETH转账处理中...';
    if (ethTxIsSuccess) return '✅ ETH转账成功';
    if (ethTxIsError) return '❌ ETH转账失败';
    if (ethTransferSending) return '⏳ ETH转账发送中...';
    return '';
  };

  // 获取USDC按钮文本
  const getUsdcButtonText = () => {
    if (loading) return '⏳ 转账中...';
    if (usdcTxIsLoading) return '⏳ 处理中...';
    return '💸 转账 1 USDC';
  };

  // 获取ETH按钮文本
  const getEthButtonText = () => {
    if (ethTransferSending) return '⏳ 发送中...';
    if (ethTxIsLoading) return '⏳ 处理中...';
    return '🌟 转账 0.001 ETH';
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
          disabled={loading || usdcTxIsLoading || !account.isConnected}
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
          disabled={ethTransferSending || ethTxIsLoading || !account.isConnected}
          className='btn btn-success'
        >
          {getEthButtonText()}
        </button>
      </div>

      {/* 统一交易状态显示 */}
      <div className='status-panel mb-20'>
        <h3 className='text-muted mb-20'>📈 交易状态</h3>

        {/* USDC交易状态 */}
        {getUsdcStatusText() && (
          <div
            className={`message ${
              usdcTxIsSuccess ? 'message-success' : usdcTxIsError ? 'message-error' : 'message-info'
            }`}
          >
            {getUsdcStatusText()}
          </div>
        )}

        {/* ETH交易状态 */}
        {getEthStatusText() && (
          <div
            className={`message ${
              ethTxIsSuccess ? 'message-success' : ethTxIsError ? 'message-error' : 'message-info'
            }`}
          >
            {getEthStatusText()}
          </div>
        )}
      </div>

      {/* 签名结果 */}
      {signature && (
        <div className='status-panel mb-20'>
          <h3 className='text-muted mb-20'>🔐 签名结果</h3>
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
