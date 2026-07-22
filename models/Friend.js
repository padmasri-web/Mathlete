const mongoose = require('mongoose');

const FriendSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure unique index per requester & recipient pair
FriendSchema.index({ requester: 1, recipient: 1 }, { unique: true });

module.exports = mongoose.model('Friend', FriendSchema);
