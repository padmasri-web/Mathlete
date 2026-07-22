const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    default: ''
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  country: {
    type: String,
    default: 'India'
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
  ratings: {
    math: { type: Number, default: 1000 },
    logic: { type: Number, default: 1000 },
    memory: { type: Number, default: 1000 },
    puzzle: { type: Number, default: 1000 }
  },
  collage: {
    type: String,
    default: ''
  },
  socials: {
    type: String,
    default: ''
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

UserSchema.methods.validPassword = function(password) {
  const crypto = require('crypto');
  const hash = crypto.pbkdf2Sync(password, 'salt', 1000, 64, 'sha512').toString('hex');
  return this.password === hash;
};

module.exports = mongoose.model('User', UserSchema);
