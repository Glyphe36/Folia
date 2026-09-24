import express from 'express';
import { createServer as createViteServer } from 'vite';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const PHP_PORT = 3001;

let phpProcess: ChildProcess | null = null;

function startPhpServer(): void {
  try {
    console.log(`[PHP Backend] Starting PHP SQLite server on port ${PHP_PORT}...`);
    phpProcess = spawn('php', ['-S', `0.0.0.0:${PHP_PORT}`, path.resolve(__dirname, 'backend/router.php')], {
      stdio: ['ignore', 'inherit', 'inherit'],
    });

    phpProcess.on('error', (err) => {
      console.error('[PHP Backend] Failed to start PHP server:', err.message);
    });

    phpProcess.on('exit', (code, signal) => {
      console.log(`[PHP Backend] PHP server exited with code ${code}, signal ${signal}`);
    });
  } catch (err: any) {
    console.error('[PHP Backend] Error starting PHP process:', err?.message);
  }
}

function stopPhpServer(): void {
  if (phpProcess) {
    try {
      console.log('[PHP Backend] Stopping PHP server...');
      phpProcess.kill();
      phpProcess = null;
    } catch {
      // Ignore
    }
  }
}

process.on('SIGINT', () => {
  stopPhpServer();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stopPhpServer();
  process.exit(0);
});

process.on('exit', () => {
  stopPhpServer();
});

async function bootstrap() {
  // Start the persistent PHP SQLite API server
  startPhpServer();

  const app = express();

  // Serve static assets from public folder (favicon.ico, apple-touch-icon.png, etc.)
  app.use(express.static(path.resolve(__dirname, 'public')));

  // Simple proxy route for /api -> PHP server on port 3001
  app.all('/api*', async (req, res) => {
    try {
      const targetUrl = `http://127.0.0.1:${PHP_PORT}${req.originalUrl}`;
      const headers: Record<string, string> = {};
      for (const [k, v] of Object.entries(req.headers)) {
        if (v && k !== 'host' && k !== 'content-length') {
          headers[k] = Array.isArray(v) ? v.join(', ') : v;
        }
      }

      const method = req.method;
      let body: any = undefined;
      if (method !== 'GET' && method !== 'HEAD') {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        }
        body = Buffer.concat(chunks);
      }

      const response = await fetch(targetUrl, {
        method,
        headers,
        body,
      });

      res.status(response.status);
      response.headers.forEach((value, name) => {
        // Skip content-encoding if gzipped by php
        if (name.toLowerCase() !== 'content-encoding') {
          res.setHeader(name, value);
        }
      });

      const data = await response.arrayBuffer();
      res.send(Buffer.from(data));
    } catch (err: any) {
      console.error('[API Proxy Error]', err.message);
      res.status(502).json({
        error: 'PHP Backend unavailable',
        details: err.message,
        targetPort: PHP_PORT,
      });
    }
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Folia Server] Application running at http://0.0.0.0:${PORT}`);
    console.log(`[Folia Server] PHP Backend active on http://0.0.0.0:${PHP_PORT}/api`);
  });
}

bootstrap().catch((err) => {
  console.error('[Folia Server] Bootstrap failure:', err);
  process.exit(1);
});
