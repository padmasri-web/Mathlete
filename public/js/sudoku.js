document.addEventListener('DOMContentLoaded', () => {
  const sudokuBoard = document.getElementById('sudoku-board');
  const checkBtn = document.getElementById('check-btn');
  const newGameBtn = document.getElementById('new-game-btn');
  const revealBtn = document.getElementById('reveal-btn');
  const confirmRevealBtn = document.getElementById('confirm-reveal-btn');
  const winModalEl = document.getElementById('winModal');
  const revealLockedModalEl = document.getElementById('revealLockedModal');
  const revealConfirmModalEl = document.getElementById('revealConfirmModal');
  const modalResetBtn = document.getElementById('modal-reset-btn');
  const stopwatchTextEl = document.getElementById('stopwatch-text');
  const lockedTimeTextEl = document.getElementById('locked-time-text');

  const FIVE_MINUTES_IN_SECONDS = 300; // 5 minutes

  let secondsElapsed = 0;
  let stopwatchInterval = null;
  let isPaused = false;
  let isSolvedOrRevealed = false;

  // Base Puzzles Collection (Solved & Initial Grid pairs)
  const puzzlesPool = [
    {
      solved: [
        [5, 3, 4, 6, 7, 8, 9, 1, 2],
        [6, 7, 2, 1, 9, 5, 3, 4, 8],
        [1, 9, 8, 3, 4, 2, 5, 6, 7],
        [8, 5, 9, 7, 6, 1, 4, 2, 3],
        [4, 2, 6, 8, 5, 3, 7, 9, 1],
        [7, 1, 3, 9, 2, 4, 8, 5, 6],
        [9, 6, 1, 5, 3, 7, 2, 8, 4],
        [2, 8, 7, 4, 1, 9, 6, 3, 5],
        [3, 4, 5, 2, 8, 6, 1, 7, 9]
      ],
      starting: [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9]
      ]
    },
    {
      solved: [
        [2, 9, 5, 7, 4, 3, 8, 6, 1],
        [4, 3, 1, 8, 6, 5, 9, 2, 7],
        [8, 7, 6, 1, 9, 2, 5, 4, 3],
        [3, 8, 7, 4, 5, 9, 2, 1, 6],
        [6, 1, 2, 3, 8, 7, 4, 9, 5],
        [5, 4, 9, 2, 1, 6, 7, 3, 8],
        [7, 6, 3, 5, 2, 4, 1, 8, 9],
        [9, 2, 8, 6, 7, 1, 3, 5, 4],
        [1, 5, 4, 9, 3, 8, 6, 7, 2]
      ],
      starting: [
        [2, 0, 0, 0, 4, 0, 0, 6, 0],
        [0, 0, 1, 8, 0, 5, 9, 0, 0],
        [0, 7, 6, 0, 0, 0, 5, 0, 3],
        [0, 0, 7, 0, 5, 0, 2, 1, 0],
        [6, 0, 0, 3, 0, 7, 0, 0, 5],
        [0, 4, 9, 0, 1, 0, 7, 0, 0],
        [7, 0, 3, 0, 0, 0, 1, 8, 0],
        [0, 0, 8, 6, 0, 1, 3, 0, 0],
        [0, 5, 0, 0, 3, 0, 0, 0, 2]
      ]
    },
    {
      solved: [
        [1, 5, 2, 4, 8, 9, 3, 7, 6],
        [7, 3, 9, 2, 5, 6, 8, 4, 1],
        [4, 6, 8, 3, 7, 1, 2, 9, 5],
        [3, 8, 7, 1, 2, 4, 6, 5, 9],
        [5, 9, 1, 7, 6, 3, 4, 2, 8],
        [2, 4, 6, 8, 9, 5, 7, 1, 3],
        [9, 1, 4, 6, 3, 7, 5, 8, 2],
        [6, 2, 5, 9, 4, 8, 1, 3, 7],
        [8, 7, 3, 5, 1, 2, 9, 6, 4]
      ],
      starting: [
        [1, 0, 0, 4, 8, 9, 0, 0, 6],
        [7, 3, 0, 0, 0, 0, 8, 4, 0],
        [0, 0, 0, 0, 0, 1, 2, 0, 0],
        [0, 0, 7, 1, 2, 0, 6, 0, 0],
        [5, 0, 0, 7, 0, 3, 0, 0, 8],
        [0, 0, 6, 0, 9, 5, 7, 0, 0],
        [0, 0, 4, 6, 0, 0, 0, 0, 0],
        [0, 2, 5, 0, 0, 0, 0, 3, 7],
        [8, 0, 0, 5, 1, 2, 0, 0, 4]
      ]
    }
  ];

  let currentSolvedBoard = [];
  let currentStartingBoard = [];

  // Stopwatch Logic with Pause / Resume support for Modals
  function startStopwatch() {
    stopStopwatch();
    secondsElapsed = 0;
    isPaused = false;
    isSolvedOrRevealed = false;
    updateStopwatchDisplay();
    stopwatchInterval = setInterval(() => {
      if (!isPaused) {
        secondsElapsed++;
        updateStopwatchDisplay();
      }
    }, 1000);
  }

  function pauseStopwatch() {
    isPaused = true;
  }

  function resumeStopwatch() {
    if (!isSolvedOrRevealed) {
      isPaused = false;
    }
  }

  function stopStopwatch() {
    if (stopwatchInterval) {
      clearInterval(stopwatchInterval);
      stopwatchInterval = null;
    }
    isPaused = false;
  }

  function updateStopwatchDisplay() {
    if (!stopwatchTextEl) return;
    const mins = Math.floor(secondsElapsed / 60);
    const secs = secondsElapsed % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    stopwatchTextEl.textContent = formatted;
  }

  // Bind modal open/close events to pause & resume stopwatch
  [revealLockedModalEl, revealConfirmModalEl, winModalEl].forEach(modalEl => {
    if (modalEl) {
      modalEl.addEventListener('show.bs.modal', () => {
        pauseStopwatch();
      });
      modalEl.addEventListener('hidden.bs.modal', () => {
        resumeStopwatch();
      });
    }
  });

  // Permute digits 1-9 randomly for digit relabeling
  function permuteDigits(solved, starting) {
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = digits.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [digits[i], digits[j]] = [digits[j], digits[i]];
    }
    const map = { 0: 0 };
    for (let i = 1; i <= 9; i++) {
      map[i] = digits[i - 1];
    }

    const newSolved = solved.map(row => row.map(val => map[val]));
    const newStarting = starting.map(row => row.map(val => map[val]));
    return { solved: newSolved, starting: newStarting };
  }

  // Perform band row/col swapping & matrix transpose
  function transformPuzzle(solved, starting) {
    let s = solved.map(row => [...row]);
    let p = starting.map(row => [...row]);

    // Swap rows within each 3x3 band
    for (let b = 0; b < 3; b++) {
      const r1 = b * 3 + Math.floor(Math.random() * 3);
      const r2 = b * 3 + Math.floor(Math.random() * 3);
      if (r1 !== r2) {
        [s[r1], s[r2]] = [s[r2], s[r1]];
        [p[r1], p[r2]] = [p[r2], p[r1]];
      }
    }

    // Swap columns within each 3x3 band
    for (let b = 0; b < 3; b++) {
      const c1 = b * 3 + Math.floor(Math.random() * 3);
      const c2 = b * 3 + Math.floor(Math.random() * 3);
      if (c1 !== c2) {
        for (let r = 0; r < 9; r++) {
          [s[r][c1], s[r][c2]] = [s[r][c2], s[r][c1]];
          [p[r][c1], p[r][c2]] = [p[r][c2], p[r][c1]];
        }
      }
    }

    // 50% chance matrix transpose
    if (Math.random() > 0.5) {
      const transS = Array.from({ length: 9 }, () => Array(9).fill(0));
      const transP = Array.from({ length: 9 }, () => Array(9).fill(0));
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          transS[c][r] = s[r][c];
          transP[c][r] = p[r][c];
        }
      }
      s = transS;
      p = transP;
    }

    return { solved: s, starting: p };
  }

  // Generate a brand new, randomized puzzle
  function generateFreshPuzzle() {
    const base = puzzlesPool[Math.floor(Math.random() * puzzlesPool.length)];
    const relabeled = permuteDigits(base.solved, base.starting);
    const transformed = transformPuzzle(relabeled.solved, relabeled.starting);

    currentSolvedBoard = transformed.solved;
    currentStartingBoard = transformed.starting;
  }

  // 1. Grid Generation & Initialization
  function initBoard() {
    if (!sudokuBoard) return;
    generateFreshPuzzle();
    sudokuBoard.innerHTML = '';

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 1;
        input.className = 'sudoku-cell';
        input.dataset.row = r;
        input.dataset.col = c;

        const startingVal = currentStartingBoard[r][c];

        if (startingVal !== 0) {
          input.value = startingVal;
          input.classList.add('fw-bold');
          input.disabled = true;
        } else {
          input.value = '';
          // Restrict input strictly to digits 1-9
          input.addEventListener('input', (e) => {
            input.classList.remove('text-danger');
            const val = e.target.value;
            if (!/^[1-9]$/.test(val)) {
              e.target.value = '';
            }
          });
        }

        sudokuBoard.appendChild(input);
      }
    }

    // Start Stopwatch
    startStopwatch();
  }

  // 2. Validation Logic & Feedback
  function checkAnswers() {
    if (!sudokuBoard) return;

    let isComplete = true;
    let hasError = false;

    const cells = sudokuBoard.querySelectorAll('.sudoku-cell');
    cells.forEach(cell => {
      if (cell.disabled) return;

      const r = parseInt(cell.dataset.row, 10);
      const c = parseInt(cell.dataset.col, 10);
      const userVal = parseInt(cell.value, 10);
      const expectedVal = currentSolvedBoard[r][c];

      if (!userVal) {
        isComplete = false;
        cell.classList.remove('text-danger');
      } else if (userVal !== expectedVal) {
        cell.classList.add('text-danger');
        hasError = true;
      } else {
        cell.classList.remove('text-danger');
      }
    });

    if (isComplete && !hasError) {
      isSolvedOrRevealed = true;
      stopStopwatch();
      if (winModalEl && typeof bootstrap !== 'undefined') {
        const modal = new bootstrap.Modal(winModalEl);
        modal.show();
      }
    }
  }

  // Reveal Full Solution
  function revealFullSolution() {
    if (!sudokuBoard) return;
    isSolvedOrRevealed = true;
    stopStopwatch();

    const cells = sudokuBoard.querySelectorAll('.sudoku-cell');
    cells.forEach(cell => {
      const r = parseInt(cell.dataset.row, 10);
      const c = parseInt(cell.dataset.col, 10);
      cell.value = currentSolvedBoard[r][c];
      cell.classList.remove('text-danger');
      if (!cell.disabled) {
        cell.style.color = '#50D1E0'; // Highlight revealed answers in aqua
      }
    });
  }

  // 3. New Game / Reset Board
  function startNewGame() {
    initBoard();
  }

  // Initialize Board
  initBoard();

  // Button Listeners
  if (checkBtn) {
    checkBtn.addEventListener('click', checkAnswers);
  }

  if (newGameBtn) {
    newGameBtn.addEventListener('click', startNewGame);
  }

  if (modalResetBtn) {
    modalResetBtn.addEventListener('click', startNewGame);
  }

  // Reveal Button Logic with 5-Minute Restriction
  if (revealBtn) {
    revealBtn.addEventListener('click', () => {
      pauseStopwatch(); // Instantly pause time on click
      
      if (secondsElapsed < FIVE_MINUTES_IN_SECONDS) {
        // Less than 5 minutes: show locked info modal with exact static time
        if (lockedTimeTextEl) {
          const mins = Math.floor(secondsElapsed / 60);
          const secs = secondsElapsed % 60;
          lockedTimeTextEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
        if (revealLockedModalEl && typeof bootstrap !== 'undefined') {
          const modal = new bootstrap.Modal(revealLockedModalEl);
          modal.show();
        }
      } else {
        // More than 5 minutes: show encouraging confirm modal
        if (revealConfirmModalEl && typeof bootstrap !== 'undefined') {
          const modal = new bootstrap.Modal(revealConfirmModalEl);
          modal.show();
        }
      }
    });
  }

  if (confirmRevealBtn) {
    confirmRevealBtn.addEventListener('click', () => {
      revealFullSolution();
    });
  }
});
