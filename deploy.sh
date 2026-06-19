#!/bin/bash
# ============================================================================
#  deploy.sh  —  edu ai Student Assessment Platform  —  Linux VPS Deployment
#  Run this on your VPS as a non-root user with sudo privileges.
#  Usage: bash deploy.sh
# ============================================================================
set -e   # exit on any error

# ── EDIT THESE ────────────────────────────────────────────────────────────────
DOMAIN="YOUR_DOMAIN_OR_SERVER_IP"
NVIDIA_API_KEY="nvapi-REPLACE_WITH_YOUR_KEY"
PROJECT_DIR="/var/www/edu ai"
REPO_URL="https://github.com/YOUR_USERNAME/YOUR_REPO.git"   # or use scp/rsync
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "======================================================"
echo "  edu ai Platform — VPS Deployment"
echo "======================================================"
echo ""

# ── 1. System packages ────────────────────────────────────────────────────────
echo "[1/9] Installing system packages..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y \
  nginx \
  python3 python3-pip python3-venv \
  curl git \
  build-essential \
  certbot python3-certbot-nginx

# ── 2. Node.js (via nvm — avoids version conflicts) ──────────────────────────
echo "[2/9] Installing Node.js 20 via nvm..."
if ! command -v nvm &>/dev/null; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi
nvm install 20
nvm use 20
nvm alias default 20

# Install pnpm
npm install -g pnpm

# ── 3. PM2 ────────────────────────────────────────────────────────────────────
echo "[3/9] Installing PM2..."
npm install -g pm2

# ── 4. Ollama (local embeddings) ──────────────────────────────────────────────
echo "[4/9] Installing Ollama..."
curl -fsSL https://ollama.com/install.sh | sh
sudo systemctl enable ollama
sudo systemctl start ollama
sleep 3
ollama pull all-minilm       # embedding model — must match stored vectors

# ── 5. Project directory ─────────────────────────────────────────────────────
echo "[5/9] Setting up project directory..."
sudo mkdir -p "$PROJECT_DIR"
sudo chown -R "$USER:$USER" "$PROJECT_DIR"
mkdir -p "$PROJECT_DIR/logs"

# Clone or copy project
# Option A — git clone (if repo exists):
# git clone "$REPO_URL" "$PROJECT_DIR"
#
# Option B — rsync from your local machine (run on YOUR machine, not VPS):
# rsync -avz --exclude node_modules --exclude .git --exclude venv \
#   ./  user@YOUR_VPS_IP:"$PROJECT_DIR"/
#
# Assuming files are already in $PROJECT_DIR (you copied them manually):
cd "$PROJECT_DIR"

# ── 6. Python venv + backend deps ─────────────────────────────────────────────
echo "[6/9] Setting up Python virtualenv..."
python3 -m venv venv
venv/bin/pip install --upgrade pip
venv/bin/pip install --upgrade pip
venv/bin/pip install -r requirements.txt

# ── 7. Frontend build ─────────────────────────────────────────────────────────
echo "[7/9] Building React frontend..."
pnpm install
pnpm build
# dist/ folder is now ready

# ── 8. Nginx config ───────────────────────────────────────────────────────────
echo "[8/9] Configuring Nginx..."
# Replace YOUR_DOMAIN placeholder in nginx.conf
sed "s/YOUR_DOMAIN/$DOMAIN/g" nginx.conf | sudo tee /etc/nginx/sites-available/edu ai > /dev/null

# Enable site
sudo ln -sf /etc/nginx/sites-available/edu ai /etc/nginx/sites-enabled/edu ai
# Remove default site if present
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t          # test config
sudo systemctl reload nginx
sudo systemctl enable nginx

# ── 9. PM2 — start backend ────────────────────────────────────────────────────
echo "[9/9] Starting backend with PM2..."

# Replace placeholders in ecosystem.config.js
sed -i "s|/var/www/edu ai|$PROJECT_DIR|g" ecosystem.config.js
sed -i "s|nvapi-REPLACE_WITH_YOUR_KEY|$NVIDIA_API_KEY|g" ecosystem.config.js
sed -i "s|YOUR_DOMAIN|$DOMAIN|g" ecosystem.config.js

pm2 start ecosystem.config.js
pm2 save

# Register PM2 to start on reboot
pm2_startup=$(pm2 startup | tail -1)
echo ""
echo ">>> Run this command to enable PM2 on reboot:"
echo "    $pm2_startup"
echo ""

# ── Done ─────────────────────────────────────────────────────────────────────
echo "======================================================"
echo "  Deployment complete!"
echo "  Frontend : http://$DOMAIN"
echo "  Backend  : http://$DOMAIN/api/health"
echo "  PM2 logs : pm2 logs rag-backend"
echo "======================================================"
