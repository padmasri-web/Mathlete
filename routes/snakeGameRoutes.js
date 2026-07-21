const express = require('express');
const router = express.Router();

// Route to render the Snake Game view
router.get(['/snake', '/games/snake'], (req, res) => {
  res.render('games/snakeGame');
});

module.exports = router;
