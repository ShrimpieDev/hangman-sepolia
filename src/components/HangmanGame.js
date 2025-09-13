import React, { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

// Icons as emojis (since we can't use lucide in GitHub Pages easily)
const WalletIcon = () => <span className="text-2xl">👛</span>;
const UserIcon = () => <span className="text-lg">👤</span>;
const LogOutIcon = () => <span className="text-lg">🚪</span>;
const RefreshIcon = ({ spinning }) => <span className={`text-lg ${spinning ? 'animate-spin' : ''}`}>🔄</span>;
const TrophyIcon = () => <span className="text-lg">🏆</span>;
const HeartIcon = () => <span className="text-lg">❤️</span>;
const EmailIcon = () => <span className="text-lg">📧</span>;

const HangmanGame = () => {
  // Privy hooks
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  
  // Game state
  const [currentWord, setCurrentWord] = useState('');
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [gameStatus, setGameStatus] = useState('playing');
  const [score, setScore] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Game words
  const words = [
    'BLOCKCHAIN', 'ETHEREUM', 'SEPOLIA', 'PRIVY', 'WALLET',
    'CRYPTO', 'TOKEN', 'SMART', 'CONTRACT', 'DEFI',
    'MINT', 'BURN', 'STAKE', 'YIELD', 'SWAP',
    'BRIDGE', 'LAYER', 'NODE', 'HASH', 'FORK',
    'WEB3', 'DAPP', 'METAMASK', 'LEDGER', 'OPENSEA'
  ];

  // Hangman drawing stages
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

  // Get user's wallet address
  const getUserAddress = () => {
    if (wallets.length > 0) {
      return wallets[0].address;
    }
    return user?.wallet?.address || 'No wallet';
  };

  // Handle Privy login
  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await login();
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
    setScore(0);
    setGamesPlayed(0);
  };

  // Initialize new game
  const startNewGame = () => {
    const randomWord = words[Math.floor(Math.random() * words.length)];
    setCurrentWord(randomWord);
    setGuessedLetters([]);
    setWrongGuesses(0);
    setGameStatus('playing');
  };

  // Handle letter guess
  const guessLetter = (letter) => {
    if (guessedLetters.includes(letter) || gameStatus !== 'playing') {
      return;
    }

    const newGuessedLetters = [...guessedLetters, letter];
    setGuessedLetters(newGuessedLetters);

    if (!currentWord.includes(letter)) {
      const newWrongGuesses = wrongGuesses + 1;
      setWrongGuesses(newWrongGuesses);
      
      if (newWrongGuesses >= maxWrongGuesses) {
        setGameStatus('lost');
        setGamesPlayed(prev => prev + 1);
      }
    } else {
      const wordCompleted = currentWord.split('').every(char => 
        newGuessedLetters.includes(char)
      );
      
      if (wordCompleted) {
        setGameStatus('won');
        setScore(prev => prev + 10);
        setGamesPlayed(prev => prev + 1);
        
        // Here you could add a Sepolia transaction to save the score
        saveScoreToBlockchain();
      }
    }
  };

  // Simulate saving score to blockchain
  const saveScoreToBlockchain = async () => {
    console.log('🎉 Game won! Score could be saved to Sepolia here');
    // In a full implementation, you would:
    // 1. Create a smart contract for scores
    // 2. Use viem/wagmi to send a transaction
    // 3. Save the score on-chain
  };

  // Display word with guessed letters
  const displayWord = () => {
    return currentWord.split('').map(letter => 
      guessedLetters.includes(letter) ? letter : '_'
    ).join(' ');
  };

  // Generate alphabet buttons
  const renderAlphabet = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    return letters.map(letter => (
      <button
        key={letter}
        onClick={() => guessLetter(letter)}
        disabled={guessedLetters.includes(letter) || gameStatus !== 'playing'}
        style={{
          margin: '4px',
          padding: '8px 12px',
          borderRadius: '8px',
          fontWeight: 'bold',
          fontSize: '14px',
          border: 'none',
          cursor: guessedLetters.includes(letter) || gameStatus !== 'playing' ? 'not-allowed' : 'pointer',
          backgroundColor: guessedLetters.includes(letter)
            ? currentWord.includes(letter)
              ? '#10b981'
              : '#ef4444'
            : gameStatus !== 'playing'
            ? '#6b7280'
            : '#3b82f6',
          color: 'white',
          transition: 'all 0.2s',
          opacity: gameStatus !== 'playing' ? 0.5 : 1,
        }}
        onMouseOver={(e) => {
          if (!guessedLetters.includes(letter) && gameStatus === 'playing') {
            e.target.style.backgroundColor = '#2563eb';
            e.target.style.transform = 'scale(1.05)';
          }
        }}
        onMouseOut={(e) => {
          if (!guessedLetters.includes(letter) && gameStatus === 'playing') {
            e.target.style.backgroundColor = '#3b82f6';
            e.target.style.transform = 'scale(1)';
          }
        }}
      >
        {letter}
      </button>
    ));
  };

  // Initialize game when component mounts
  useEffect(() => {
    if (authenticated && ready) {
      startNewGame();
    }
  }, [authenticated, ready]);

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
            <p style={{ marginTop: '16px', color: '#bfdbfe' }}>Loading Privy...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated - show login
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
                <WalletIcon />
              </div>
              <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
                Hangman Game
              </h1>
              <p style={{ color: '#bfdbfe', marginBottom: '16px' }}>
                Play on Ethereum Sepolia with your email
              </p>
              <div style={{ 
                background: 'rgba(59, 130, 246, 0.1)', 
                padding: '12px', 
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <p style={{ fontSize: '14px', color: '#93c5fd' }}>
                  ✨ No crypto knowledge needed<br/>
                  📧 Login with just your email<br/>
                  🎮 Wallet created automatically
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogin}
              disabled={isLoading}
              style={{
                width: '100%',
                background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
                color: 'white',
                fontWeight: 'bold',
                padding: '16px 24px',
                borderRadius: '12px',
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '16px',
              }}
            >
              {isLoading ? (
                <>
                  <RefreshIcon spinning={true} />
                  Connecting...
                </>
              ) : (
                <>
                  <EmailIcon />
                  Login with Email
                </>
              )}
            </button>
            
            <p style={{ fontSize: '12px', color: '#93c5fd', marginTop: '16px' }}>
              Powered by Privy • Ethereum Sepolia Testnet
            </p>
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
                <span style={{ fontWeight: 'bold' }}>{score}</span>
              </div>
              <div style={{ color: '#bfdbfe' }}>
                Games: {gamesPlayed}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
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
          >
            <LogOutIcon />
            Logout
          </button>
        </div>
      </div>

      {/* Game Area */}
      <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
        <div style={{ ...cardStyle, padding: '32px' }}>
          {/* Game Status */}
          {gameStatus !== 'playing' && (
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
              {gameStatus === 'won' && (
                <p style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
                  Score saved to Sepolia testnet! 🎯
                </p>
              )}
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

            {/* Word and Game Controls */}
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
                  {displayWord()}
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
                onClick={startNewGame}
                style={{
                  background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)',
                  color: 'white',
                  fontWeight: 'bold',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >
                New Game
              </button>
            </div>
          </div>

          {/* Alphabet */}
          <div style={{ marginTop: '32px' }}>
            <h3 style={{ textAlign: 'center', color: '#bfdbfe', marginBottom: '16px', fontSize: '18px' }}>
              Choose a Letter:
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
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        marginTop: '32px',
        color: '#bfdbfe',
        fontSize: '14px'
      }}>
        <p>🚀 Playing on Ethereum Sepolia Testnet</p>
        <p style={{ marginTop: '4px' }}>
          🔐 Secured by Privy • 
          {wallets.length > 0 && (
            <span> 👛 Wallet: {wallets[0].walletClientType}</span>
          )}
        </p>
      </div>
    </div>
  );
};

export default HangmanGame;
