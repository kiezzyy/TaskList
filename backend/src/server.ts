import 'dotenv/config';
import { createServer } from './app.js';
import { config } from './config/appConfig.js';
import { initializeDatabase } from './database/initSchema.js';
import { ensureSeedData } from './database/seed.js';

await initializeDatabase();
await ensureSeedData();

createServer().listen(config.port, config.host, () => {
  console.log(`TaskList API running on http://${config.host}:${config.port}`);
});
