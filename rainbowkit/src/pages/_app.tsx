import '../styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import Header from '../components/Header';

import { config } from '../wagmi';
import { ThemeProvider, createTheme } from '@mui/material';

const client = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
  const customTheme = createTheme({
    palette: { mode: 'light' },
    typography: {
      fontFamily:
        'Titillium Web,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif,Hanson',
    },
  });

  return (
    <ThemeProvider theme={customTheme}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={client}>
          <RainbowKitProvider>
            <Header />
            <Component {...pageProps} />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}

export default MyApp;
