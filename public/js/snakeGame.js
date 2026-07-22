document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const scoreText = document.getElementById('score-text');
  const highScoreText = document.getElementById('high-score-text');
  const restartBtn = document.getElementById('restart-btn');
  const musicToggleBtn = document.getElementById('music-toggle-btn');

  // Modal elements
  const gameOverModalEl = document.getElementById('gameOverModal');
  const modalRestartBtn = document.getElementById('modal-restart-btn');
  const modalFinalScore = document.getElementById('modal-final-score');
  const modalHighScore = document.getElementById('modal-high-score');
  const modalRewardsText = document.getElementById('modal-rewards-text');

  // Grid parameters (Widescreen 600x400)
  const GRID_SIZE = 20; // 20px per cell
  const TILE_COUNT_X = 30; // 30 cols = 600px width
  const TILE_COUNT_Y = 20; // 20 rows = 400px height

  // Game state
  let snake = [];
  let food = { x: 0, y: 0 };
  let dx = 1; // direction X (moving right initially)
  let dy = 0; // direction Y
  let score = 0;
  let highScore = localStorage.getItem('snakeHighScore') || 0;
  let isGameOver = false;
  let isChangingDirection = false;
  let gameTimeout = null;
  const GAME_SPEED = 100; // tick every 100ms

  // User Stats
  let currentCoins = 0;
  let currentXp = 0;

  // Background Music Controller (/assets/mp3/snake.mp3)
  let isMusicEnabled = true;
  let bgMusic = new Audio('/assets/mp3/snake.mp3');
  bgMusic.loop = true;
  bgMusic.volume = 0.5;

  function playMusic() {
    if (!isMusicEnabled) return;
    bgMusic.play().then(() => {
      if (musicToggleBtn) musicToggleBtn.classList.remove('muted');
    }).catch(err => {
      console.warn("Autoplay policy waiting for user interaction:", err);
    });
  }

  function pauseMusic() {
    bgMusic.pause();
    if (musicToggleBtn) musicToggleBtn.classList.add('muted');
  }

  function playLossSound() {
    if (!isMusicEnabled) return;
    pauseMusic();
    const lossSound = new Audio('/assets/mp3/loss.mp3');
    lossSound.volume = 0.7;
    lossSound.play().catch(err => console.warn("Loss sound playback error:", err));
  }

  function playWinSound() {
    if (!isMusicEnabled) return;
    pauseMusic();
    const winSound = new Audio('/assets/mp3/win.mp3');
    winSound.volume = 0.7;
    winSound.play().catch(err => console.warn("Win sound playback error:", err));
  }

  playMusic();

  const enableAudioOnInteraction = () => {
    if (isMusicEnabled && bgMusic.paused && !isGameOver) {
      playMusic();
    }
    document.removeEventListener('click', enableAudioOnInteraction);
    document.removeEventListener('keydown', enableAudioOnInteraction);
  };
  document.addEventListener('click', enableAudioOnInteraction);
  document.addEventListener('keydown', enableAudioOnInteraction);

  if (musicToggleBtn) {
    musicToggleBtn.addEventListener('click', () => {
      isMusicEnabled = !isMusicEnabled;
      if (isMusicEnabled) {
        playMusic();
      } else {
        pauseMusic();
      }
    });
  }
  
  // Fetch current user stats
  async function fetchUserStats() {
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const user = await res.json();
        currentCoins = user.coins;
        currentXp = user.xp;
      }
    } catch (err) {
      console.warn("Could not fetch user stats, using client defaults:", err);
    }
  }

  if (highScoreText) highScoreText.textContent = highScore;

  // Initialize/Reset Game
  function initGame() {
    snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];
    dx = 1;
    dy = 0;
    score = 0;
    isGameOver = false;
    isChangingDirection = false;
    isNewHighScore = false;
    if (scoreText) scoreText.textContent = `Score: ${score}`;

    generateFood();
    if (gameTimeout) clearTimeout(gameTimeout);
    
    bgMusic.currentTime = 0;
    if (isMusicEnabled) {
      playMusic();
    }

    draw(); // Immediate initial render
    gameLoop();
  }

  // Generate food at random grid position not occupied by snake
  function generateFood() {
    let foodX, foodY;
    let foodOnSnake = true;
    
    while (foodOnSnake) {
      foodX = Math.floor(Math.random() * TILE_COUNT_X);
      foodY = Math.floor(Math.random() * TILE_COUNT_Y);
      
      foodOnSnake = false;
      for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === foodX && snake[i].y === foodY) {
          foodOnSnake = true;
          break;
        }
      }
    }
    food = { x: foodX, y: foodY };
  }

  // Main Game Loop
  function gameLoop() {
    if (isGameOver) return;

    gameTimeout = setTimeout(() => {
      isChangingDirection = false;
      moveSnake();
      checkCollisions();

      if (isGameOver) {
        handleGameOver();
      } else {
        draw();
        gameLoop();
      }
    }, GAME_SPEED);
  }

  let isNewHighScore = false;

  // Advance snake head position and update tail
  function moveSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);

    // Check if snake ate food
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      if (scoreText) scoreText.textContent = `Score: ${score}`;
      if (score > highScore) {
        highScore = score;
        isNewHighScore = true;
        if (highScoreText) highScoreText.textContent = highScore;
        localStorage.setItem('snakeHighScore', highScore);
      }
      generateFood();
    } else {
      snake.pop(); // Remove tail segment if food wasn't eaten
    }
  }

  // Check boundary or self collisions
  function checkCollisions() {
    const head = snake[0];

    // Boundary check for widescreen (30 x 20)
    if (head.x < 0 || head.x >= TILE_COUNT_X || head.y < 0 || head.y >= TILE_COUNT_Y) {
      isGameOver = true;
      return;
    }

    // Self check (skip first element which is the head itself)
    for (let i = 1; i < snake.length; i++) {
      if (snake[i].x === head.x && snake[i].y === head.y) {
        isGameOver = true;
        return;
      }
    }
  }

  // Game Over handling
  async function handleGameOver() {
    drawGameOver();

    if (isNewHighScore) {
      playWinSound();
    } else {
      playLossSound();
    }

    const modalTitleEl = document.getElementById('gameOverModalLabel');
    if (modalTitleEl) {
      if (isNewHighScore) {
        modalTitleEl.innerHTML = '🎉 New High Score!';
        modalTitleEl.className = 'modal-title fw-bold text-success fs-4';
      } else {
        modalTitleEl.innerHTML = '💀 Game Over';
        modalTitleEl.className = 'modal-title fw-bold text-danger fs-4';
      }
    }

    // Reward player: 1 Coin + 1 XP per 10 points
    const coinReward = Math.floor(score / 10);
    const xpReward = Math.floor(score / 10);

    // Update Modal text
    if (modalFinalScore) modalFinalScore.textContent = score;
    if (modalHighScore) modalHighScore.textContent = highScore;
    if (modalRewardsText) {
      if (coinReward > 0) {
        modalRewardsText.innerHTML = `Awesome run! Earned <strong>+${coinReward} Coins</strong> and <strong>+${xpReward} XP</strong>.`;
      } else {
        modalRewardsText.innerHTML = `Score at least 10 points to start earning Coins & XP!`;
      }
    }

    // Show Game Over Modal
    if (gameOverModalEl && typeof bootstrap !== 'undefined') {
      const modal = new bootstrap.Modal(gameOverModalEl);
      modal.show();
    }

    if (coinReward > 0) {
      currentCoins += coinReward;
      currentXp += xpReward;

      try {
        await fetch('/api/user/stats', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coins: currentCoins, xp: currentXp })
        });
      } catch (e) {
        console.warn("Could not sync rewards to backend:", e);
      }
    }

    // Always log played match details in the database history
    try {
      await fetch('/api/user/gamelog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'Logic',
          mode: 'Snake',
          playerScore: score,
          opponentName: 'AI Snake Bot',
          opponentScore: Math.max(0, Math.floor(score * 0.8 + (Math.random() - 0.5) * 6))
        })
      });
    } catch (err) {
      console.warn("Could not save match history gamelog to server:", err);
    }
  }

  // Full Drawing Function (Grid, Food, Snake)
  function draw() {
    // Clear Canvas
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw Food (Shiny red glowing circle)
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ef4444';
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    const radius = GRID_SIZE / 2 - 2;
    const centerX = food.x * GRID_SIZE + GRID_SIZE / 2;
    const centerY = food.y * GRID_SIZE + GRID_SIZE / 2;
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();

    // Food Leaf
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(centerX + 2, centerY - radius + 1, 2, 4, Math.PI / 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();

    // Draw Snake
    snake.forEach((segment, index) => {
      ctx.save();
      const isHead = index === 0;

      if (isHead) {
        ctx.fillStyle = '#4ade80';
        ctx.shadowColor = '#4ade80';
        ctx.shadowBlur = 8;
        drawRoundedRect(ctx, segment.x * GRID_SIZE + 1, segment.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2, 5);

        // Eyes
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        const eyeOffset = 4;
        let eye1X = segment.x * GRID_SIZE + eyeOffset;
        let eye1Y = segment.y * GRID_SIZE + eyeOffset;
        let eye2X = segment.x * GRID_SIZE + GRID_SIZE - eyeOffset - 3;
        let eye2Y = segment.y * GRID_SIZE + eyeOffset;

        if (dy === 1) { // moving down
          eye1Y = eye2Y = segment.y * GRID_SIZE + GRID_SIZE - eyeOffset - 3;
        } else if (dx === -1) { // moving left
          eye1X = eye2X = segment.x * GRID_SIZE + eyeOffset;
          eye2Y = segment.y * GRID_SIZE + GRID_SIZE - eyeOffset - 3;
        } else if (dx === 1) { // moving right
          eye1X = eye2X = segment.x * GRID_SIZE + GRID_SIZE - eyeOffset - 3;
          eye2Y = segment.y * GRID_SIZE + GRID_SIZE - eyeOffset - 3;
        }

        ctx.fillRect(eye1X, eye1Y, 3, 3);
        ctx.fillRect(eye2X, eye2Y, 3, 3);
      } else {
        const alpha = Math.max(0.4, 1 - (index / snake.length) * 0.5);
        ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
        drawRoundedRect(ctx, segment.x * GRID_SIZE + 1, segment.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2, 4);
      }
      ctx.restore();
    });
  }

  // Draw game over screen on canvas (Subtle dark overlay over frozen board)
  function drawGameOver() {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Rounded rectangle drawing helper
  function drawRoundedRect(c, x, y, width, height, radius) {
    c.beginPath();
    c.moveTo(x + radius, y);
    c.lineTo(x + width - radius, y);
    c.quadraticCurveTo(x + width, y, x + width, y + radius);
    c.lineTo(x + width, y + height - radius);
    c.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    c.lineTo(x + radius, y + height);
    c.quadraticCurveTo(x, y + height, x, y + height - radius);
    c.lineTo(x, y + radius);
    c.quadraticCurveTo(x, y, x + radius, y);
    c.closePath();
    c.fill();
  }

  // Keyboard Direction Controls
  document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }

    if (isGameOver) {
      if (e.key === ' ') {
        if (gameOverModalEl && typeof bootstrap !== 'undefined') {
          const modalInstance = bootstrap.Modal.getInstance(gameOverModalEl);
          if (modalInstance) modalInstance.hide();
        }
        bgMusic.currentTime = 0;
        initGame();
      }
      return;
    }

    if (isChangingDirection) return;

    const keyPressed = e.key;
    const goingUp = dy === -1;
    const goingDown = dy === 1;
    const goingRight = dx === 1;
    const goingLeft = dx === -1;

    if ((keyPressed === 'ArrowLeft' || keyPressed.toLowerCase() === 'a') && !goingRight) {
      dx = -1;
      dy = 0;
      isChangingDirection = true;
    }
    if ((keyPressed === 'ArrowUp' || keyPressed.toLowerCase() === 'w') && !goingDown) {
      dx = 0;
      dy = -1;
      isChangingDirection = true;
    }
    if ((keyPressed === 'ArrowRight' || keyPressed.toLowerCase() === 'd') && !goingLeft) {
      dx = 1;
      dy = 0;
      isChangingDirection = true;
    }
    if ((keyPressed === 'ArrowDown' || keyPressed.toLowerCase() === 's') && !goingUp) {
      dx = 0;
      dy = 1;
      isChangingDirection = true;
    }
  });

  // Restart button clicks
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      bgMusic.currentTime = 0;
      initGame();
    });
  }

  if (modalRestartBtn) {
    modalRestartBtn.addEventListener('click', () => {
      bgMusic.currentTime = 0;
      initGame();
    });
  }

  // Initialize
  fetchUserStats();
  initGame();
});
