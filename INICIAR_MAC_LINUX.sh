#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js no está instalado. Instala Node.js LTS desde https://nodejs.org/"
  exit 1
fi
if [ ! -d node_modules ]; then
  echo "Instalando dependencias por primera vez..."
  npm install
fi
npm run dev
