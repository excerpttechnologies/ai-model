/**
 * PM2 ecosystem config — edu ai Student Assessment Platform
 *
 * Entry point: app.py  →  imports FastAPI app from rag_api.py
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *   pm2 startup   ← run the printed command to survive reboots
 *
 * Check logs:
 *   pm2 logs rag-backend --lines 60
 */
module.exports = {
  apps: [
    {
      name: 'rag-backend',

      // Point uvicorn at app:app (app.py → rag_api.py → FastAPI instance)
      interpreter: 'none',
      script: '/var/www/edu ai/venv/bin/uvicorn',
      args: 'app:app --host 127.0.0.1 --port 8090 --workers 1',

      // ── CHANGE THIS to your actual project path on the VPS ──
      cwd: '/var/www/edu ai',

      // ── Environment variables ─────────────────────────────────────────────
      // Replace the values below before deploying.
      // Never commit real API keys to git.
      env: {
        LLM_BACKEND:      'nvidia',
        NVIDIA_API_KEY:   'nvapi-REPLACE_WITH_YOUR_KEY',
        CURRICULUM_DB:    '/var/www/edu ai/curriculum_db',
        CORS_ORIGINS:     'https://YOUR_DOMAIN,http://YOUR_DOMAIN',
        PYTHONUNBUFFERED: '1',
        PORT:             '8090',
      },

      // ── Process settings ──────────────────────────────────────────────────
      instances:          1,
      autorestart:        true,
      watch:              false,
      max_memory_restart: '512M',
      restart_delay:      3000,

      // ── Logs ──────────────────────────────────────────────────────────────
      out_file:        '/var/www/edu ai/logs/rag-backend-out.log',
      error_file:      '/var/www/edu ai/logs/rag-backend-err.log',
      merge_logs:      true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
