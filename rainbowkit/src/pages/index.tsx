import type { NextPage } from 'next';
import Head from 'next/head';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { formatUnits } from 'viem';
import { useAccount, useBalance, useChains, useSwitchChain } from 'wagmi';
import { USDC_CONTRACT_ADDRESS } from '../utils/index';

const Home: NextPage = () => {
  const { address, isConnected, chain, chainId } = useAccount();
  const { data: ethBalance } = useBalance({ address });
  const { data: usdcBalance } = useBalance({
    address,
    token: USDC_CONTRACT_ADDRESS,
  });
  const { switchChain } = useSwitchChain();
  const chains = useChains();

  const formatWalletAddress = (walletAddress: string | undefined) => {
    if (!walletAddress) return '未连接';
    return `${walletAddress.substring(0, 8)}...${walletAddress.substring(walletAddress.length - 6)}`;
  };

  const availableChains = chains.filter((chain) => chain.id !== chainId);

  return (
    <>
      <Head>
        <title>DApp 前端演示 - RainbowKit</title>
        <meta
          content='基于 RainbowKit 的 DApp 前端演示，包含账户信息、网络切换、Ethers.js 和 Wagmi 功能示例'
          name='description'
        />
        <link href='/favicon.ico' rel='icon' />
      </Head>

      <div className='container'>
        {/* 页面标题 */}
        <h1 className='card-header'>RainbowKit DApp 演示</h1>

        {/* 钱包连接模块 */}
        <div className='status-panel mb-20'>
          <h3 className='text-muted mb-20'>🔗 RainbowKit 钱包连接</h3>
          <div className='text-center'>
            <ConnectButton />
          </div>
        </div>

        {/* 账户信息模块 */}
        <div className='status-panel mb-20'>
          <h3 className='text-muted mb-20'>📊 账户信息 (useAccount & useBalance)</h3>
          <div className='status-grid'>
            <div className='status-item'>
              <strong>🔑 钱包地址:</strong>
              <span className={address ? 'text-success' : 'text-muted'}>
                {formatWalletAddress(address)}
              </span>
            </div>

            {ethBalance && (
              <div className='status-item'>
                <strong>💰 ETH 余额:</strong>
                <span className='text-info'>{formatUnits(ethBalance.value, 18)} ETH</span>
                <small className='text-muted ml-10'>(原始值: {ethBalance.value.toString()})</small>
              </div>
            )}

            {usdcBalance && (
              <div className='status-item'>
                <strong>💵 USDC 余额:</strong>
                <span className='text-warning'>{formatUnits(usdcBalance.value, 6)} USDC</span>
                <small className='text-muted ml-10'>(原始值: {usdcBalance.value.toString()})</small>
              </div>
            )}
          </div>

          {!address && (
            <div className='message message-info mt-20'>💡 请先连接钱包查看账户信息</div>
          )}
        </div>

        {/* 网络切换模块 */}
        <div className='status-panel mb-20'>
          <h3 className='text-muted mb-20'>🌐 网络管理 (useSwitchChain)</h3>
          <div className='status-grid'>
            <div className='status-item'>
              <strong>🆔 当前网络ID:</strong>
              <span className={chainId ? 'text-success' : 'text-muted'}>{chainId || '未连接'}</span>
            </div>

            <div className='status-item'>
              <strong>🌍 当前网络:</strong>
              <span className={chain?.name ? 'text-info' : 'text-muted'}>
                {chain?.name || '未连接'}
              </span>
            </div>
          </div>

          {/* 网络切换按钮 */}
          {isConnected && availableChains.length > 0 && (
            <div className='mt-20'>
              <h4 className='text-muted mb-10'>切换到其他网络:</h4>
              <div className='flex' style={{ flexWrap: 'wrap', gap: '10px' }}>
                {availableChains.map((availableChain) => (
                  <button
                    key={availableChain.id}
                    onClick={() => switchChain({ chainId: availableChain.id })}
                    className='btn btn-secondary'
                    style={{ fontSize: '12px', padding: '8px 12px' }}
                  >
                    🌐 切换到 {availableChain.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isConnected && (
            <div className='message message-info mt-10'>💡 请先连接钱包进行网络切换</div>
          )}
        </div>
      </div>
    </>
  );
};

export default Home;
