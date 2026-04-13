// Vercel serverless entry — exports the Express app directly.
// Vercel routes /api/* here via vercel.json rewrites.
module.exports = require('../server/app.cjs');
