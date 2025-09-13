import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PrivyProvider } from '@privy-io/react-auth';

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
        defaultChain: {
          id: 11155111,
          name: 'Sepolia',
          network: 'sepolia',
          nativeCurrency: {
            decimals: 18,
            name: 'Ethereum',
            symbol: 'ETH',
          },
          rpcUrls: {
            default: {
              http: ['https://sepolia.infura.io/v3/'],
            },
            public: {
              http: ['https://sepolia.infura.io/v3/'],
            },
          },
          blockExplorers: {
            default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
          },
        },
      }}
    >
      <App />
    </PrivyProvider>
  </React.StrictMode>
);
