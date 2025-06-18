import { handler } from './build/handler.js';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the static directory
app.use(express.static(join(__dirname, 'static')));

// Serve built client files
app.use(express.static(join(__dirname, 'build/client')));

// Handle SvelteKit requests
app.use(handler);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
