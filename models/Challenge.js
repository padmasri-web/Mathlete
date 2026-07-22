const mongoose = require('mongoose');

const ChallengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Math', 'Memory', 'Puzzle', 'Logic'],
    required: true
  },
  mode: {
    type: String, // 'Sprint Duels', 'Fast & First'
    required: true
  },
  description: String,
  points: {
    type: Number,
    default: 100
  },
  badgeColor: {
    type: String,
    default: '#4564C6'
  }
}, { timestamps: true });

const GameLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  challenge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge',
    required: true
  },
  category: {
    type: String,
    enum: ['Math', 'Memory', 'Puzzle', 'Logic'],
    required: true
  },
  mode: {
    type: String,
    required: true
  },
  playerScore: {
    type: Number,
    required: true
  },
  playerRatingChange: {
    type: Number,
    default: 0
  },
  opponentName: {
    type: String,
    default: 'Opponent'
  },
  opponentScore: {
    type: Number,
    required: true
  },
  opponentRatingChange: {
    type: Number,
    default: 0
  },
  playedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const Challenge = mongoose.model('Challenge', ChallengeSchema);
const GameLog = mongoose.model('GameLog', GameLogSchema);

module.exports = { Challenge, GameLog };
