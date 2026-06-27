import express from 'express';
import cors from 'cors';
import { fileRoutes } from './routes/files.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/files', fileRoutes);

app.listen(PORT, () => {
  console.log(`FileVault API server running on http://localhost:${PORT}`);
});
