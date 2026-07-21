const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    default: 'Jhalak Yadav'
  },
  username: {
    type: String,
    default: 'jhalak_yadav'
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  coins: {
    type: Number,
    default: 500
  },
  drops: {
    type: Number,
    default: 0
  },
  xp: {
    type: Number,
    default: 0
  },
  onlineFriends: [{
    name: String,
    avatar: String,
    status: {
      type: String,
      enum: ['online', 'idle', 'offline'],
      default: 'online'
    },
    color: String // Hex or variable color string for standard colors
  }],
  quests: [{
    title: String,
    category: String,
    currentProgress: {
      type: Number,
      default: 0
    },
    targetProgress: {
      type: Number,
      default: 1
    },
    completed: {
      type: Boolean,
      default: false
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
