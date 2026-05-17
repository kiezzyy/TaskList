import 'dotenv/config';
import { createServer } from './src/app.js';
import { config } from './src/config/appConfig.js';
import { ensureDefaultStatuses } from './src/database/seed.js';

await ensureDefaultStatuses();

const app = createServer();

app.listen(config.port, () => {
  console.log(`TaskList API running on http://localhost:${config.port}`);
});
