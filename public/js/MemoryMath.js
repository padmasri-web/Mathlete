document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const gameGrid = document.getElementById('game-grid');
  const victoryModal = document.getElementById('victory-modal');
  const playAgainBtn = document.getElementById('play-again-btn');
  const victoryIcon = document.getElementById('victory-icon');
  const victoryTitle = document.getElementById('victory-title');
  const victorySubtitle = document.getElementById('victory-subtitle');
  
  // Navbar elements
  const coinsCount = document.getElementById('coins-count');
  const xpCount = document.getElementById('xp-count');
  const timerWrapper = document.getElementById('game-timer-wrapper');
  const timerText = document.getElementById('game-timer-text');

  // Game State variables
  let flippedCards = [];
  let matchedPairs = 0;
  let isBoardLocked = false;
  let timerInterval = null;
  let timeLeft = 60;
  
  // User stats state for live updates
  let currentCoins = 500;
  let currentXp = 0;

  // The 8 unique mathematical symbols
  const baseSymbols = ['∑', 'π', '∞', '√', '∫', 'Δ', 'Ω', 'µ'];
  
  // Fetch current user profile to update top bar stats dynamically
  async function fetchUserStats() {
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const user = await res.json();
        currentCoins = user.coins;
        currentXp = user.xp;
        if (coinsCount) coinsCount.textContent = currentCoins;
        if (xpCount) xpCount.textContent = `${currentXp} XP`;
      }
    } catch (err) {
      console.warn("Could not fetch user stats, using client defaults:", err);
    }
  }

  // Shuffle utilizing Fisher-Yates algorithm
  function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]
      ];
    }
    return array;
  }

  // Initialize and Render game board
  function initGame() {
    // Reset state and clear timer
    flippedCards = [];
    matchedPairs = 0;
    isBoardLocked = true; // Lock board during reveal phase
    victoryModal.classList.remove('active');
    gameGrid.innerHTML = '';
    
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    // Show timer pill in navbar
    if (timerWrapper) {
      timerWrapper.style.display = 'flex';
    }
    if (timerText) {
      timerText.textContent = '01:00';
    }

    // Create pairs (16 symbols total)
    const gameSymbols = [...baseSymbols, ...baseSymbols];
    shuffle(gameSymbols);

    // Create card elements (initially flipped face-up)
    gameSymbols.forEach((symbol, index) => {
      const card = document.createElement('div');
      card.className = 'memory-card flipped'; // Set flipped class to show symbol
      card.dataset.symbol = symbol;
      card.dataset.index = index;

      card.innerHTML = `
        <div class="card-inner">
          <div class="card-front">
            <span style="font-size: 18px;">?</span>
          </div>
          <div class="card-back">
            <span>${symbol}</span>
          </div>
        </div>
      `;

      card.addEventListener('click', () => handleCardClick(card));
      gameGrid.appendChild(card);
    });

    // Reveal phase: show for 2 seconds, then flip face-down and start timer
    setTimeout(() => {
      const cards = document.querySelectorAll('.memory-card');
      cards.forEach(card => card.classList.remove('flipped'));
      isBoardLocked = false; // Unlock board
      startTimer();
    }, 2000);
  }

  // Start 1-minute countdown timer
  function startTimer() {
    timeLeft = 60;
    timerInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        if (timerText) timerText.textContent = '00:00';
        handleGameOver();
      } else {
        const min = Math.floor(timeLeft / 60);
        const sec = timeLeft % 60;
        if (timerText) {
          timerText.textContent = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
        }
      }
    }, 1000);
  }

  // Click Handler
  function handleCardClick(card) {
    // Ignore clicks if board is locked, card is already flipped (active), or already matched
    if (
      isBoardLocked || 
      card.classList.contains('flipped') || 
      card.classList.contains('matched')
    ) {
      return;
    }

    // Flip card
    card.classList.add('flipped');
    flippedCards.push(card);

    // Evaluate if two cards are flipped
    if (flippedCards.length === 2) {
      isBoardLocked = true;
      evaluateMatch();
    }
  }

  // Evaluation
  function evaluateMatch() {
    const [card1, card2] = flippedCards;
    const symbol1 = card1.dataset.symbol;
    const symbol2 = card2.dataset.symbol;

    if (symbol1 === symbol2) {
      // Resolution: Match
      setTimeout(() => {
        card1.classList.add('matched');
        card2.classList.add('matched');
        
        matchedPairs++;
        flippedCards = [];
        isBoardLocked = false;

        // Check Win Condition
        if (matchedPairs === baseSymbols.length) {
          handleWin();
        }
      }, 300);
    } else {
      // Resolution: Mismatch
      setTimeout(() => {
        card1.classList.remove('flipped');
        card2.classList.remove('flipped');
        flippedCards = [];
        isBoardLocked = false;
      }, 1000);
    }
  }

  // Handle Win State (Victory)
  async function handleWin() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    // Configure Modal content
    if (victoryIcon) victoryIcon.textContent = '🏆';
    if (victoryTitle) victoryTitle.textContent = 'Victory!';
    if (victorySubtitle) victorySubtitle.textContent = 'Amazing! You matched all symbols and earned +150 Coins and +100 XP!';
    victoryModal.classList.add('active');

    // Reward player: +150 Coins, +100 XP
    currentCoins += 150;
    currentXp += 100;

    // Animate stats
    if (coinsCount) animateCounter(coinsCount, currentCoins);
    if (xpCount) xpCount.textContent = `${currentXp} XP`;

    // Save rewards to backend
    try {
      await fetch('/api/user/stats', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coins: currentCoins, xp: currentXp })
      });
    } catch (err) {
      console.warn("Could not save victory stats to server database:", err);
    }
  }

  // Handle Game Over (Time's Up)
  function handleGameOver() {
    isBoardLocked = true;

    // Configure Modal content for loss state
    if (victoryIcon) victoryIcon.textContent = '⏱️';
    if (victoryTitle) victoryTitle.textContent = "Time's Up!";
    if (victorySubtitle) victorySubtitle.textContent = "You ran out of time! Try again to earn coins and XP rewards.";
    victoryModal.classList.add('active');
  }

  // Counter animation utility
  function animateCounter(element, target) {
    const current = parseInt(element.textContent) || 0;
    if (current === target) return;
    
    const range = target - current;
    const duration = 1000;
    let startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      element.textContent = Math.floor(current + progress * range);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        element.textContent = target;
      }
    }
    window.requestAnimationFrame(step);
  }

  // Bind Reset Game
  playAgainBtn.addEventListener('click', () => {
    initGame();
  });

  // Start initialization
  fetchUserStats();
  initGame();
});
