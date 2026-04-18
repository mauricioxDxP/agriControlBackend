import express from 'express';
import cors from 'cors';
import https from 'https';
import http from 'http';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import productRoutes from './routes/products';
import lotRoutes from './routes/lots';
import fieldRoutes from './routes/fields';
import applicationRoutes from './routes/applications';
import movementRoutes from './routes/movements';
import tancadaRoutes from './routes/tancadas';
import tankRoutes from './routes/tanks';
import syncRoutes from './routes/sync';
import settingsRoutes from './routes/settings';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Load SSL certificates (default true for development)
const httpsEnabled = process.env.HTTPS !== 'false';
let server: https.Server | http.Server;

if (httpsEnabled) {
  const httpsOptions = {
    key: fs.readFileSync('../frontend/key.pem'),
    cert: fs.readFileSync('../frontend/cert.pem')
  };
  server = https.createServer(httpsOptions, app);
  console.log('🔒 HTTPS enabled');
} else {
  server = http.createServer(app);
}

// Middleware - CORS allowing all origins for mobile access
app.use(cors({
  origin: true, // Allow all origins
  credentials: true
}));
app.use(express.json());

// Rutas API
app.use('/api/products', productRoutes);
app.use('/api/lots', lotRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/movements', movementRoutes);
app.use('/api/tancadas', tancadaRoutes);
app.use('/api/tanks', tankRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString() 
    });
  }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
server.listen(PORT, () => {
  const protocol = httpsEnabled ? 'https' : 'http';
  console.log(`🌱 AgroControl API running on ${protocol}://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export { prisma };
