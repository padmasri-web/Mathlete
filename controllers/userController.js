const User = require('../models/User');

const defaultUserMock = {
  name: 'Jhalak Yadav',
  username: 'jhalak_yadav',
  coins: 500,
  drops: 0,
  xp: 0,
  onlineFriends: [
    { name: 'YOU', avatar: 'J', status: 'online', color: '#4564C6' },
    { name: 'SIDDNT', avatar: '', status: 'online', color: '#F42F76' },
    { name: 'CHANAKY...', avatar: '', status: 'online', color: '#50D1E0' },
    { name: 'DIVYASAI...', avatar: '', status: 'online', color: '#F58DB4' },
    { name: 'KRISHHH7...', avatar: '', status: 'idle', color: '#B8F3FA' },
    { name: 'ADARSH9...', avatar: '', status: 'idle', color: '#52516E' },
    { name: 'PSEUDOC...', avatar: 'P', status: 'online', color: '#50D1E0' }
  ],
  quests: [
    { title: "Complete today's Puzzle - Sudoku Challenge", category: "Puzzle", currentProgress: 0, targetProgress: 1, completed: false },
    { title: "Play 1 Math - Sprint Duel", category: "Math", currentProgress: 1, targetProgress: 1, completed: true },
    { title: "Play 1 Memory - Mind Snap Duel", category: "Memory", currentProgress: 1, targetProgress: 1, completed: true }
  ]
};

exports.getUserProfile = async (req, res) => {
  try {
    let user = await User.findOne();
    if (!user) {
      return res.json(defaultUserMock);
    }
    res.json(user);
  } catch (error) {
    console.warn("DB error in getUserProfile, using mock fallback:", error.message);
    res.json(defaultUserMock);
  }
};

exports.updateUserStats = async (req, res) => {
  try {
    const { coins, drops, xp } = req.body;
    let user = await User.findOne();
    if (user) {
      if (coins !== undefined) user.coins = coins;
      if (drops !== undefined) user.drops = drops;
      if (xp !== undefined) user.xp = xp;
      await user.save();
      return res.json(user);
    }
    const updatedMock = { 
      ...defaultUserMock, 
      coins: coins !== undefined ? coins : defaultUserMock.coins, 
      drops: drops !== undefined ? drops : defaultUserMock.drops, 
      xp: xp !== undefined ? xp : defaultUserMock.xp 
    };
    res.json(updatedMock);
  } catch (error) {
    console.warn("DB error in updateUserStats, using mock fallback:", error.message);
    res.json({ success: true, message: "Mock stats updated (no active MongoDB connection)" });
  }
};
