// Vercel serverless entrypoint (ESM wrapper — package.json has "type":"module").
// Imports the Express app from the CJS server bundle.
import app from '../server/app.cjs';
export default app;
