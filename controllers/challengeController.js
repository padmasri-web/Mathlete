const { Challenge, GameLog } = require('../models/Challenge');

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

    // Count user's completed quests today for progress
    const completedQuestsCount = user ? user.quests.filter(q => q.completed).length : 0;
    const totalQuestsCount = user ? user.quests.length : 1;

    res.json({
      dailyProgress: {
        completed: completedQuestsCount,
        total: totalQuestsCount,
        expiresIn: "23:59"
      },
      categories,
      gameModes
    });
  } catch (error) {
    console.error("Error in getChallengesSummary:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
