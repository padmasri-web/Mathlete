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

module.exports = router;
