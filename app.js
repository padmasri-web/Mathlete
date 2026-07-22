require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Import routes
const userRoutes = require('./routes/userRoutes');
const challengeRoutes = require('./routes/challengeRoutes');
const gameRoutes = require('./routes/gameRoutes');
const memoryMathRoutes = require('./routes/MemoryMathRoutes');
const snakeGameRoutes = require('./routes/snakeGameRoutes');
const authRoutes = require('./routes/authRoutes');
const friendRoutes = require('./routes/friendRoutes');

// Import models for seeding
const User = require('./models/Profile');
const { Challenge, GameLog } = require('./models/Challenge');
const Friend = require('./models/Friend');

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
      const crypto = require('crypto');
      const seedPasswordHash = crypto.pbkdf2Sync('password', 'salt', 1000, 64, 'sha512').toString('hex');
      
      await User.create({
        name: 'Jhalak Yadav',
        username: 'jhalak_yadav',
        password: seedPasswordHash,
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
    }

    const gameLogCount = await GameLog.countDocuments();
    if (gameLogCount === 0) {
      const user = await User.findOne();
      const challenge = await Challenge.findOne({ mode: "Sprint Duels" });
      if (user && challenge) {
        await GameLog.create([
          {
            user: user._id,
            challenge: challenge._id,
            category: "Math",
            mode: "Sprint Duels",
            playerScore: 11,
            playerRatingChange: 3,
            opponentName: "adiityabaliyan864",
            opponentScore: 10,
            opponentRatingChange: -3,
            playedAt: new Date("2026-07-14T20:09:00Z")
          }
        ]);
        console.log('Seeded database with default game history logs.');
      }
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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Express Session Middleware
app.use(session({
  secret: 'mathlete-super-secret-key-9779',
  resave: false,
  saveUninitialized: false
}));

// Initialize Passport and Session support
app.use(passport.initialize());
app.use(passport.session());

// Passport Strategy Configuration
passport.use(new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password'
}, async (username, password, done) => {
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return done(null, false, { message: 'Incorrect username.' });
    }
    if (!user.validPassword(password)) {
      return done(null, false, { message: 'Incorrect password.' });
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Serve frontend static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Register Auth & API Routes
app.use('/auth', authRoutes);

// Session Locals Middleware
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

app.use('/api/user', userRoutes);
app.use('/api/challenges', challengeRoutes);

// Register Game & Friend Routes
app.use('/', gameRoutes);
app.use('/', friendRoutes);

// Authentication Check Middleware
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth');
};

// View Page Routes
app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    return res.render('index');
  }
  res.redirect('/auth');
});

app.get('/auth', (req, res) => {
  res.render('auth/landing');
});

app.get('/profile', ensureAuthenticated, async (req, res) => {
  try {
    const user = req.user || await User.findOne();
    const lastChallenge = await Challenge.findOne({ mode: "Sprint Duels" }) || { title: "Sprint Duels", category: "Math" };
    
    let gameLogs = [];
    let friendsCount = 0;
    if (user) {
      gameLogs = await GameLog.find({ user: user._id })
        .populate('challenge')
        .sort({ playedAt: -1 })
        .limit(2); // Limit to 2 logs on the profile card

      friendsCount = await Friend.countDocuments({
        $or: [
          { requester: user._id, status: 'accepted' },
          { recipient: user._id, status: 'accepted' }
        ]
      });
    }
    
    res.render('profile', { user, lastChallenge, gameLogs, friendsCount });
  } catch (err) {
    console.warn("Failed to retrieve profile data from MongoDB:", err);
    res.render('profile', { user: null, lastChallenge: { title: "Sprint Duels", category: "Math" }, gameLogs: [], friendsCount: 0 });
  }
});

app.get('/profile/history', ensureAuthenticated, async (req, res) => {
  try {
    const user = req.user || await User.findOne();
    const gameLogs = user ? await GameLog.find({ user: user._id }).populate('challenge').sort({ playedAt: -1 }) : [];
    res.render('history', { user, gameLogs });
  } catch (err) {
    console.warn("Failed to retrieve match history:", err);
    res.render('history', { user: null, gameLogs: [] });
  }
});

app.get('/games/lightsout', ensureAuthenticated, (req, res) => {
  res.render('games/lightsOut');
});

app.get('/games/sudoku', ensureAuthenticated, (req, res) => {
  res.render('games/sudoku');
});

app.get('/games/crossmath', ensureAuthenticated, (req, res) => {
  res.render('games/crossMath');
});

app.get('/games/logic', ensureAuthenticated, (req, res) => {
  res.render('games/logicGames');
});

app.use('/games/memorymath', ensureAuthenticated, memoryMathRoutes);
app.use('/', ensureAuthenticated, snakeGameRoutes);

// Fallback to home page
app.get('/{*splat}', (req, res) => {
  res.redirect('/');
});

// Start listening
app.listen(PORT, () => {
  console.log(`Matiks Server listening on http://localhost:${PORT}`);
});
