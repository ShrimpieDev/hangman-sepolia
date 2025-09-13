import React, { useState, useEffect } from 'react';

// Icons as emojis
const WalletIcon = () => <span className="text-2xl">👛</span>;
const UserIcon = () => <span className="text-lg">👤</span>;
const LogOutIcon = () => <span className="text-lg">🚪</span>;
const RefreshIcon = ({ spinning }) => <span className={`text-lg ${spinning ? 'animate-spin' : ''}`}>🔄</span>;
const TrophyIcon = () => <span className="text-lg">🏆</span>;
const HeartIcon = () => <span className="text-lg">❤️</span>;

const HangmanGame = () => {
  // Game state
  const [currentWord, setCurrentWord] = useState('');
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [gameStatus, setGameStatus] = useState('playing');
  const [score, setScore] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  
  // Wallet state
  const [isConnected, setIsConnected] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const words = [
    'BLOCKCHAIN', 'ETHEREUM', 'SEPOLIA', 'PRIVY', 'WALLET',
    'CRYPTO', 'TOKEN', 'SMART', 'CONTRACT', 'DEFI',
    'MINT', 'BURN', 'STAKE', 'YIELD', 'SWAP',
    'BRIDGE', 'LAYER', 'NODE', 'HASH', 'FORK'
  ];

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

  const connectWallet = async () => {
    setIsConnecting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const mockAddress = '0x' + Math.random().toString(16).substring(2, 42);
    setUserAddress(mockAddress);
    setIsConnected(true);
    setIsConnecting(false);
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setUserAddress('');
    setScore(0);
    setGamesPlayed(0);
  };

  const startNewGame = () => {
    const randomWord = words[Math.floor(Math.random() * words.length)];
    setCurrentWord(randomWord);
    setGuessedLetters([]);
    setWrongGuesses(0);
    setGameStatus('playing');
  };

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
      }
    }
  };

  const displayWord = () => {
    return currentWord.split('').map(letter => 
      guessedLetters.includes(letter) ? letter : '_'
    ).join(' ');
  };

  const renderAlphabet = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    return letters.map(letter => (
      <button
        key={letter}
        onClick={() => guessLetter(letter)}
        disabled={guessedLetters.includes(letter)}
        style={{
          margin: '4px',
          padding: '8px 12px',
          borderRadius: '8px',
          fontWeight: 'bold',
          fontSize: '14px',
          border: 'none',
          cursor: guessedLetters.includes(letter) ? 'not-allowed' : 'pointer',
          backgroundColor: guessedLetters.includes(letter)
            ? currentWord.includes(letter)
              ? '#10b981'
              : '#ef4444'
            : '#3b82f6',
          color: 'white',
          transition: 'all 0.2s',
        }}
        onMouseOver={(e) => {
          if (!guessedLetters.includes(letter)) {
            e.target.style.backgroundColor = '#2563eb';
            e.target.style.transform = 'scale(1.05)';
          }
        }}
        onMouseOut={(e) => {
          if (!guessedLetters.includes(letter)) {
            e.target.style.backgroundColor = '#3b82f6';
            e.target.style.transform = 'scale(1)';
          }
        }}
      >
        {letter}
      </button>
    ));
  };

  useEffect(() => {
    startNewGame();
  }, []);

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

  if (!isConnected) {
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
              <p style={{ color: '#bfdbfe' }}>
                Connect your wallet to play on Ethereum Sepolia
              </p>
            </div>
            
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              style={{
                width: '100%',
                background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
                color: 'white',
                fontWeight: 'bold',
                padding: '16px 24px',
                borderRadius: '12px',
                border: 'none',
                cursor: isConnecting ? 'not-allowed' : 'pointer',
                opacity: isConnecting ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '16px',
              }}
            >
              {isConnecting ? (
                <>
                  <RefreshIcon spinning={true} />
                  Connecting...
                </>
              ) : (
                <>
                  <WalletIcon />
                  Connect with Privy
                </>
              )}
            </button>
            
            <p style={{ fontSize: '12px', color: '#93c5fd', marginTop: '16px' }}>
              Powered by Privy wallet infrastructure
            </p>
          </div>
        </div>
      </div>
    );
  }

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
              <span style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                {userAddress.substring(0, 6)}...{userAddress.substring(userAddress.length - 4)}
              </span>
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
            onClick={disconnectWallet}
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
            Disconnect
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
        <div style={{ ...cardStyle, padding: '32px' }}>
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
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr',
            gap: '32px'
          }}>
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

            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ color: '#bfdbfe', marginBottom: '16px', fontSize: '18px' }}>
                  Guess the Word:
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

      <div style={{
        textAlign: 'center',
        marginTop: '32px',
        color: '#bfdbfe',
        fontSize: '14px'
      }}>
        <p>Playing on Ethereum Sepolia Testnet</p>
        <p style={{ marginTop: '4px' }}>Wallet powered by Privy</p>
      </div>
    </div>
  );
};

export default HangmanGame;
