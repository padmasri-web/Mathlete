const mongoose = require('mongoose');

const connectDB = () => {
  const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/matiks';
  
  return mongoose.connect(mongoURI)
    .then((conn) => {
      console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
    })
    .catch((error) => {
      console.error(`❌ MongoDB Connection Error: ${error.message}`);
    });
};

module.exports = connectDB;
