const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/profile', userController.getUserProfile);
router.put('/stats', userController.updateUserStats);

module.exports = router;
