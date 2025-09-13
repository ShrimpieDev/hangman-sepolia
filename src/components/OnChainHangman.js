import React, { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useContractWrite, useContractRead, useWaitForTransaction } from 'wagmi';
import { parseEther } from 'viem';

// Contract ABI (simplified for key functions)
const HANGMAN_ABI = [
  {
    "inputs": [{"name": "_wordHash", "type": "string"}, {"name": "_revealedWord", "type": "string"}],
    "name": "startNewGame",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "gameId", "type": "uint256"},
      {"name": "letter", "type": "string"},
      {"name": "isCorrect", "type": "bool"},
      {"name": "newRevealedWord", "type": "string"}
    ],
    "name": "guessLetter",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "gameId", "type": "uint256"}],
    "name": "getGame",
    "outputs": [{"name": "", "type": "tuple", "components": [
      {"name": "player", "type": "address"},
      {"name": "wordHash", "type": "string"},
      {"name": "revealedWord", "type": "string"},
      {"name": "guessedLetters", "type": "string"},
      {"name": "wrongGuesses", "type": "uint8"},
      {"name": "maxWrongGuesses", "type": "uint8"},
      {"name": "isActive", "type": "bool"},
      {"name": "isWon", "type": "bool"},
      {"name": "score", "type": "uint256"},
      {"name": "startTime", "type": "uint256"},
      {"name": "endTime", "type": "uint256"}
    ]}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "player", "type": "address"}],
    "name": "getPlayerStats",
    "outputs": [{"name": "", "type": "tuple", "components": [
      {"name": "totalGames", "type": "uint256"},
      {"name": "gamesWon", "type": "uint256"},
      {"name": "totalScore", "type": "uint256"},
      {"name": "highestScore", "type": "uint256"},
      {"name": "lastGameTime", "type": "uint256"}
    ]}],
    "stateMutability": "view",
    "type": "function"
  }
];

const CONTRACT_ADDRESS = '0x742d35Cc6634C0532925a3b8c17c701d2dE7b94c';

// Icons
const WalletIcon = () => <span className="text-2xl">👛</span>;
const UserIcon = () => <span className="text-lg">👤</span>;
const LogOutIcon = () => <span className="text-lg">🚪</span>;
const RefreshIcon = ({ spinning }) => <span className={`text-lg ${spinning ? 'animate-spin' : ''}`}>🔄</span>;
const TrophyIcon = () => <span className="text-lg">🏆</span>;
const HeartIcon = () => <span className="text-lg">❤️</span>;
const EmailIcon = () => <span className="text-lg">📧</span>;
const ChainIcon = () => <span className="text-lg">⛓️</span>;
const CheckIcon = () => <span className="text-lg">✅</span>;
const XIcon = () => <span className="text-lg">❌</span>;

