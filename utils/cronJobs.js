const cron = require('node-cron');
const DailyChallenge = require('../models/DailyChallenge');

// Formats today's date YYYY-MM-DD explicitly in Asia/Kolkata timezone
function getISTDateString() {
  const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
  const formatter = new Intl.DateTimeFormat('en-CA', options); // en-CA outputs YYYY-MM-DD
  return formatter.format(new Date());
}

// Fixed, static daily challenge criteria (same for every user and every day)
const FIXED_DAILY_CHALLENGE = {
  lightsOut: {
    gridDifficulty: 'Medium',
    targetMoves: 15,
    timeLimit: 120,
    rewardXP: 150
  },
  memoryMatch: {
    pairCount: 8,
    timeLimit: 60,
    rewardXP: 150
  },
  sudoku: {
    difficulty: 'Medium',
    initialClues: 35,
    targetTime: 300,
    rewardXP: 200
  }
};

// Ensures the fixed daily challenge document is present in MongoDB
async function generateDailyChallenge() {
  const todayDate = getISTDateString();

  try {
    const challengeData = {
      date: todayDate,
      ...FIXED_DAILY_CHALLENGE
    };

    // Upsert single daily challenge for today in MongoDB with fixed parameters
    const activeChallenge = await DailyChallenge.findOneAndUpdate(
      { date: todayDate },
      challengeData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`[Cron] Fixed Daily Challenge synchronized for IST Date ${todayDate}:`, activeChallenge._id);

    // Delete previous day's documents
    const deleteResult = await DailyChallenge.deleteMany({ date: { $ne: todayDate } });
    if (deleteResult.deletedCount > 0) {
      console.log(`[Cron] Removed ${deleteResult.deletedCount} outdated daily challenge document(s).`);
    }

    return activeChallenge;
  } catch (error) {
    console.error('[Cron] Error setting daily challenge:', error.message);
  }
}

// Initialize node-cron schedule with explicit Asia/Kolkata timezone
function initDailyChallengeCron() {
  const todayDate = getISTDateString();

  // Startup Sync: Guarantee fixed criteria are synchronized in MongoDB
  generateDailyChallenge().then(() => {
    console.log(`[Startup] Fixed Daily Challenge synchronized for IST Date ${todayDate}.`);
  }).catch(err => {
    console.error('[Startup] Failed to sync DailyChallenge on boot:', err.message);
  });

  // Schedule cron job at 12:00 AM (midnight) IST
  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron] 12:00 AM Midnight IST reached. Synchronizing Daily Challenges...');
    await generateDailyChallenge();
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  console.log('[Cron] Daily Challenge Cron Job initialized (0 0 * * * Asia/Kolkata).');
}

module.exports = {
  FIXED_DAILY_CHALLENGE,
  generateDailyChallenge,
  initDailyChallengeCron,
  getISTDateString
};
