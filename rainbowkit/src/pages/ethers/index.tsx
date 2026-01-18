import { useEffect, useState } from 'react';
import { parseUnits } from 'viem';
import { sepolia } from 'viem/chains';
import Link from 'next/link';
import { useEthersSigner } from '../../hooks/useEthersSigner';
import { useUsdcContract } from '../../hooks/useContract';
import { RECEIVER_ADDRESS, USDC_CONTRACT_ADDRESS } from '../../utils';

export default function Page() {
  const [balance, setBalance] = useState('');
  const [loading, setLoading] = useState(false);
  const [transferStatus, setTransferStatus] = useState('');
  const [tokenInfo, setTokenInfo] = useState({ name: '', symbol: '', decimals: 0 });

  const signer = useEthersSigner({ chainId: sepolia.id });
  const usdcContract = useUsdcContract(signer);

  const handleTransfer = async () => {
    try {
      setLoading(true);
      setTransferStatus('发送中...');

      // 转账 1 USDC 到指定地址
      const tx = await usdcContract.transfer(
        RECEIVER_ADDRESS,
        parseUnits('1', 6), // USDC 有 6 位小数
      );

      if (tx.wait) {
        setTransferStatus('处理中...');
        const res = await tx.wait();
        console.log(res, 'transfer');
        setTransferStatus('转账成功');
      }
    } catch (error) {
      console.error('转账失败:', error);
      setTransferStatus('转账失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const getTokenInfo = async () => {
      try {
        if (usdcContract) {
          // 获取代币信息
          const [name, symbol, decimals, balance] = await Promise.all([
            usdcContract.name(),
            usdcContract.symbol(),
            usdcContract.decimals(),
            signer ? usdcContract.balanceOf(signer.getAddress()) : '0',
          ]);

          setTokenInfo({ name, symbol, decimals });
          setBalance(balance.toString());
        }
      } catch (error) {
        console.error('获取代币信息失败:', error);
      }
    };

    if (usdcContract) {
      getTokenInfo();
    }
  }, [usdcContract, signer]);

  // 获取转账状态文本
  const getTransferStatusText = () => {
    if (transferStatus === '转账成功') return '✅ 转账成功';
    if (transferStatus === '转账失败') return '❌ 转账失败';
    if (transferStatus === '处理中...') return '⏳ 转账处理中...';
    if (transferStatus === '发送中...') return '⏳ 转账发送中...';
    return '';
  };

  // 获取按钮文本
  const getButtonText = () => {
    if (loading) return '⏳ 转账中...';
    return '💸 转账 1 USDC';
  };

  return (
    <div className='container'>
      {/* 导航链接 */}
      <div className='mb-20'>
        <Link href='/ethers/demo' style={{ color: '#007bff', textDecoration: 'none' }}>
          🔗 前往 Ethers.js 核心功能演示页面 →
        </Link>
      </div>

      <h1 className='card-header'>Ethers.js 操作演示</h1>

      {/* 当前状态面板 */}
      <div className='status-panel mb-20'>
        <h3 className='text-muted mb-20'>📊 当前状态:</h3>
        <div className='status-grid'>
          <div className='status-item'>
            <strong>🌐 网络:</strong> Sepolia 测试网
          </div>
          <div className='status-item'>
            <strong>🔗 连接状态:</strong>
            <span
              className={`status-indicator ${signer ? 'status-connected' : 'status-disconnected'}`}
            >
              {signer ? '✅ 已连接' : '❌ 未连接'}
            </span>
          </div>
          <div className='status-item'>
            <strong>💰 代币名称:</strong> {tokenInfo.name || '加载中...'}
          </div>
          <div className='status-item'>
            <strong>🔤 代币符号:</strong> {tokenInfo.symbol || '加载中...'}
          </div>
          <div className='status-item'>
            <strong>🏦 合约地址:</strong> {USDC_CONTRACT_ADDRESS.substring(0, 8)}...
          </div>
          <div className='status-item'>
            <strong>💳 我的余额:</strong> {balance ? `${balance} ${tokenInfo.symbol}` : '加载中...'}
          </div>
          <div className='status-item'>
            <strong>🎯 接收地址:</strong> {RECEIVER_ADDRESS.substring(0, 8)}...
          </div>
        </div>

        {!signer && <div className='message message-info mt-20'>💡 请先连接钱包使用 USDC 功能</div>}
      </div>

      {/* 操作面板 */}
      <div className='flex mb-20'>
        <button onClick={handleTransfer} disabled={loading || !signer} className='btn btn-primary'>
          {getButtonText()}
        </button>
      </div>

      <div className='status-panel mb-20'>
        <h3 className='text-muted mb-20'>📈 交易状态</h3>

        {/* 转账状态显示 */}
        {getTransferStatusText() && (
          <div
            className={`message ${
              transferStatus === '转账成功'
                ? 'message-success'
                : transferStatus === '转账失败'
                  ? 'message-error'
                  : 'message-info'
            }`}
          >
            {getTransferStatusText()}
          </div>
        )}
      </div>
    </div>
  );
}
