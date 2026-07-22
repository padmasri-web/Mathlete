/**
 * Matiks - Tic-Tac-Toe Game Logic & Rule-Based AI
 */

document.addEventListener('DOMContentLoaded', () => {
  // Game State Variables
  let board = Array(9).fill(null);
  let currentPlayer = 'X'; // 'X' = Human Player, 'O' = Computer
  let isGameOver = false;
  let isComputerThinking = false;

  // Winning combinations (rows, columns, diagonals)
  const WINNING_COMBINATIONS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  // DOM Element Selectors
  const boardElement = document.getElementById('tictactoe-board');
  const cells = document.querySelectorAll('.ttt-cell');
  const statusBadge = document.getElementById('status-badge');
  const statusText = document.getElementById('status-text');
  const resetBtn = document.getElementById('reset-btn');
  const musicBtn = document.getElementById('music-toggle-btn');
  const modalResetBtn = document.getElementById('modal-reset-btn');
  const modalDrawResetBtn = document.getElementById('modal-draw-reset-btn');

  // Audio Controllers (Background, Win, Loss)
  let isMusicEnabled = true;
  let bgMusic = new Audio('/assets/mp3/music.mp3');
  bgMusic.loop = true;
  bgMusic.volume = 0.4;

  function playMusic() {
    if (!isMusicEnabled) return;
    bgMusic.play().then(() => {
      if (musicBtn) {
        musicBtn.classList.remove('muted');
        musicBtn.textContent = '🎵';
      }
    }).catch(err => {
      console.warn("Autoplay restriction waiting for user interaction:", err);
    });
  }

  function pauseMusic() {
    bgMusic.pause();
    if (musicBtn) {
      musicBtn.classList.add('muted');
      musicBtn.textContent = '🔇';
    }
  }

  function playWinSound() {
    if (!isMusicEnabled) return;
    pauseMusic();
    const winSound = new Audio('/assets/mp3/win.mp3');
    winSound.volume = 0.7;
    winSound.play().catch(err => console.warn("Win sound error:", err));
  }

  function playLossSound() {
    if (!isMusicEnabled) return;
    pauseMusic();
    const lossSound = new Audio('/assets/mp3/loss.mp3');
    lossSound.volume = 0.7;
    lossSound.play().catch(err => console.warn("Loss sound error:", err));
  }

  // Attempt autoplay immediately on load
  playMusic();

  if (musicBtn) {
    musicBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      isMusicEnabled = !isMusicEnabled;
      if (isMusicEnabled) {
        playMusic();
      } else {
        pauseMusic();
      }
    });
  }

  // First interaction listener to trigger music if browser blocked autoplay
  const startMusicOnFirstInteraction = () => {
    if (isMusicEnabled && bgMusic.paused) {
      playMusic();
    }
    document.removeEventListener('click', startMusicOnFirstInteraction);
    document.removeEventListener('keydown', startMusicOnFirstInteraction);
  };
  document.addEventListener('click', startMusicOnFirstInteraction);
  document.addEventListener('keydown', startMusicOnFirstInteraction);

  // Initialize Game Board Listeners
  cells.forEach((cell, index) => {
    cell.addEventListener('click', () => handleCellClick(index));
  });

  if (resetBtn) resetBtn.addEventListener('click', resetGame);
  if (modalResetBtn) modalResetBtn.addEventListener('click', resetGame);
  if (modalDrawResetBtn) modalDrawResetBtn.addEventListener('click', resetGame);

  /**
   * Handle Human Player Click
   */
  function handleCellClick(index) {
    // Prevent clicks if cell is taken, game is over, or computer is thinking
    if (board[index] !== null || isGameOver || isComputerThinking || currentPlayer !== 'X') {
      return;
    }

    // Try starting background music on first interaction
    if (isMusicEnabled && bgMusic.paused) {
      playMusic();
    }

    // Make Human Move
    makeMove(index, 'X');

    // Check Win/Draw for Human
    if (checkWin('X')) {
      handleGameOver('X');
      return;
    }

    if (checkDraw()) {
      handleGameOver('draw');
      return;
    }

    // Switch to Computer Turn
    currentPlayer = 'O';
    updateTurnUI();
    isComputerThinking = true;

    // Trigger Computer Move with slight delay for smooth realistic UX
    setTimeout(() => {
      makeComputerMove();
      isComputerThinking = false;
    }, 450);
  }

  // Sound Effects Setup
  let moveSound = new Audio('https://cdn.pixabay.com/download/audio/2022/03/24/audio_3c6901844b.mp3?filename=pop-39222.mp3');
  moveSound.volume = 0.4;

  /**
   * Make a move on the board and update cell UI
   */
  function makeMove(index, symbol) {
    board[index] = symbol;
    const cell = cells[index];
    cell.textContent = symbol;
    cell.classList.add('taken', symbol.toLowerCase());

    if (isMusicEnabled) {
      moveSound.cloneNode(true).play().catch(() => {});
    }
  }

  /**
   * Smart Rule-Based Computer Move AI Logic
   * 1. Winning Move: If Computer ('O') has 2 in a row, take the 3rd square to win.
   * 2. Blocking Move: If Player ('X') has 2 in a row, block the 3rd square.
   * 3. Center Priority: Take center (index 4) if empty.
   * 4. Fallback: Pick a random available empty square.
   */
  function makeComputerMove() {
    if (isGameOver) return;

    // Rule 1: Win Move for 'O'
    let moveIndex = findWinningOrBlockingMove('O');

    // Rule 2: Block Move for 'X'
    if (moveIndex === null) {
      moveIndex = findWinningOrBlockingMove('X');
    }

    // Rule 3: Center Priority (index 4)
    if (moveIndex === null && board[4] === null) {
      moveIndex = 4;
    }

    // Rule 4: Fallback to Random Available Square
    if (moveIndex === null) {
      const availableIndices = [];
      board.forEach((val, i) => {
        if (val === null) availableIndices.push(i);
      });

      if (availableIndices.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableIndices.length);
        moveIndex = availableIndices[randomIndex];
      }
    }

    // Execute Computer Move
    if (moveIndex !== null) {
      makeMove(moveIndex, 'O');

      // Check Win/Draw for Computer
      if (checkWin('O')) {
        handleGameOver('O');
        return;
      }

      if (checkDraw()) {
        handleGameOver('draw');
        return;
      }

      // Return turn to Human
      currentPlayer = 'X';
      updateTurnUI();
    }
  }

  /**
   * Rule Helper: Finds the 3rd square index to complete 3-in-a-row or block enemy
   */
  function findWinningOrBlockingMove(symbol) {
    for (let combo of WINNING_COMBINATIONS) {
      const [a, b, c] = combo;
      const values = [board[a], board[b], board[c]];
      
      const symbolCount = values.filter(val => val === symbol).length;
      const nullCount = values.filter(val => val === null).length;

      // If 2 cells match the target symbol and 1 is empty, return that empty index
      if (symbolCount === 2 && nullCount === 1) {
        if (board[a] === null) return a;
        if (board[b] === null) return b;
        if (board[c] === null) return c;
      }
    }
    return null;
  }

  /**
   * Check if a player symbol has won
   */
  function checkWin(symbol) {
    return WINNING_COMBINATIONS.some(combo => {
      const [a, b, c] = combo;
      if (board[a] === symbol && board[b] === symbol && board[c] === symbol) {
        highlightWinningCombo(combo);
        return true;
      }
      return false;
    });
  }

  /**
   * Check for a Draw / Tie
   */
  function checkDraw() {
    return board.every(val => val !== null);
  }

  /**
   * Highlight winning cells with glowing border
   */
  function highlightWinningCombo(combo) {
    combo.forEach(i => {
      cells[i].classList.add('win-cell');
    });
  }

  /**
   * Update Turn UI Indicator
   */
  function updateTurnUI() {
    if (isGameOver) return;

    if (currentPlayer === 'X') {
      statusBadge.style.background = 'rgba(80, 209, 224, 0.15)';
      statusBadge.style.borderColor = 'rgba(80, 209, 224, 0.4)';
      statusBadge.style.color = '#50D1E0';
      statusText.textContent = "Your Turn (X)";
    } else {
      statusBadge.style.background = 'rgba(255, 210, 63, 0.15)';
      statusBadge.style.borderColor = 'rgba(255, 210, 63, 0.4)';
      statusBadge.style.color = '#FFD23F';
      statusText.textContent = "Computer Thinking (O)...";
    }
  }

  /**
   * Handle Game Over (Victory or Draw)
   */
  function handleGameOver(result) {
    isGameOver = true;

    if (result === 'X') {
      playWinSound();
      statusBadge.style.background = 'rgba(16, 185, 129, 0.15)';
      statusBadge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
      statusBadge.style.color = '#10b981';
      statusText.textContent = "🎉 You Won!";

      // Show Bootstrap Win Modal
      setTimeout(() => {
        const winModal = new bootstrap.Modal(document.getElementById('winModal'));
        winModal.show();
      }, 400);

    } else if (result === 'O') {
      playLossSound();
      statusBadge.style.background = 'rgba(244, 63, 94, 0.15)';
      statusBadge.style.borderColor = 'rgba(244, 63, 94, 0.4)';
      statusBadge.style.color = '#f43f5e';
      statusText.textContent = "🤖 Computer Won!";

      // Show Bootstrap Game Over / Defeat Modal
      setTimeout(() => {
        const gameOverModal = new bootstrap.Modal(document.getElementById('drawModal'));
        document.getElementById('drawModalLabel').textContent = "🤖 Defeat!";
        document.getElementById('draw-subtitle-text').textContent = "The computer outsmarted you this round! Try again to get your revenge.";
        gameOverModal.show();
      }, 400);

    } else {
      statusBadge.style.background = 'rgba(148, 163, 184, 0.15)';
      statusBadge.style.borderColor = 'rgba(148, 163, 184, 0.4)';
      statusBadge.style.color = '#94a3b8';
      statusText.textContent = "🤝 It's a Draw!";

      setTimeout(() => {
        const drawModal = new bootstrap.Modal(document.getElementById('drawModal'));
        document.getElementById('drawModalLabel').textContent = "🤝 Draw Game!";
        document.getElementById('draw-subtitle-text').textContent = "A well-matched duel! Neither side could claim victory.";
        drawModal.show();
      }, 400);
    }
  }

  /**
   * Reset Game State
   */
  function resetGame() {
    board.fill(null);
    currentPlayer = 'X';
    isGameOver = false;
    isComputerThinking = false;

    cells.forEach(cell => {
      cell.textContent = '';
      cell.className = 'ttt-cell';
    });

    updateTurnUI();
    playMusic();
  }
});
