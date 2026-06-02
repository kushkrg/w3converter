#!/bin/bash

# ==============================================================================
# Hostinger KVM VPS Automated Setup Script — w3converter
# ==============================================================================

# Strict error handling
set -e

# Output styling
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}     Starting Automated Hostinger KVM 2 VPS Setup for w3converter     ${NC}"
echo -e "${BLUE}======================================================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Error: Please run this script as root (sudo bash setup.sh).${NC}"
  exit 1
fi

# Ask for configuration values interactively
echo -e "\n${BLUE}[1/4] Configuring Environment Variables${NC}"
read -p "Enter your Domain Name (e.g. w3converter.com): " DOMAIN_NAME
read -p "Enter Admin Email: " ADMIN_EMAIL
read -sp "Enter Admin Password: " ADMIN_PASSWORD
echo ""
read -sp "Enter a strong PostgreSQL Password: " DB_PASSWORD
echo -e "\n"

# 1. Update OS and Install System Packages
echo -e "${BLUE}[2/4] Installing PDF Engines & System Utilities...${NC}"
apt update && apt upgrade -y
apt install -y curl git ghostscript poppler-utils qpdf libreoffice postgresql postgresql-contrib redis-server nginx certbot python3-certbot-nginx

# 2. Configure PostgreSQL
echo -e "${BLUE}[3/4] Configuring PostgreSQL Database...${NC}"
sudo -u postgres psql -c "CREATE DATABASE pdftools;" || true
sudo -u postgres psql -c "CREATE USER kush WITH PASSWORD '${DB_PASSWORD}';" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE pdftools TO kush;" || true
sudo -u postgres psql -c "ALTER DATABASE pdftools OWNER TO kush;" || true

# 3. Install Node.js, pnpm, and PM2
echo -e "${BLUE}[4/4] Setting up Node.js Environment & PM2...${NC}"
# Install Node.js 22 LTS if not already present
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt install -y nodejs
fi

# Install global utilities
npm install -g pnpm pm2 tsx

# Configure the ecosystem config
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: "w3converter-web",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: "./apps/web",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
    {
      name: "w3converter-worker",
      script: "node_modules/tsx/dist/cli.js",
      args: "src/index.ts",
      cwd: "./apps/worker",
      env: {
        NODE_ENV: "production",
        UPLOAD_DIR: "/tmp/pdftools/uploads",
        OUTPUT_DIR: "/tmp/pdftools/outputs",
      },
    },
    {
      name: "w3converter-janitor",
      script: "node_modules/tsx/dist/cli.js",
      args: "src/index.ts",
      cwd: "./apps/janitor",
      env: {
        NODE_ENV: "production",
        UPLOAD_DIR: "/tmp/pdftools/uploads",
        OUTPUT_DIR: "/tmp/pdftools/outputs",
        JANITOR_INTERVAL_MS: "300000",
      },
    },
  ],
};
EOF

# Generate secure cryptographic secrets
HMAC_SECRET=$(openssl rand -hex 32)
SETTINGS_KEY=$(openssl rand -hex 32)

# Write the production env file
cat > apps/web/.env << EOF
DATABASE_URL="postgresql://kush:${DB_PASSWORD}@localhost:5432/pdftools"
DIRECT_URL="postgresql://kush:${DB_PASSWORD}@localhost:5432/pdftools"
REDIS_URL="redis://localhost:6379"
NEXT_PUBLIC_APP_URL="https://${DOMAIN_NAME}"
NODE_ENV="production"
UPLOAD_DIR="/tmp/pdftools/uploads"
OUTPUT_DIR="/tmp/pdftools/outputs"
HMAC_SECRET="${HMAC_SECRET}"
SETTINGS_ENCRYPTION_KEY="${SETTINGS_KEY}"
ADMIN_EMAIL="${ADMIN_EMAIL}"
ADMIN_PASSWORD="${ADMIN_PASSWORD}"
EOF

# Install dependencies and build
echo -e "${BLUE}Installing monorepo dependencies and building Next.js...${NC}"
pnpm install
pnpm build

# Run database push and seed
echo -e "${BLUE}Configuring database schema and seeding data...${NC}"
pnpm --filter web db:push
node apps/web/prisma/seed-seo.js

# Configure Nginx Reverse Proxy
echo -e "${BLUE}Configuring Nginx Reverse Proxy...${NC}"
cat > /etc/nginx/sites-available/default << EOF
server {
    listen 80;
    server_name ${DOMAIN_NAME} www.${DOMAIN_NAME};

    client_max_body_size 100M; # Allow large PDF uploads

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Restart Nginx
nginx -t
systemctl restart nginx

# Start process managers
echo -e "${BLUE}Starting PM2 process managers...${NC}"
pm2 start ecosystem.config.js
pm2 save
pm2 startup || true

# Restore ownership of the directory to the original non-root user who invoked sudo
if [ -n "$SUDO_USER" ]; then
  chown -R $SUDO_USER:$SUDO_USER .
fi

echo -e "\n${GREEN}======================================================================${NC}"
echo -e "${GREEN}🎉 CONGRATULATIONS! Automated VPS Setup Completed Successfully! 🎉${NC}"
echo -e "${GREEN}======================================================================${NC}"
echo -e "Your web app, background worker, and janitor are all running."
echo -e "Next, run this command to enable HTTPS SSL:"
echo -e "${BLUE}certbot --nginx -d ${DOMAIN_NAME} -d www.${DOMAIN_NAME}${NC}"
echo -e "======================================================================"
