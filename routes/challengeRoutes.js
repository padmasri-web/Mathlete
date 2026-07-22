const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');

// GET active daily challenge for today
router.get('/daily', challengeController.getActiveDailyChallenge);

// GET challenges summary dashboard endpoint
router.get('/summary', challengeController.getChallengesSummary);

module.exports = router;
