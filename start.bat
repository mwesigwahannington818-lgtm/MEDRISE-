@echo off
set PORT=4173
set BASE_PATH=/
cd /d "%~dp0artifacts\medrise"
pnpm run dev
