#!/bin/bash

# ==============================================================================
# Stockly - Lanzador Automático para macOS
# ==============================================================================

# 1. Posicionarse en el directorio del proyecto
DIR="$(cd "$(dirname "$0")" && pwd)"
if [ ! -f "$DIR/package.json" ]; then
  DIR="/Users/alejandro/Desktop/Stockly"
fi
cd "$DIR"

echo "======================================================"
echo "          INICIANDO STOCKLY - SISTEMA POS            "
echo "======================================================"
echo ""

# 2. Verificar servicio de PostgreSQL
echo "Verificando base de datos PostgreSQL..."
if command -v brew >/dev/null 2>&1; then
  brew services start postgresql@14 >/dev/null 2>&1 || brew services start postgresql >/dev/null 2>&1
fi

# 3. Liberar puertos en caso de ejecuciones previas
echo "Preparando puertos del servidor..."
lsof -ti:3000 -ti:5001 | xargs kill -9 2>/dev/null || true
sleep 1

# 4. Abrir la aplicación web en el navegador por defecto tras 2 segundos
(sleep 2 && open "http://localhost:3000") &

# 5. Iniciar Frontend y Backend concurrentemente
echo "Iniciando servidor de desarrollo..."
echo "Stockly Web: http://localhost:3000"
echo "Backend API: http://localhost:5001"
echo ""
echo "Para detener el sistema, presiona Ctrl + C en esta ventana."
echo "======================================================"

npm run dev
