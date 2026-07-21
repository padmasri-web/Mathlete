const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');

router.get('/summary', challengeController.getChallengesSummary);

module.exports = router;
