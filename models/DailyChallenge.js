const mongoose = require('mongoose');

const DailyChallengeSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
    unique: true,
    index: true // Formatted YYYY-MM-DD (Asia/Kolkata timezone date string)
  },
  lightsOut: {
    gridDifficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium'
    },
    targetMoves: {
      type: Number,
      default: 15
    },
    timeLimit: {
      type: Number,
      default: 120 // Seconds
    },
    rewardXP: {
      type: Number,
      default: 150
    }
  },
  memoryMatch: {
    pairCount: {
      type: Number,
      default: 8 // 16 cards total
    },
    timeLimit: {
      type: Number,
      default: 60 // Seconds
    },
    rewardXP: {
      type: Number,
      default: 150
    }
  },
  sudoku: {
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium'
    },
    initialClues: {
      type: Number,
      default: 35
    },
    targetTime: {
      type: Number,
      default: 300 // Seconds (5 minutes)
    },
    rewardXP: {
      type: Number,
      default: 200
    }
  },
  snake: {
    targetScore: {
      type: Number,
      default: 100
    },
    speed: {
      type: String,
      enum: ['Normal', 'Fast', 'Hyper'],
      default: 'Normal'
    },
    rewardXP: {
      type: Number,
      default: 150
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('DailyChallenge', DailyChallengeSchema);
