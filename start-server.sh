#!/usr/bin/env bash
# Start Backend with External IP Configuration

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🚀 PUnova Backend - Starting Server              ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════╝${NC}\n"

# Get local IP
LOCAL_IP=$(node -e "const os = require('os'); const ifaces = os.networkInterfaces(); for (const name of Object.keys(ifaces)) { for (const iface of ifaces[name]) { if (iface.family === 'IPv4' && !iface.internal) { console.log(iface.address); process.exit(0); } } }")

PORT=${PORT:-3000}

echo -e "${GREEN}✅ Configuration:${NC}"
echo -e "   Host: 0.0.0.0 (listening on all interfaces)"
echo -e "   Port: $PORT"
echo -e "   Local IP: $LOCAL_IP\n"

echo -e "${YELLOW}🔗 Access URLs:${NC}"
echo -e "   • Localhost:  ${BLUE}http://localhost:$PORT/api/v1${NC}"
echo -e "   • Network:    ${BLUE}http://$LOCAL_IP:$PORT/api/v1${NC}"
echo -e "   • Emulator:   ${BLUE}http://10.0.2.2:$PORT/api/v1${NC}\n"

echo -e "${YELLOW}📱 Flutter Configuration:${NC}"
echo -e "   ${BLUE}flutter run --dart-define=BACKEND_IP=$LOCAL_IP:$PORT${NC}\n"

echo -e "${YELLOW}📋 Environment:${NC}"
echo -e "   NODE_ENV: ${BLUE}${NODE_ENV:-development}${NC}"
echo -e "   Database: ${BLUE}Neon PostgreSQL${NC}\n"

echo -e "${YELLOW}🔗 Health Check:${NC}"
echo -e "   ${BLUE}curl http://$LOCAL_IP:$PORT/api/v1/health${NC}\n"

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Start the server
npm start
