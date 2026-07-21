const Challenge = require('../models/Challenge');

const defaultChallengesMock = {
  dailyProgress: {
    completed: 0,
    total: 6,
    expiresIn: "00:38" // Initial timer countdown
  },
  categories: [
    { name: "Math", statsCount: 1003, active: true, color: "#FFD23F" },
    { name: "Memory", statsCount: 840, active: false, color: "#4564C6" },
    { name: "Puzzle", statsCount: 512, active: false, color: "#50D1E0" },
    { name: "Logic", statsCount: 620, active: false, color: "#F42F76" }
  ],
  gameModes: [
    {
      title: "Sprint Duels",
      category: "Math",
      description: "RACE TO SOLVE THE MOST IN 1 MINUTE",
      badgeColor: "#F42F76"
    },
    {
      title: "Fast & First",
      category: "Math",
      description: "BE THE FIRST TO ANSWER EACH QUESTION",
      badgeColor: "#4564C6"
    }
  ]
};

exports.getChallengesSummary = async (req, res) => {
  try {
    const dbChallenges = await Challenge.find();
    if (!dbChallenges || dbChallenges.length === 0) {
      return res.json(defaultChallengesMock);
    }
    
    // Group dynamically if DB has items
    const categoriesMap = { Math: 0, Memory: 0, Puzzle: 0, Logic: 0 };
    dbChallenges.forEach(c => {
      if (categoriesMap[c.category] !== undefined) {
        categoriesMap[c.category] += 1;
      }
    });

    const categories = [
      { name: "Math", statsCount: 1003 + categoriesMap["Math"], active: true, color: "#FFD23F" },
      { name: "Memory", statsCount: 840 + categoriesMap["Memory"], active: false, color: "#4564C6" },
      { name: "Puzzle", statsCount: 512 + categoriesMap["Puzzle"], active: false, color: "#50D1E0" },
      { name: "Logic", statsCount: 620 + categoriesMap["Logic"], active: false, color: "#F42F76" }
    ];

    const gameModes = dbChallenges.map(c => ({
      title: c.title,
      category: c.category,
      description: c.description || "QUICK GAME CHALLENGE MODE",
      badgeColor: c.badgeColor
    }));

    res.json({
      dailyProgress: defaultChallengesMock.dailyProgress,
      categories,
      gameModes: gameModes.length > 0 ? gameModes : defaultChallengesMock.gameModes
    });
  } catch (error) {
    console.warn("DB error in getChallengesSummary, using mock fallback:", error.message);
    res.json(defaultChallengesMock);
  }
};
