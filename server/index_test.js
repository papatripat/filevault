import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import { fileRoutes } from './routes/files.js';
import { aiRoutes } from './routes/ai.js';

const app = express();
const PORT = 3003;

app.use(cors());
app.use(express.json());

app.use('/api/files', fileRoutes);
app.use('/api/ai', aiRoutes);

app.listen(PORT, () => {
  console.log(`FileVault API server running on http://localhost:${PORT}`);
});
