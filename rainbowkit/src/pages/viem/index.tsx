import { useState, useEffect, useRef } from 'react';
import {
  createPublicClient,
  createWalletClient,
  custom,
  formatEther,
  formatUnits,
  http,
  parseEther,
  parseUnits,
  type Address,
  type WalletClient,
} from 'viem';
import { mainnet, sepolia } from 'viem/chains';

import { ERC20_ABI } from '../../abis/abi';
import { useTransactionStatus } from '../../hooks/useTransactionStatus';
import { USDC_CONTRACT_ADDRESS, RECEIVER_ADDRESS } from '../../utils';

// 以太坊主网公共客户端
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.NEXT_PUBLIC_MAINNET_RPC_URL),
});

// Sepolia测试网公共客户端
const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
});

export default function ViemPage() {
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [account, setAccount] = useState<Address | null>(null);
  const [ethBalance, setEthBalance] = useState<string>('0');
  const [usdcBalance, setUsdcBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [transferEvents, setTransferEvents] = useState<any[]>([]);
  const [isListening, setIsListening] = useState(false);
  const unwatchRef = useRef<(() => void) | null>(null);

  // Hooks - 状态管理和交易状态
  const { status: transferStatus, updateStatus } = useTransactionStatus();

  // 📖 任务1: 连接钱包并获取账户地址
  const connectWallet = async () => {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        const client = createWalletClient({
          chain: sepolia,
          transport: custom(window.ethereum),
        });

        const [address] = await client.getAddresses();
        setWalletClient(client);
        setAccount(address);
        // 获取余额
        await getBalances(address);

        updateStatus({
          type: 'success',
          message: '✅ 钱包连接成功',
        });
      } else {
        updateStatus({
          type: 'error',
          message: '❌ 请安装 MetaMask 或其他以太坊钱包',
        });
      }
    } catch (error) {
      console.error('连接钱包失败:', error);
      updateStatus({
        type: 'error',
        message: '❌ 连接钱包失败',
      });
    }
  };

  // 📖 任务1: 查询地址余额
  const getBalances = async (address: Address) => {
    try {
      // 查询ETH余额
      const balance = await sepoliaClient.getBalance({ address });
      setEthBalance(formatEther(balance));

      // 📖 任务3: 调用ERC-20合约的balanceOf方法
      const usdcBalance = await sepoliaClient.readContract({
        address: USDC_CONTRACT_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address],
      });
      setUsdcBalance(formatUnits(usdcBalance as bigint, 6));
    } catch (error) {
      console.error('查询余额失败:', error);
    }
  };

  // 📖 任务4: 监听ERC-20合约的Transfer事件
  const startListeningTransferEvents = async () => {
    if (!account || isListening) return;

    try {
      setIsListening(true);
      console.log('开始监听Transfer事件...');

      const unwatch = sepoliaClient.watchContractEvent({
        address: USDC_CONTRACT_ADDRESS,
        abi: ERC20_ABI,
        eventName: 'Transfer',
        onLogs: (logs) => {
          console.log('监听到Transfer事件:', logs);
          setTransferEvents((prev) => [...prev, ...logs]);
          updateStatus({
            type: 'info',
            message: '📢 监听到新的Transfer事件',
          });
        },
        onError: (error) => {
          console.error('监听事件出错:', error);
        },
      });

      unwatchRef.current = unwatch;
    } catch (error) {
      console.error('开始监听失败:', error);
      setIsListening(false);
    }
  };

  // 停止监听事件
  const stopListeningTransferEvents = () => {
    if (unwatchRef.current) {
      unwatchRef.current();
      unwatchRef.current = null;
    }
    setIsListening(false);
    console.log('已停止监听Transfer事件');
  };

  // 📖 任务2: 使用WalletClient发送ETH交易
  const sendEthTransaction = async () => {
    if (!walletClient || !account) {
      updateStatus({
        type: 'error',
        message: '❌ 请先连接钱包',
      });
      return;
    }

    try {
      setLoading(true);
      updateStatus({
        type: 'loading',
        message: '⏳ 发送ETH交易中...',
      });

      const hash = await walletClient.sendTransaction({
        account,
        to: RECEIVER_ADDRESS,
        value: parseEther('0.001'),
        chain: sepolia,
      });

      updateStatus({
        type: 'loading',
        message: '⏳ 交易已发送，等待确认...',
      });

      // 等待交易确认
      const receipt = await sepoliaClient.waitForTransactionReceipt({ hash });

      if (receipt.status === 'success') {
        updateStatus({
          type: 'success',
          message: '✅ ETH交易成功',
        });
        // 更新余额
        await getBalances(account);
      } else {
        updateStatus({
          type: 'error',
          message: '❌ ETH交易失败',
        });
      }
    } catch (error) {
      console.error('ETH交易失败:', error);
      updateStatus({
        type: 'error',
        message: '❌ ETH交易失败',
      });
    } finally {
      setLoading(false);
    }
  };

  // 发送USDC交易
  const sendUsdcTransaction = async () => {
    if (!walletClient || !account) {
      updateStatus({
        type: 'error',
        message: '❌ 请先连接钱包',
      });
      return;
    }

    try {
      setLoading(true);
      updateStatus({
        type: 'loading',
        message: '⏳ 发送USDC交易中...',
      });

      // 开始监听Transfer事件
      await startListeningTransferEvents();

      const hash = await walletClient.writeContract({
        account,
        address: USDC_CONTRACT_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [RECEIVER_ADDRESS, parseUnits('1', 6)],
        chain: sepolia,
      });

      updateStatus({
        type: 'loading',
        message: '⏳ USDC交易已发送，等待确认...',
      });

      // 等待交易确认
      const receipt = await sepoliaClient.waitForTransactionReceipt({ hash });

      if (receipt.status === 'success') {
        updateStatus({
          type: 'success',
          message: '✅ USDC交易成功',
        });
        // 更新余额
        await getBalances(account);
      } else {
        updateStatus({
          type: 'error',
          message: '❌ USDC交易失败',
        });
      }

      setTimeout(() => {
        stopListeningTransferEvents();
      }, 5000);
    } catch (error) {
      console.error('USDC交易失败:', error);
      updateStatus({
        type: 'error',
        message: '❌ USDC交易失败',
      });
      stopListeningTransferEvents();
    } finally {
      setLoading(false);
    }
  };

  // 组件卸载时清理监听器
  useEffect(() => {
    return () => {
      if (unwatchRef.current) {
        unwatchRef.current();
      }
    };
  }, []);

  // 组件挂载时检查是否已连接钱包
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            const client = createWalletClient({
              chain: sepolia,
              transport: custom(window.ethereum),
            });
            setWalletClient(client);
            setAccount(accounts[0] as Address);
            await getBalances(accounts[0] as Address);
          }
        } catch (error) {
          console.error('检查连接状态失败:', error);
        }
      }
    };

    checkConnection();
  }, []);

  // 根据状态类型获取对应的CSS类名
  const getStatusClassName = (status: string) => {
    switch (status) {
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
      <h1 className='card-header'>Viem 📖 功能演示</h1>

      {/* 当前状态面板 */}
      <div className='status-panel mb-20'>
        <h3 className='text-muted mb-20'>📊 当前状态:</h3>
        <div className='status-grid'>
          <div className='status-item'>
            <strong>🌐 网络:</strong> Sepolia 测试网
          </div>
          <div className='status-item'>
            <strong>🔗 钱包连接:</strong>
            <span
              className={`status-indicator ${account ? 'status-connected' : 'status-disconnected'}`}
            >
              {account ? '✅ 已连接' : '❌ 未连接'}
            </span>
          </div>
          <div className='status-item'>
            <strong>👤 账户地址:</strong> {account ? `${account.substring(0, 8)}...` : '未连接'}
          </div>
          <div className='status-item'>
            <strong>💰 ETH 余额:</strong> {ethBalance} ETH
          </div>
          <div className='status-item'>
            <strong>💵 USDC 余额:</strong> {usdcBalance} USDC
          </div>
          <div className='status-item'>
            <strong>🎯 接收地址:</strong> {RECEIVER_ADDRESS.substring(0, 8)}...
          </div>
          <div className='status-item'>
            <strong>🔍 事件监听:</strong>
            <span
              className={`status-indicator ${isListening ? 'status-connected' : 'status-disconnected'}`}
            >
              {isListening ? '✅ 监听中' : '❌ 未监听'}
            </span>
          </div>
        </div>

        {!account && (
          <div className='message message-info mt-20'>💡 请先连接钱包使用 Viem 功能</div>
        )}
      </div>

      {/* 操作面板 */}
      <div className='flex mb-20'>
        {!account ? (
          <button onClick={connectWallet} className='btn btn-primary'>
            🔗 连接钱包
          </button>
        ) : (
          <>
            <button onClick={sendEthTransaction} disabled={loading} className='btn btn-primary'>
              {loading ? '⏳ 处理中...' : '💰 发送 0.001 ETH'}
            </button>

            <button onClick={sendUsdcTransaction} disabled={loading} className='btn btn-primary'>
              {loading ? '⏳ 处理中...' : '💵 发送 1 USDC'}
            </button>
          </>
        )}
      </div>

      {/* 交易状态 */}
      {transferStatus.type !== 'none' && (
        <div className='status-panel mb-20'>
          <h3 className='text-muted mb-20'>📈 交易状态</h3>
          <div className={`message ${getStatusClassName(transferStatus.type)}`}>
            {transferStatus.message}
          </div>
        </div>
      )}

      {/* Transfer事件列表 */}
      {transferEvents.length > 0 && (
        <div className='status-panel mb-20'>
          <h3 className='text-muted mb-20'>📢 Transfer 事件记录</h3>
          <div className='event-list'>
            {transferEvents
              .slice(-5)
              .reverse()
              .map((event, index) => (
                <div key={index} className='event-item'>
                  <strong>📄 事件 {transferEvents.length - index}:</strong>{' '}
                  {event.args?.from ? `从 ${event.args.from.substring(0, 8)}...` : ''}{' '}
                  {event.args?.to ? `到 ${event.args.to.substring(0, 8)}...` : ''}{' '}
                  {event.args?.value ? `金额 ${formatUnits(event.args.value, 6)} USDC` : ''}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
