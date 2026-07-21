require('dotenv').config();
const express = require('express');
const path = require('path');
const connectDB = require('./config/db');

// Import routes
const userRoutes = require('./routes/userRoutes');
const challengeRoutes = require('./routes/challengeRoutes');
const gameRoutes = require('./routes/gameRoutes');

// Import models for seeding
const User = require('./models/User');
const Challenge = require('./models/Challenge');

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to MongoDB
connectDB();

// Database Seeder function
const seedData = async () => {
  try {
    // Only seed if MongoDB connection is open and active
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected; skipping database seeding. App will run in memory fallback mode.');
      return;
    }

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      await User.create({
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
      });
      console.log('Seeded database with default User statistics.');
    }

    const challengeCount = await Challenge.countDocuments();
    if (challengeCount === 0) {
      await Challenge.create([
        {
          title: "Sprint Duels",
          category: "Math",
          mode: "Sprint Duels",
          description: "RACE TO SOLVE THE MOST IN 1 MINUTE",
          badgeColor: "#F42F76",
          points: 100
        },
        {
          title: "Fast & First",
          category: "Math",
          mode: "Fast & First",
          description: "BE THE FIRST TO ANSWER EACH QUESTION",
          badgeColor: "#4564C6",
          points: 120
        }
      ]);
      console.log('Seeded database with challenge categories.');
    }
  } catch (error) {
    console.error('Seeding database failed:', error.message);
  }
};

// Execute seeding after connection is established
setTimeout(seedData, 2000);

// Configure EJS view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Register API Routes
app.use('/api/user', userRoutes);
app.use('/api/challenges', challengeRoutes);

// Register Game Routes
app.use('/', gameRoutes);

// View Page Routes
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/games/lightsout', (req, res) => {
  res.render('games/lightsOut');
});

app.get('/games/sudoku', (req, res) => {
  res.render('games/sudoko');
});

app.get('/games/crossmath', (req, res) => {
  res.render('games/crossMath');
});

app.get('/games/logic', (req, res) => {
  res.render('games/logicGames');
});

// Fallback to home page
app.get('/{*splat}', (req, res) => {
  res.redirect('/');
});

// Start listening
app.listen(PORT, () => {
  console.log(`Matiks Server listening on http://localhost:${PORT}`);
});
