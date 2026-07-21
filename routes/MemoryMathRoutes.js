const express = require('express');
const router = express.Router();

// Render the Memory Match game page
router.get('/', (req, res) => {
  res.render('games/MemoryMath');
});

module.exports = router;
