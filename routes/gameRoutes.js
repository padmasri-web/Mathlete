const express = require('express');
const router = express.Router();

// Route to render the Lights Out game view
router.get(['/lightsout', '/games/lightsout'], (req, res) => {
  res.render('games/lightsOut');
});

// Route to render the Sudoku game view
router.get(['/sudoku', '/games/sudoku', '/sudoko', '/games/sudoko'], (req, res) => {
  res.render('games/sudoku');
});

// Route to render the 2048 game view
router.get(['/2048', '/games/2048'], (req, res) => {
  res.render('games/2048');
});

module.exports = router;
