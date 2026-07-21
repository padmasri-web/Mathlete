const express = require('express');
const router = express.Router();

// Route to render the Lights Out game view
router.get(['/lightsout', '/games/lightsout'], (req, res) => {
  res.render('games/lightsOut');
});

module.exports = router;