const OnChainHangman = () => {
  // Privy hooks
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  
  // Game state
  const [currentGameId, setCurrentGameId] = useState(null);
  const [currentWord, setCurrentWord] = useState('');
  const [currentWordArray, setCurrentWordArray] = useState([]);
  const [revealedWord, setRevealedWord] = useState('');
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [gameStatus, setGameStatus] = useState('ready'); // 'ready', 'playing', 'won', 'lost'
  const [isLoading, setIsLoading] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState('');
  const [lastTxHash, setLastTxHash] = useState('');

  // Words list
  const words = [
    'BLOCKCHAIN', 'ETHEREUM', 'SEPOLIA', 'PRIVY', 'WALLET',
    'CRYPTO', 'TOKEN', 'SMART', 'CONTRACT', 'DEFI',
    'MINT', 'BURN', 'STAKE', 'YIELD', 'SWAP',
    'BRIDGE', 'LAYER', 'NODE', 'HASH', 'FORK',
    'WEB3', 'DAPP', 'METAMASK', 'LEDGER', 'OPENSEA'
  ];

  // Hangman stages
  const hangmanStages = [
    '',
    '  +---+\n      |\n      |\n      |\n      |\n=========',
    '  +---+\n  |   |\n      |\n      |\n      |\n=========',
    '  +---+\n  |   |\n  O   |\n      |\n      |\n=========',
    '  +---+\n  |   |\n  O   |\n  |   |\n      |\n=========',
    '  +---+\n  |   |\n  O   |\n /|   |\n      |\n=========',
    '  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n=========',
    '  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n=========',
    '  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n========='
  ];

  const maxWrongGuesses = 7;

  // Get user address
  const getUserAddress = () => {
    if (wallets.length > 0) {
      return wallets[0].address;
    }
    return user?.wallet?.address || '';
  };

  // Contract write hooks
  const { write: startGame, data: startGameData, isLoading: isStartingGame } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: HANGMAN_ABI,
    functionName: 'startNewGame',
  });

  const { write: guessLetter, data: guessData, isLoading: isGuessingLetter } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: HANGMAN_ABI,
    functionName: 'guessLetter',
  });

  // Wait for transaction confirmations
  const { isLoading: isStartTxLoading, isSuccess: isStartTxSuccess } = useWaitForTransaction({
    hash: startGameData?.hash,
  });

  const { isLoading: isGuessTxLoading, isSuccess: isGuessTxSuccess } = useWaitForTransaction({
    hash: guessData?.hash,
  });

  // Read player stats
  const { data: playerStats } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: HANGMAN_ABI,
    functionName: 'getPlayerStats',
    args: [getUserAddress()],
    enabled: authenticated && getUserAddress() !== '',
  });

  // Start new game on-chain
  const handleStartNewGame = async () => {
    const randomWord = words[Math.floor(Math.random() * words.length)];
    const wordHash = `word_${randomWord}_${Date.now()}`; // Simple hash for demo
    const initialRevealed = '_'.repeat(randomWord.length);
    
    setCurrentWord(randomWord);
    setCurrentWordArray(randomWord.split(''));
    setRevealedWord(initialRevealed);
    setGuessedLetters([]);
    setWrongGuesses(0);
    setTransactionStatus('Starting new game on Sepolia...');
    setIsLoading(true);

    try {
      await startGame({
        args: [wordHash, initialRevealed]
      });
    } catch (error) {
      console.error('Failed to start game:', error);
      setTransactionStatus('Failed to start game');
      setIsLoading(false);
    }
  };

  // Handle letter guess on-chain
  const handleGuessLetter = async (letter) => {
    if (guessedLetters.includes(letter) || gameStatus !== 'playing' || isLoading) {
      return;
    }

    setIsLoading(true);
    setTransactionStatus(`Guessing letter ${letter} on blockchain...`);

    // Check if letter is correct
    const isCorrect = currentWord.includes(letter);
    let newRevealedWord = revealedWord;
    
    if (isCorrect) {
      newRevealedWord = currentWordArray.map((char, index) => {
        if (char === letter) return char;
        if (revealedWord[index] !== '_') return revealedWord[index];
        return '_';
      }).join('');
    }

    // Check if word is complete
    const isComplete = !newRevealedWord.includes('_');
    const finalRevealedWord = isComplete ? 'COMPLETE' : newRevealedWord;

    try {
      await guessLetter({
        args: [currentGameId, letter, isCorrect, finalRevealedWord]
      });
    } catch (error) {
      console.error('Failed to guess letter:', error);
      setTransactionStatus('Failed to submit guess');
      setIsLoading(false);
    }
  };

  // Handle transaction success
  useEffect(() => {
    if (isStartTxSuccess && startGameData) {
      setCurrentGameId(Date.now()); // Mock game ID for demo
      setGameStatus('playing');
      setTransactionStatus('Game started successfully!');
      setLastTxHash(startGameData.hash);
      setIsLoading(false);
      
      setTimeout(() => setTransactionStatus(''), 3000);
    }
  }, [isStartTxSuccess, startGameData]);

  useEffect(() => {
    if (isGuessTxSuccess && guessData) {
      // This would normally read from the contract, but for demo we'll simulate
      setTransactionStatus('Letter guess confirmed!');
      setLastTxHash(guessData.hash);
      setIsLoading(false);
      
      setTimeout(() => setTransactionStatus(''), 3000);
    }
  }, [isGuessTxSuccess, guessData]);

  // Generate alphabet
  const renderAlphabet = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    return letters.map(letter => (
      <button
        key={letter}
        onClick={() => handleGuessLetter(letter)}
        disabled={guessedLetters.includes(letter) || gameStatus !== 'playing' || isLoading}
        style={{
          margin: '4px',
          padding: '8px 12px',
          borderRadius: '8px',
          fontWeight: 'bold',
          fontSize: '14px',
          border: 'none',
          cursor: (guessedLetters.includes(letter) || gameStatus !== 'playing' || isLoading) ? 'not-allowed' : 'pointer',
          backgroundColor: guessedLetters.includes(letter)
            ? currentWord.includes(letter)
              ? '#10b981'
              : '#ef4444'
            : (gameStatus !== 'playing' || isLoading)
            ? '#6b7280'
            : '#3b82f6',
          color: 'white',
          transition: 'all 0.2s',
          opacity: (gameStatus !== 'playing' || isLoading) ? 0.5 : 1,
        }}
      >
        {letter}
      </button>
    ));
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

  // Loading state
  if (!ready) {
    return (
      <div style={containerStyle}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh'
        }}>
          <div style={{ ...cardStyle, padding: '32px', textAlign: 'center' }}>
            <RefreshIcon spinning={true} />
            <p style={{ marginTop: '16px', color: '#bfdbfe' }}>Loading Privy & Sepolia...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!authenticated) {
    return (
      <div style={containerStyle}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh'
        }}>
          <div style={{
            ...cardStyle,
            padding: '32px',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '32px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>
                <ChainIcon />
              </div>
              <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
                On-Chain Hangman
              </h1>
              <p style={{ color: '#bfdbfe', marginBottom: '16px' }}>
                Every move is a blockchain transaction
              </p>
              <div style={{ 
                background: 'rgba(59, 130, 246, 0.1)', 
                padding: '12px', 
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <p style={{ fontSize: '14px', color: '#93c5fd' }}>
                  ⛓️ All moves on Sepolia blockchain<br/>
                  💰 Gas sponsored by game<br/>
                  🏆 On-chain leaderboard
                </p>
              </div>
            </div>
            
            <button
              onClick={login}
              style={{
                width: '100%',
                background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
                color: 'white',
                fontWeight: 'bold',
                padding: '16px 24px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              <EmailIcon /> Login with Email
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated - show game
  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ maxWidth: '1024px', margin: '0 auto 24px auto' }}>
        <div style={{
          ...cardStyle,
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserIcon />
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                  {getUserAddress().substring(0, 6)}...{getUserAddress().substring(getUserAddress().length - 4)}
                </div>
                <div style={{ fontSize: '12px', color: '#93c5fd' }}>
                  {user?.email?.address || 'Email user'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <TrophyIcon />
                <span style={{ fontWeight: 'bold' }}>
                  {playerStats ? playerStats.totalScore?.toString() : '0'}
                </span>
              </div>
              <div style={{ color: '#bfdbfe' }}>
                Games: {playerStats ? playerStats.totalGames?.toString() : '0'}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#ef4444',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
            }}
          ><button
  onClick={() => window.location.href = '#leaderboard'}
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#8b5cf6',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    marginRight: '8px'
  }}
>
  <TrophyIcon />
  Leaderboard
</button>
            <LogOutIcon /> Logout
          </button>
        </div>
      </div>

      {/* Transaction Status */}
      {transactionStatus && (
        <div style={{ maxWidth: '1024px', margin: '0 auto 16px auto' }}>
          <div style={{
            ...cardStyle,
            padding: '12px 16px',
            background: 'rgba(59, 130, 246, 0.2)',
            border: '1px solid #3b82f6',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {isLoading ? <RefreshIcon spinning={true} /> : <CheckIcon />}
              <span>{transactionStatus}</span>
            </div>
            {lastTxHash && (
              <div style={{ marginTop: '8px', fontSize: '12px' }}>
                <a 
                  href={`https://sepolia.etherscan.io/tx/${lastTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#60a5fa', textDecoration: 'underline' }}
                >
                  View on Etherscan ↗
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Game Area */}
      <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
        <div style={{ ...cardStyle, padding: '32px' }}>
          {gameStatus === 'ready' && (
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px' }}>
                🎮 On-Chain Hangman
              </h2>
              <p style={{ color: '#bfdbfe', marginBottom: '24px' }}>
                Every move will be recorded on the Sepolia blockchain
              </p>
              <button
                onClick={handleStartNewGame}
                disabled={isStartingGame || isStartTxLoading}
                style={{
                  background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)',
                  color: 'white',
                  fontWeight: 'bold',
                  padding: '16px 32px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: (isStartingGame || isStartTxLoading) ? 'not-allowed' : 'pointer',
                  fontSize: '18px',
                  opacity: (isStartingGame || isStartTxLoading) ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  margin: '0 auto'
                }}
              >
                {(isStartingGame || isStartTxLoading) ? (
                  <>
                    <RefreshIcon spinning={true} />
                    Creating Game On-Chain...
                  </>
                ) : (
                  <>
                    <ChainIcon />
                    Start New Game
                  </>
                )}
              </button>
              <p style={{ fontSize: '12px', color: '#93c5fd', marginTop: '16px' }}>
                💰 Gas sponsored - Free to play!
              </p>
            </div>
          )}

          {gameStatus !== 'ready' && (
            <>
              {/* Game Status */}
              {(gameStatus === 'won' || gameStatus === 'lost') && (
                <div style={{
                  textAlign: 'center',
                  marginBottom: '24px',
                  padding: '16px',
                  borderRadius: '12px',
                  background: gameStatus === 'won' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  border: gameStatus === 'won' ? '1px solid #10b981' : '1px solid #ef4444'
                }}>
                  <h2 style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: gameStatus === 'won' ? '#10b981' : '#ef4444',
                    marginBottom: '8px'
                  }}>
                    {gameStatus === 'won' ? '🎉 You Won!' : '💀 Game Over!'}
                  </h2>
                  <p style={{ marginTop: '8px' }}>
                    The word was: <span style={{ fontWeight: 'bold', color: '#fcd34d' }}>{currentWord}</span>
                  </p>
                  <p style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
                    ⛓️ Result saved on Sepolia blockchain!
                  </p>
                </div>
              )}

              <div style={{
                display: 'grid',
                gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr',
                gap: '32px'
              }}>
                {/* Hangman Drawing */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '12px',
                    padding: '24px',
                    marginBottom: '16px'
                  }}>
                    <pre style={{
                      fontFamily: 'monospace',
                      fontSize: '18px',
                      whiteSpace: 'pre-wrap',
                      margin: 0,
                      lineHeight: '1.2'
                    }}>
                      {hangmanStages[wrongGuesses]}
                    </pre>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <HeartIcon />
                    <span style={{ fontWeight: 'bold' }}>
                      Lives: {maxWrongGuesses - wrongGuesses}/{maxWrongGuesses}
                    </span>
                  </div>
                </div>

                {/* Word and Controls */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ color: '#bfdbfe', marginBottom: '16px', fontSize: '18px' }}>
                      Guess the Web3 Word:
                    </h3>
                    <div style={{
                      fontSize: '36px',
                      fontWeight: 'bold',
                      letterSpacing: '8px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      padding: '16px',
                      borderRadius: '12px'
                    }}>
                      {revealedWord.split('').join(' ')}
                    </div>
                  </div>

                  {wrongGuesses > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                      <p style={{ color: '#fca5a5', marginBottom: '8px' }}>Wrong Letters:</p>
                      <div style={{ color: '#ef4444', fontWeight: 'bold' }}>
                        {guessedLetters.filter(letter => !currentWord.includes(letter)).join(', ')}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleStartNewGame}
                    disabled={isLoading}
                    style={{
                      background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)',
                      color: 'white',
                      fontWeight: 'bold',
                      padding: '12px 24px',
                      borderRadius: '12px',
                      border: 'none',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                      opacity: isLoading ? 0.5 : 1,
                    }}
                  >
                    New Game
                  </button>
                </div>
              </div>

              {/* Alphabet */}
              <div style={{ marginTop: '32px' }}>
                <h3 style={{ textAlign: 'center', color: '#bfdbfe', marginBottom: '16px', fontSize: '18px' }}>
                  Choose a Letter (Each guess = blockchain transaction):
                </h3>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  maxWidth: '512px',
                  margin: '0 auto'
                }}>
                  {renderAlphabet()}
                </div>
                <p style={{ textAlign: 'center', fontSize: '12px', color: '#93c5fd', marginTop: '16px' }}>
                  💰 All transactions sponsored - Play for free!
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        marginTop: '32px',
        color: '#bfdbfe',
        fontSize: '14px'
      }}>
        <p>⛓️ Every move recorded on Sepolia blockchain</p>
        <p style={{ marginTop: '4px' }}>
          📜 Contract: {CONTRACT_ADDRESS.substring(0, 8)}...{CONTRACT_ADDRESS.substring(-6)}
        </p>
        <p style={{ marginTop: '4px' }}>
          🔐 Powered by Privy • 💰 Gas Sponsored
        </p>
      </div>
    </div>
  );
};

export default OnChainHangman;
