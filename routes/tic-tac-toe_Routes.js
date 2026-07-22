const express = require('express');
const router = express.Router();

// GET /games/tictactoe
router.get('/games/tictactoe', (req, res) => {
  res.render('games/tic-tac-toe');
});

// GET /games/tic-tac-toe alias
router.get('/games/tic-tac-toe', (req, res) => {
  res.render('games/tic-tac-toe');
});

module.exports = router;
