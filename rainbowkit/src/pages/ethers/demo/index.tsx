import { useState, useEffect } from 'react';
import { BrowserProvider, JsonRpcSigner, Contract, formatEther } from 'ethers';
import Link from 'next/link';

// 简化的 ERC20 合约 ABI
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
];

// 示例合约地址
const DAI_CONTRACT_ADDRESS = '0x6b175474e89094c44da98b954eedeac495271d0f';

export default function EthersDemo() {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [account, setAccount] = useState<string>('');
  const [balance, setBalance] = useState<string>('0');
  const [contractInfo, setContractInfo] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [network, setNetwork] = useState<string>('');

  // 1. 初始化 Provider
  const initProvider = async () => {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        const web3Provider = new BrowserProvider(window.ethereum);
        setProvider(web3Provider);
        setMessage('✅ Provider 初始化成功');

        // 获取网络信息
        const networkInfo = await web3Provider.getNetwork();
        setNetwork(networkInfo.name);

        return web3Provider;
      } else {
        setMessage('❌ 请安装 MetaMask 或其他以太坊钱包');
      }
    } catch (error) {
      console.error('初始化 Provider 失败:', error);
      setMessage('❌ 初始化 Provider 失败');
    }
    return null;
  };

  // 2. 连接钱包获取 Signer
  const connectWallet = async () => {
    try {
      if (!provider) {
        setMessage('❌ 请先初始化 Provider');
        return;
      }

      setLoading(true);

      // 请求账户连接
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // 获取 Signer
      const signerInstance = await provider.getSigner();
      setSigner(signerInstance);

      // 获取账户地址
      const address = await signerInstance.getAddress();
      setAccount(address);
      setMessage(`✅ 钱包连接成功: ${address.substring(0, 8)}...`);

      // 获取余额
      const balanceWei = await provider.getBalance(address);
      setBalance(formatEther(balanceWei));

      // 初始化合约
      await initContract(signerInstance);
    } catch (error) {
      console.error('连接钱包失败:', error);
      setMessage('❌ 连接钱包失败');
    } finally {
      setLoading(false);
    }
  };

  // 3. 初始化 Contract
  const initContract = async (signerInstance: JsonRpcSigner) => {
    try {
      const contractInstance = new Contract(DAI_CONTRACT_ADDRESS, ERC20_ABI, signerInstance);
      setContract(contractInstance);

      // 获取合约信息
      const name = await contractInstance.name();
      const symbol = await contractInstance.symbol();
      const decimals = await contractInstance.decimals();

      setContractInfo({
        name,
        symbol,
        decimals: decimals.toString(),
      });

      setMessage(`✅ 合约 ${name} (${symbol}) 初始化成功`);
    } catch (error) {
      console.error('初始化合约失败:', error);
      setMessage('❌ 初始化合约失败 - 请检查网络和合约地址');
    }
  };

  // 4. 读取合约数据
  const readContractData = async () => {
    if (!contract || !account) {
      setMessage('❌ 请先连接钱包');
      return;
    }

    try {
      setLoading(true);

      // 读取代币余额
      const tokenBalance = await contract.balanceOf(account);
      const formattedBalance = formatEther(tokenBalance);

      setMessage(`📊 您的代币余额: ${formattedBalance} ${contractInfo?.symbol}`);
    } catch (error) {
      console.error('读取合约数据失败:', error);
      setMessage('❌ 读取合约数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时初始化 Provider
  useEffect(() => {
    initProvider();
  }, []);

  return (
    <div className='container'>
      <div className='mb-20'>
        <Link href='/ethers' style={{ color: '#007bff', textDecoration: 'none' }}>
          ← 返回 Ethers 主页面
        </Link>
      </div>

      <h1 className='card-header'>Ethers.js Provider/Signer/Contract 核心功能演示</h1>

      {/* 状态面板 */}
      <div className='status-panel'>
        <h3 className='text-muted mb-20'>📊 当前状态:</h3>
        <div className='status-grid'>
          <div className='status-item'>
            <strong>🌐 Provider:</strong>
            <span
              className={`status-indicator ${provider ? 'status-connected' : 'status-disconnected'}`}
            >
              {provider ? '✅ 已连接' : '❌ 未连接'}
            </span>
          </div>
          <div className='status-item'>
            <strong>🔑 Signer:</strong>
            <span
              className={`status-indicator ${signer ? 'status-connected' : 'status-disconnected'}`}
            >
              {signer ? '✅ 已连接' : '❌ 未连接'}
            </span>
          </div>
          <div className='status-item'>
            <strong>📄 Contract:</strong>
            <span
              className={`status-indicator ${contract ? 'status-connected' : 'status-disconnected'}`}
            >
              {contract ? '✅ 已初始化' : '❌ 未初始化'}
            </span>
          </div>
          <div className='status-item'>
            <strong>👤 账户:</strong> {account ? `${account.substring(0, 8)}...` : '未连接'}
          </div>
          <div className='status-item'>
            <strong>💰 ETH 余额:</strong> {balance} ETH
          </div>
          <div className='status-item'>
            <strong>🌍 网络:</strong> {network || '未知'}
          </div>
        </div>

        {contractInfo && (
          <div className='message message-info mt-10'>
            <strong>📋 合约信息:</strong> {contractInfo.name} ({contractInfo.symbol}) - 小数位:{' '}
            {contractInfo.decimals}
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className='flex mb-20'>
        <button onClick={initProvider} className='btn btn-info'>
          🌐 初始化 Provider
        </button>

        <button onClick={connectWallet} disabled={loading || !provider} className='btn btn-primary'>
          {loading ? '⏳ 连接中...' : '🔗 连接钱包'}
        </button>

        <button
          onClick={readContractData}
          disabled={!contract || loading}
          className='btn btn-success'
        >
          📊 读取合约数据
        </button>
      </div>

      {/* 消息显示 */}
      {message && (
        <div className={`message ${message.includes('❌') ? 'message-error' : 'message-success'}`}>
          {message}
        </div>
      )}
    </div>
  );
}
