import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import productRoutes from './routes/products';
import lotRoutes from './routes/lots';
import fieldRoutes from './routes/fields';
import applicationRoutes from './routes/applications';
import movementRoutes from './routes/movements';
import containerRoutes from './routes/containers';
import tancadaRoutes from './routes/tancadas';
import tankRoutes from './routes/tanks';
import syncRoutes from './routes/sync';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Rutas API
app.use('/api/products', productRoutes);
app.use('/api/lots', lotRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/movements', movementRoutes);
app.use('/api/containers', containerRoutes);
app.use('/api/tancadas', tancadaRoutes);
app.use('/api/tanks', tankRoutes);
app.use('/api/sync', syncRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🌱 AgroControl API running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export { prisma };
