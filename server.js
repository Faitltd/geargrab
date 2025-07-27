import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { handler } from './build/handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

const PORT = process.env.PORT || 8080;

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('healthy');
});

// Serve static files from build/client directory
app.use(express.static(path.join(__dirname, 'build/client')));

// Let SvelteKit handle everything else, including client-side routing
app.use(handler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
