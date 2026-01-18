import Link from 'next/link';
import { useRouter } from 'next/router';

const Header = () => {
  const router = useRouter();

  const navItems = [
    { href: '/', label: '首页' },
    { href: '/wagmi', label: 'Wagmi' },
    { href: '/ethers', label: 'Ethers' },
  ];

  return (
    <header className='header'>
      {/* 应用标题 */}
      <div className='header-title'>🌈 DApp Frontend</div>

      {/* 导航链接 */}
      <nav className='header-nav'>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`header-link ${router.pathname === item.href ? 'header-link-active' : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
};

export default Header;
