const User = require('../models/Profile');
const { Challenge, GameLog } = require('../models/Challenge');

exports.getUserProfile = async (req, res) => {
  try {
    let user = req.user || await User.findOne();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Retrieve recent game history logs from DB
    const gameLogs = await GameLog.find({ user: user._id })
      .populate('challenge')
      .sort({ playedAt: -1 })
      .limit(2);

    res.json({
      ...user.toObject(),
      gameLogs
    });
  } catch (error) {
    console.error("DB error in getUserProfile:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateUserStats = async (req, res) => {
  try {
    const { coins, drops, xp, collage, socials, name, username, bio, country, avatarUrl } = req.body;
    let user = req.user || await User.findOne();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (coins !== undefined) user.coins = coins;
    if (drops !== undefined) user.drops = drops;
    if (xp !== undefined) user.xp = xp;
    if (collage !== undefined) user.collage = collage;
    if (socials !== undefined) user.socials = socials;
    if (name !== undefined) user.name = name;
    if (username !== undefined) user.username = username;
    if (bio !== undefined) user.bio = bio;
    if (country !== undefined) user.country = country;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    await user.save();
    return res.json(user);
  } catch (error) {
    console.error("DB error in updateUserStats:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

exports.saveGameLog = async (req, res) => {
  try {
    const { category, mode, playerScore, opponentName, opponentScore } = req.body;
    let user = req.user || await User.findOne();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find matching challenge
    let challenge = await Challenge.findOne({ mode });
    if (!challenge) {
      challenge = await Challenge.create({
        title: mode,
        category: category || 'Math',
        mode: mode,
        description: `${mode.toUpperCase()} GAME MODE`
      });
    }

    // Generate rating changes (winner +3, loser -3)
    const playerRatingChange = playerScore >= opponentScore ? 3 : -3;
    const opponentRatingChange = opponentScore > playerScore ? 3 : -3;

    const log = await GameLog.create({
      user: user._id,
      challenge: challenge._id,
      category: category || challenge.category,
      mode: mode,
      playerScore,
      playerRatingChange,
      opponentName: opponentName || 'Opponent',
      opponentScore: opponentScore !== undefined ? opponentScore : 0,
      opponentRatingChange
    });

    // Update the rating dynamically in user schema
    const cat = (category || challenge.category || 'Math').toLowerCase();
    if (!user.ratings) {
      user.ratings = { math: 1000, logic: 1000, memory: 1000, puzzle: 1000 };
    }
    user.ratings[cat] = (user.ratings[cat] || 1000) + playerRatingChange;
    
    // Increment coins and XP based on game score
    user.xp = (user.xp || 0) + Math.floor(playerScore / 10);
    user.coins = (user.coins || 0) + Math.floor(playerScore / 10);
    
    user.markModified('ratings');
    await user.save();

    res.json(log);
  } catch (error) {
    console.error("DB error in saveGameLog:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
