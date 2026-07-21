document.addEventListener('DOMContentLoaded', () => {
  // Ensure container exists
  let container = document.getElementById('bg-stars-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'bg-stars-container';
    document.body.prepend(container);
  }

  // Vibrant color palette matching Mathlete design system
  const starColors = [
    '#FFD23F', // Gold
    '#50D1E0', // Vibrant Aqua
    '#F42F76', // Hot Pink
    '#B8F3FA', // Bright Ice Blue
    '#FFFFFF'  // Pure White
  ];

  // Increased quantity of floating stars (55 stars for rich density)
  const NUM_STARS = 55;

  // Generates clean, crisp SVG 4-point star outlines
  function createStarSVG(color) {
    return `
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z" 
              stroke="${color}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" fill="none"/>
      </svg>
    `;
  }

  // Spawns stars with randomized coordinates, sizes, velocities, rotation, and delays
  function spawnStars() {
    container.innerHTML = '';

    for (let i = 0; i < NUM_STARS; i++) {
      const star = document.createElement('div');
      star.className = 'star-outline';

      // 1. Random coordinates across background
      const startX = Math.random() * 100; // 0vw to 100vw
      const startY = Math.random() * 100; // 0vh to 100vh

      // 2. Larger, clearer star sizes (20px to 52px)
      const size = Math.floor(Math.random() * 32) + 20;

      // 3. Dynamic movement & float vectors
      const driftX = (Math.random() - 0.5) * 160; // Horizontal drift (-80px to 80px)
      const driftY = -(Math.random() * 130 + 50);  // Vertical upward drift (-50px to -180px)
      const endX = driftX * 1.8;
      const endY = driftY * 1.8;

      // 4. Enhanced opacity (0.50 to 0.95) & rotation
      const maxOpacity = (Math.random() * 0.45 + 0.50).toFixed(2);
      const duration = (Math.random() * 7 + 7).toFixed(1);          // 7s to 14s
      const delay = (Math.random() * -14).toFixed(1);                // Staggered immediate start
      const rotateMid = Math.floor(Math.random() * 180 - 90) + 'deg';
      const rotateEnd = Math.floor(Math.random() * 360) + 'deg';

      // Select random color theme from palette
      const color = starColors[Math.floor(Math.random() * starColors.length)];

      star.innerHTML = createStarSVG(color);
      star.style.left = `${startX}vw`;
      star.style.top = `${startY}vh`;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;

      // Assign custom CSS variables per star
      star.style.setProperty('--duration', `${duration}s`);
      star.style.setProperty('--delay', `${delay}s`);
      star.style.setProperty('--max-opacity', maxOpacity);
      star.style.setProperty('--drift-x', `${driftX}px`);
      star.style.setProperty('--drift-y', `${driftY}px`);
      star.style.setProperty('--end-x', `${endX}px`);
      star.style.setProperty('--end-y', `${endY}px`);
      star.style.setProperty('--rotate-mid', rotateMid);
      star.style.setProperty('--rotate-end', rotateEnd);

      container.appendChild(star);
    }
  }

  spawnStars();
});
