// ==============================================================================
// VERCEL SERVERLESS ENTRYPOINT - PLURIX ORGANIZER
// ==============================================================================

import { createExpressApp } from '../server/app.js';

const app = createExpressApp();

export default app;
