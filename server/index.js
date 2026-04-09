import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables FIRST
const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

// Start the server
async function startServer() {
  // Now dynamically import routes AFTER env is loaded
  const { ocrRouter } = await import('./routes/ocr.js');
  const { chatRouter } = await import('./routes/chat.js');
  const { embedRouter } = await import('./routes/embed.js');
  const { dietRouter } = await import('./routes/diet.js');
  const { uploadRouter } = await import('./routes/upload.js');

  const app = express();
  const SERVER_PORT = parseInt(process.env.SERVER_PORT || '3003', 10);

  // Middleware
  app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'] }));
  app.use(express.json({ limit: '50mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'ImmunoTrace API' });
  });

  // Routes
  app.use('/api/ocr', ocrRouter);
  app.use('/api/chat', chatRouter);
  app.use('/api/embed', embedRouter);
  app.use('/api/diet', dietRouter);
  app.use('/api/upload', uploadRouter);

  // Error handler
  app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  // Start listening with port fallback
  const server = app.listen(SERVER_PORT, () => {
    console.log(`🚀 ImmunoTrace API running on http://localhost:${SERVER_PORT}`);
    console.log(`   Mistral AI: ${process.env.MISTRAL_API_KEY ? '✅ configured' : '❌ missing key'}`);
    console.log(`   Supabase:   ${process.env.SUPABASE_URL ? '✅ configured' : '❌ missing URL'}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = SERVER_PORT + 1;
      console.warn(`⚠️  Port ${SERVER_PORT} is already in use. Trying port ${nextPort}...`);
      app.listen(nextPort, () => {
        console.log(`🚀 ImmunoTrace API running on http://localhost:${nextPort}`);
        console.log(`   Mistral AI: ${process.env.MISTRAL_API_KEY ? '✅ configured' : '❌ missing key'}`);
        console.log(`   Supabase:   ${process.env.SUPABASE_URL ? '✅ configured' : '❌ missing URL'}`);
      });
    } else {
      throw err;
    }
  });
}

startServer().catch(err => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});
