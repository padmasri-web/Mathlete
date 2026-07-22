const User = require('../models/Profile');
const { Challenge, GameLog } = require('../models/Challenge');

/**
 * ============================================================================
 * INTERVIEWER TESTING FEATURE: DAILY STREAK & TIME DIFFERENCE MULTIPLIER
 * ============================================================================
 * To test and demonstrate the daily streak functionality during an interview:
 * Change `MOCK_HOURS_PASSED` to simulate hours passing without waiting 24 hours.
 * 
 * Example Interview Test Cases:
 * - MOCK_HOURS_PASSED = 0  -> Normal login behavior.
 * - MOCK_HOURS_PASSED = 25 -> Simulates logging in after 25 hours. 
 *                             Increments streak (+1), sets isStreakActive = true,
 *                             and lights up the fire icon in BRIGHT RED (#ef4444) in the UI!
 * - MOCK_HOURS_PASSED = 50 -> Simulates missing over 48 hours (Resets streak to 1).
 * ============================================================================
 */
const MOCK_HOURS_PASSED = 0; // <-- INTERVIEW DEMO VARIABLE: Change to 25 to test 24h streak red flame!

function checkAndUpdateDailyStreak(user) {
  const now = new Date();
  const lastLogin = user.lastLoginAt ? new Date(user.lastLoginAt) : now;
  
  // Real time difference in hours + mock hours multiplier for interview testing
  let hoursDiff = (now - lastLogin) / (1000 * 60 * 60);
  if (MOCK_HOURS_PASSED > 0) {
    hoursDiff += MOCK_HOURS_PASSED;
  }

  // If logging in after 24 hours (up to 48 hours)
  if (hoursDiff >= 24 && hoursDiff < 48) {
    user.streak = (user.streak || 0) + 1;
    user.drops = user.streak;
    user.isStreakActive = true;
  } else if (hoursDiff >= 48) {
    // Reset streak if user missed more than 48 hours
    user.streak = 1;
    user.drops = 1;
    user.isStreakActive = true;
  } else if (!user.streak || user.streak === 0) {
    // Initial streak for new active logins
    user.streak = 1;
    user.drops = 1;
    user.isStreakActive = true;
  }

  user.lastLoginAt = now;
  return user;
}

exports.getUserProfile = async (req, res) => {
  try {
    let user = req.user || await User.findOne();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Process & update daily streak logic
    user = checkAndUpdateDailyStreak(user);
    await user.save();

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

    // Calculate score using time-based scoring formula if timeTakenSeconds is provided:
    // Score = max(0, BasePoints - (TimeTakenInSeconds * PenaltyRate) + DifficultyBonus)
    const timeTaken = req.body.timeTakenSeconds;
    const diffBonus = req.body.difficultyBonus !== undefined ? req.body.difficultyBonus : 200;
    const basePts = req.body.basePoints || 1000;
    const penRate = req.body.penaltyRate || 2;

    let computedScore = playerScore;
    if (timeTaken !== undefined) {
      computedScore = Math.max(0, Math.floor(basePts - (timeTaken * penRate) + diffBonus));
    }

    // Generate rating changes (winner +3, loser -3)
    const playerRatingChange = computedScore >= opponentScore ? 3 : -3;
    const opponentRatingChange = opponentScore > computedScore ? 3 : -3;

    const log = await GameLog.create({
      user: user._id,
      challenge: challenge._id,
      category: category || challenge.category,
      mode: mode,
      playerScore: computedScore,
      playerRatingChange,
      opponentName: opponentName || 'Opponent',
      opponentScore: opponentScore !== undefined ? opponentScore : 0,
      opponentRatingChange
    });

    // Update the category rating dynamically in user schema
    const cat = (category || challenge.category || 'Math').toLowerCase();
    if (!user.ratings) {
      user.ratings = { math: 0, logic: 0, memory: 0, puzzle: 0 };
    }
    user.ratings[cat] = Math.max(0, (user.ratings[cat] || 0) + playerRatingChange);
    
    // Increment total XP, coins, and overall rank rating securely in database
    user.xp = (user.xp || 0) + Math.floor(computedScore / 5);
    user.coins = (user.coins || 0) + Math.floor(computedScore / 10);
    user.rankRating = (user.rankRating || 0) + Math.floor(computedScore / 10);

    // Dynamic Badge Tier Unlocking (1200 points threshold)
    if (user.rankRating >= 4800) {
      user.badgeTier = 'CHAMPION';
    } else if (user.rankRating >= 3600) {
      user.badgeTier = 'MASTER';
    } else if (user.rankRating >= 2400) {
      user.badgeTier = 'PRO';
    } else if (user.rankRating >= 1200) {
      user.badgeTier = 'AMATEUR';
    } else {
      user.badgeTier = 'NOVICE';
    }
    
    user.markModified('ratings');
    await user.save();

    res.json({
      ...log.toObject(),
      computedScore,
      updatedUser: {
        xp: user.xp,
        coins: user.coins,
        rankRating: user.rankRating,
        badgeTier: user.badgeTier
      }
    });
  } catch (error) {
    console.error("DB error in saveGameLog:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
