const mongoose = require('mongoose');

let connectingPromise = null;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectingPromise) return connectingPromise;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');

  connectingPromise = mongoose
    .connect(uri, {
      serverSelectionTimeoutMS: 8000,
    })
    .then((m) => {
      console.log('[db] connected:', m.connection.host, '/', m.connection.name);
      return m.connection;
    })
    .catch((err) => {
      connectingPromise = null;
      throw err;
    });

  return connectingPromise;
}

module.exports = { connectDB, mongoose };
