import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { configureChains, createConfig } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { PrivyWagmiConnector } from '@privy-io/wagmi-connector';

const configureChainsConfig = configureChains([sepolia], [publicProvider()]);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [new PrivyWagmiConnector({ chains: configureChainsConfig.chains })],
  ...configureChainsConfig,
});

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <PrivyProvider
      appId={process.env.REACT_APP_PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#3b82f6',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        defaultChain: sepolia,
        supportedChains: [sepolia],
        fundingMethodConfig: {
          moonpay: {
            useSandbox: true,
          },
        },
      }}
    >
      <WagmiConfig config={wagmiConfig}>
        <App />
      </WagmiConfig>
    </PrivyProvider>
  </React.StrictMode>
);
