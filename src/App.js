import React, { useState } from 'react';
import OnChainHangman from './components/OnChainHangman';
import Leaderboard from './components/Leaderboard';

function App() {
  const [currentPage, setCurrentPage] = useState('game'); // 'game' or 'leaderboard'

  const showLeaderboard = () => setCurrentPage('leaderboard');
  const showGame = () => setCurrentPage('game');

  if (currentPage === 'leaderboard') {
    return <Leaderboard onBack={showGame} />;
  }

  return <OnChainHangman onShowLeaderboard={showLeaderboard} />;
}

export default App;
