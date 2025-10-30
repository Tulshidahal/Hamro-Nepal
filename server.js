import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve static assets from the root of the project
app.use(express.static(__dirname));

// Fallback to index.html for any other route (SPA-style)
app.use((_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Hamro Vacation site running on http://localhost:${port}`);
});
