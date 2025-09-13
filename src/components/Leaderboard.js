import React, { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useContractRead } from 'wagmi';

// Contract ABI for leaderboard functions
const HANGMAN_ABI = [
  {
    "inputs": [{"name": "limit", "type": "uint256"}],
    "name": "getLeaderboard",
    "outputs": [
      {"name": "", "type": "address[]"},
      {"name": "", "type": "tuple[]", "components": [
        {"name": "totalGames", "type": "uint256"},
        {"name": "gamesWon", "type": "uint256"},
        {"name": "totalScore", "type": "uint256"},
        {"name": "highestScore", "type": "uint256"},
        {"name": "lastGameTime", "type": "uint256"}
      ]}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalGames",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const CONTRACT_ADDRESS = '0x742d35Cc6634C0532925a3b8c17c701d2dE7b94c';

// Icons
const TrophyIcon = () => <span className="text-xl">🏆</span>;
const CrownIcon = () => <span className="text-xl">👑</span>;
const MedalIcon = ({ rank }) => {
  if (rank === 1) return <span className="text-xl">🥇</span>;
  if (rank === 2) return <span className="text-xl">🥈</span>;
  if (rank === 3) return <span className="text-xl">🥉</span>;
  return <span className="text-lg">🏅</span>;
};
const GameIcon = () => <span className="text-lg">🎮</span>;
const ChainIcon = () => <span className="text-lg">⛓️</span>;
const BackIcon = () => <span className="text-lg">←</span>;
const RefreshIcon = ({ spinning }) => <span className={`text-lg ${spinning ? 'animate-spin' : ''}`}>🔄</span>;
const FireIcon = () => <span className="text-lg">🔥</span>;
const TargetIcon = () => <span className="text-lg">🎯</span>;

const Leaderboard = ({ onBack }) => {
  const { authenticated, user } = usePrivy();
  const [refreshing, setRefreshing] = useState(false);

  // Read leaderboard data
  const { data: leaderboardData, isLoading: isLoadingLeaderboard, refetch: refetchLeaderboard } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: HANGMAN_ABI,
    functionName: 'getLeaderboard',
    args: [10], // Top 10 players
    enabled: authenticated,
  });

  // Read total games
  const { data: totalGames, isLoading: isLoadingTotal } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: HANGMAN_ABI,
    functionName: 'getTotalGames',
    enabled: authenticated,
  });

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchLeaderboard();
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Format address
  const formatAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Calculate win rate
  const getWinRate = (won, total) => {
    if (total === 0) return 0;
    return Math.round((won / total) * 100);
  };

  // Format time ago
  const getTimeAgo = (timestamp) => {
    if (!timestamp || timestamp === 0) return 'Never';
    const now = Math.floor(Date.now() / 1000);
    const diff = now - parseInt(timestamp.toString());
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1e1b4b 0%, #1e3a8a 50%, #312e81 100%)',
    padding: '16px',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  };

  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: 'white'
  };

  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ ...cardStyle, padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CrownIcon />
                Leaderboard
              </h1>
              <p style={{ color: '#bfdbfe' }}>Top players on Sepolia blockchain</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid #3b82f6',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: refreshing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <RefreshIcon spinning={refreshing} />
                Refresh
              </button>
              <button
                onClick={onBack}
                style={{
                  background: '#6b7280',
                  border: 'none',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <BackIcon />
                Back to Game
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ ...cardStyle, padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>
              <GameIcon />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {isLoadingTotal ? '...' : totalGames?.toString() || '0'}
            </div>
            <div style={{ color: '#bfdbfe', fontSize: '14px' }}>Total Games</div>
          </div>
          
          <div style={{ ...cardStyle, padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>
              <ChainIcon />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {CONTRACT_ADDRESS.substring(0, 8)}...
            </div>
            <div style={{ color: '#bfdbfe', fontSize: '14px' }}>Smart Contract</div>
          </div>

          <div style={{ ...cardStyle, padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>
              <FireIcon />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {leaderboardData && leaderboardData[0] ? leaderboardData[0].length : '0'}
            </div>
            <div style={{ color: '#bfdbfe', fontSize: '14px' }}>Active Players</div>
          </div>

          <div style={{ ...cardStyle, padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>
              <TargetIcon />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {leaderboardData && leaderboardData[1] && leaderboardData[1][0] 
                ? leaderboardData[1][0].highestScore?.toString() || '0'
                : '0'
              }
            </div>
            <div style={{ color: '#bfdbfe', fontSize: '14px' }}>High Score</div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div style={{ ...cardStyle, padding: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrophyIcon />
            Top Players
          </h2>

          {isLoadingLeaderboard ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <RefreshIcon spinning={true} />
              <p style={{ marginTop: '16px', color: '#bfdbfe' }}>Loading leaderboard from blockchain...</p>
            </div>
          ) : !leaderboardData || !leaderboardData[0] || leaderboardData[0].length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <GameIcon />
              <p style={{ marginTop: '16px', color: '#bfdbfe' }}>No players yet. Be the first to play!</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#bfdbfe' }}>Rank</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#bfdbfe' }}>Player</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#bfdbfe' }}>High Score</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#bfdbfe' }}>Games</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#bfdbfe' }}>Win Rate</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#bfdbfe' }}>Last Game</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardData[0].map((playerAddress, index) => {
                    const stats = leaderboardData[1][index];
                    const rank = index + 1;
                    
                    return (
                      <tr 
                        key={playerAddress}
                        style={{ 
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                          background: rank <= 3 ? 'rgba(255, 215, 0, 0.1)' : 'transparent'
                        }}
                      >
                        <td style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MedalIcon rank={rank} />
                          <span style={{ fontWeight: 'bold', fontSize: '18px' }}>#{rank}</span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                            {formatAddress(playerAddress)}
                          </div>
                          {playerAddress.toLowerCase() === user?.wallet?.address?.toLowerCase() && (
                            <div style={{ fontSize: '12px', color: '#10b981' }}>You</div>
                          )}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', fontWeight: 'bold', color: '#fcd34d' }}>
                          {stats.highestScore?.toString() || '0'}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          {stats.totalGames?.toString() || '0'}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <span style={{ 
                            color: getWinRate(parseInt(stats.gamesWon?.toString() || '0'), parseInt(stats.totalGames?.toString() || '0')) >= 70 ? '#10b981' : '#fbbf24'
                          }}>
                            {getWinRate(parseInt(stats.gamesWon?.toString() || '0'), parseInt(stats.totalGames?.toString() || '0'))}%
                          </span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', color: '#bfdbfe', fontSize: '14px' }}>
                          {getTimeAgo(stats.lastGameTime)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '32px', color: '#bfdbfe', fontSize: '14px' }}>
          <p>⛓️ Live data from Sepolia blockchain</p>
          <p style={{ marginTop: '4px' }}>
            📜 Contract: <a 
              href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#60a5fa', textDecoration: 'underline' }}
            >
              {formatAddress(CONTRACT_ADDRESS)} ↗
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
