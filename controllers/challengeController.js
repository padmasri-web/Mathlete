const { Challenge } = require('../models/Challenge');
const DailyChallenge = require('../models/DailyChallenge');
const { generateDailyChallenge, getISTDateString } = require('../utils/cronJobs');

// 1. Fetch single active daily challenge for today (Asia/Kolkata date)
exports.getActiveDailyChallenge = async (req, res) => {
  try {
    const todayDate = getISTDateString();

    // Query MongoDB for today's challenge document
    let challenge = await DailyChallenge.findOne({ date: todayDate });

    // Fallback: If not found, generate on the fly
    if (!challenge) {
      console.log(`[Controller] Daily Challenge for ${todayDate} not found. Generating now...`);
      challenge = await generateDailyChallenge();
    }

    if (res && res.json) {
      return res.json({
        success: true,
        date: todayDate,
        challenge
      });
    }

    return challenge;
  } catch (error) {
    console.error("Error in getActiveDailyChallenge:", error.message);
    if (res && res.status) {
      return res.status(500).json({ success: false, message: "Failed to retrieve active daily challenge." });
    }
    throw error;
  }
};

// 2. Fetch challenges summary for the dashboard view
exports.getChallengesSummary = async (req, res) => {
  try {
    const dbChallenges = await Challenge.find();
    const user = req.user;

    const mathRating = user && user.ratings ? user.ratings.math : 1000;
    const logicRating = user && user.ratings ? user.ratings.logic : 1000;
    const memoryRating = user && user.ratings ? user.ratings.memory : 1000;
    const puzzleRating = user && user.ratings ? user.ratings.puzzle : 1000;

    const categories = [
      { name: "Math", statsCount: mathRating, active: true, color: "#FFD23F" },
      { name: "Memory", statsCount: memoryRating, active: false, color: "#4564C6" },
      { name: "Puzzle", statsCount: puzzleRating, active: false, color: "#50D1E0" },
      { name: "Logic", statsCount: logicRating, active: false, color: "#F42F76" }
    ];

    const gameModes = dbChallenges.map(c => ({
      title: c.title,
      category: c.category,
      description: c.description || "QUICK GAME CHALLENGE MODE",
      badgeColor: c.badgeColor
    }));

    const todayDate = getISTDateString();
    let dailyChallenge = await DailyChallenge.findOne({ date: todayDate });
    if (!dailyChallenge) {
      dailyChallenge = await generateDailyChallenge();
    }

    const completedQuestsCount = user ? user.quests.filter(q => q.completed).length : 0;
    const totalQuestsCount = user ? user.quests.length : 1;

    res.json({
      dailyProgress: {
        completed: completedQuestsCount,
        total: totalQuestsCount,
        expiresIn: "23:59"
      },
      categories,
      gameModes,
      dailyChallenge
    });
  } catch (error) {
    console.error("Error in getChallengesSummary:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
