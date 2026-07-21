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

module.exports = mongoose.model('Challenge', ChallengeSchema);
