document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const scoreText = document.getElementById('score-text');
  const highScoreText = document.getElementById('high-score-text');
  const restartBtn = document.getElementById('restart-btn');

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

  // User Stats (to reward coins/XP)
  let currentCoins = 0;
  let currentXp = 0;
  
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

  highScoreText.textContent = highScore;

  // Initialize/Reset Game
  function initGame() {
    snake = [
      { x: 15, y: 10 },
      { x: 14, y: 10 },
      { x: 13, y: 10 }
    ];
    dx = 1;
    dy = 0;
    score = 0;
    scoreText.textContent = `Score: ${score}`;
    isGameOver = false;
    isChangingDirection = false;
    generateFood();
    
    if (gameTimeout) clearTimeout(gameTimeout);
    gameLoop();
  }

  // Generate food at random coordinates not on the snake
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

  // Handle Keyboard inputs
  document.addEventListener('keydown', handleKeyDown);

  function handleKeyDown(e) {
    // Restart on space
    if (e.code === 'Space' && isGameOver) {
      e.preventDefault();
      // Dismiss modal if open
      if (gameOverModalEl && typeof bootstrap !== 'undefined') {
        const modalInstance = bootstrap.Modal.getInstance(gameOverModalEl);
        if (modalInstance) modalInstance.hide();
      }
      initGame();
      return;
    }

    if (isChangingDirection) return;

    const key = e.key.toLowerCase();
    const goingUp = dy === -1;
    const goingDown = dy === 1;
    const goingRight = dx === 1;
    const goingLeft = dx === -1;

    // Up: ArrowUp / w
    if ((key === 'arrowup' || key === 'w') && !goingDown) {
      dx = 0;
      dy = -1;
      isChangingDirection = true;
    }
    // Down: ArrowDown / s
    else if ((key === 'arrowdown' || key === 's') && !goingUp) {
      dx = 0;
      dy = 1;
      isChangingDirection = true;
    }
    // Left: ArrowLeft / a
    else if ((key === 'arrowleft' || key === 'a') && !goingRight) {
      dx = -1;
      dy = 0;
      isChangingDirection = true;
    }
    // Right: ArrowRight / d
    else if ((key === 'arrowright' || key === 'd') && !goingLeft) {
      dx = 1;
      dy = 0;
      isChangingDirection = true;
    }
  }

  // Game Loop
  function gameLoop() {
    if (isGameOver) return;

    isChangingDirection = false; // Reset direction change lock for this tick
    
    // Update state
    moveSnake();
    checkCollisions();
    
    if (isGameOver) {
      handleGameOver();
      return;
    }

    // Draw
    draw();

    gameTimeout = setTimeout(gameLoop, GAME_SPEED);
  }

  // Move snake by calculating new head position and adding it to the front
  function moveSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);

    // Check if food was eaten
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      scoreText.textContent = `Score: ${score}`;
      if (score > highScore) {
        highScore = score;
        highScoreText.textContent = highScore;
        localStorage.setItem('snakeHighScore', highScore);
      }
      generateFood();
    } else {
      snake.pop(); // Remove tail
    }
  }

  // Check boundary or self collisions
  function checkCollisions() {
    const head = snake[0];

    // Boundary check
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

      // Update local storage/UI if elements exist
      const coinsCount = document.getElementById('coins-count');
      if (coinsCount) coinsCount.textContent = currentCoins;

      try {
        await fetch('/api/user/stats', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coins: currentCoins, xp: currentXp })
        });
      } catch (err) {
        console.warn("Could not save stats to server:", err);
      }
    }
  }

  // Draw board
  function draw() {
    // Clear canvas
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid (Subtle lines)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= TILE_COUNT_X; i++) {
      ctx.beginPath();
      ctx.moveTo(i * GRID_SIZE, 0);
      ctx.lineTo(i * GRID_SIZE, canvas.height);
      ctx.stroke();
    }
    for (let j = 0; j <= TILE_COUNT_Y; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * GRID_SIZE);
      ctx.lineTo(canvas.width, j * GRID_SIZE);
      ctx.stroke();
    }

    // Draw Food (Shiny red glowing circle)
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ef4444';
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    const radius = GRID_SIZE / 2 - 2;
    const centerX = food.x * GRID_SIZE + GRID_SIZE / 2;
    const centerY = food.y * GRID_SIZE + GRID_SIZE / 2;
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.shadowBlur = 0; // Reset shadow

    // Draw Food Leaf
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(centerX + 2, centerY - radius + 1, 2, 4, Math.PI / 4, 0, 2 * Math.PI);
    ctx.fill();

    // Draw Snake
    snake.forEach((part, index) => {
      const isHead = index === 0;
      
      if (isHead) {
        ctx.fillStyle = '#4ade80'; // Bright green head
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#4ade80';
      } else {
        // Fade color slightly to the tail
        const alpha = 1 - (index / snake.length) * 0.5;
        ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
        ctx.shadowBlur = 0;
      }

      // Draw rounded block
      const x = part.x * GRID_SIZE;
      const y = part.y * GRID_SIZE;
      const size = GRID_SIZE - 2;
      drawRoundedRect(ctx, x + 1, y + 1, size, size, 5);
      
      // Draw Head Details (Eyes)
      if (isHead) {
        ctx.shadowBlur = 0; // Reset for eyes
        ctx.fillStyle = '#ffffff';
        
        let eyeSize = 3;
        let pupilSize = 1.5;
        let eyeOffset = 4;
        
        // Eye positions based on movement direction
        let leftEyeX, leftEyeY, rightEyeX, rightEyeY;

        if (dx === 1) { // Moving Right
          leftEyeX = x + size - eyeOffset; leftEyeY = y + eyeOffset;
          rightEyeX = x + size - eyeOffset; rightEyeY = y + size - eyeOffset;
        } else if (dx === -1) { // Moving Left
          leftEyeX = x + eyeOffset; leftEyeY = y + eyeOffset;
          rightEyeX = x + eyeOffset; rightEyeY = y + size - eyeOffset;
        } else if (dy === 1) { // Moving Down
          leftEyeX = x + eyeOffset; leftEyeY = y + size - eyeOffset;
          rightEyeX = x + size - eyeOffset; rightEyeY = y + size - eyeOffset;
        } else if (dy === -1) { // Moving Up
          leftEyeX = x + eyeOffset; leftEyeY = y + eyeOffset;
          rightEyeX = x + size - eyeOffset; rightEyeY = y + eyeOffset;
        }

        // Draw left eye
        ctx.beginPath();
        ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(leftEyeX + dx * 0.5, leftEyeY + dy * 0.5, pupilSize, 0, 2 * Math.PI);
        ctx.fill();

        // Draw right eye
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(rightEyeX + dx * 0.5, rightEyeY + dy * 0.5, pupilSize, 0, 2 * Math.PI);
        ctx.fill();
      }
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

  // Restart button clicks
  if (restartBtn) restartBtn.addEventListener('click', initGame);
  if (modalRestartBtn) modalRestartBtn.addEventListener('click', initGame);

  // Initialize
  fetchUserStats();
  initGame();
});
