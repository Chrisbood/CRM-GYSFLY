#!/bin/bash

# Panel de Agente CRM - High-End Admin Console Bootstrapper
# Custom designed for Christian Durán / Panel de Agente

# ANSI Colors
GOLD='\033[1;33m'
TEAL='\033[0;36m'
GREEN='\033[0;32m'
BLUE='\033[1;34m'
NC='\033[0m' # No Color

clear

echo -e "${GOLD}======================================================================${NC}"
echo -e "${GOLD}   ____ __   __ ____   _____ _      __   __  _____ ____  __  __${NC}"
echo -e "${GOLD}  / ___|\\ \\ / // ___| |  ___| |     \\ \\ / / |_   _|  _ \\|  \\/  |${NC}"
echo -e "${GOLD} | |  _  \\ V / \\___ \\ | |_  | |      \\ V /    | | | |_) | |\\/| |${NC}"
echo -e "${GOLD} | |_| |  | |   ___) ||  _| | |___    | |     | | |  _ <| |  | |${NC}"
echo -e "${GOLD}  \\____|  |_|  |____/ |_|   |_____|   |_|     |_| |_| \\_\\_|  |_|${NC}"
echo -e "${GOLD}======================================================================${NC}"
echo -e "${TEAL}           ENTERPRISE B2B TRAVEL MANAGEMENT PLATFORM${NC}"
echo -e "                 Inspired by Elite SaaS Standards"
echo -e "${GOLD}======================================================================${NC}"
echo ""
echo -e "${BLUE}[*] Inicializando servidor local para Panel de Agente CRM...${NC}"

# Check available environment
PORT=8080

# Function to open browser after a short delay
open_browser() {
    sleep 1.5
    echo -e "${GREEN}[+] Abriendo consola en el navegador por defecto...${NC}"
    open "http://localhost:$PORT"
}

# Start browser opening in background
open_browser &

# Print Credentials and Guides
echo -e "${GOLD}----------------------------------------------------------------------${NC}"
echo -e "🛡️  ${GOLD}CREDenciales de ACCESO (Consola Administrativa)${NC}"
echo -e "   • ${TEAL}Usuario Gerente (Admin):${NC}  admin@agente.com  |  Clave: admin123"
echo -e "   • ${TEAL}Usuario Agente Junior:${NC}  agente@agente.com |  Clave: agente123"
echo -e "   • ${TEAL}Clave de Restauración:${NC}  admin123"
echo -e "${GOLD}----------------------------------------------------------------------${NC}"
echo -e "💡  ${GREEN}Soporte Multiusuario & Rooming List & Services Builder Activos${NC}"
echo -e "    El pilar central de base de datos se almacena localmente en su equipo."
echo -e "${GOLD}----------------------------------------------------------------------${NC}"
echo ""

# Attempt Node.js HTTP server, fallback to Python3, fallback to simple browser file protocol opening
if command -v npx &> /dev/null; then
    echo -e "${GREEN}[✓] Detectado Node.js / npx. Iniciando con http-server local...${NC}"
    echo -e "${TEAL}Servidor activo en: http://localhost:$PORT${NC}"
    echo -e "Presiona CTRL+C para apagar el servidor de forma segura."
    echo ""
    npx -y http-server -p $PORT --silent
elif command -v python3 &> /dev/null; then
    echo -e "${GREEN}[✓] Detectado Python3. Iniciando con http.server local...${NC}"
    echo -e "${TEAL}Servidor activo en: http://localhost:$PORT${NC}"
    echo -e "Presiona CTRL+C para apagar el servidor de forma segura."
    echo ""
    python3 -m http.server $PORT
else
    echo -e "${GOLD}[!] Servidor local no disponible. Abriendo archivo HTML directamente...${NC}"
    open index.html
fi
