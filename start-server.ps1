# Gym Tracker - Local Development Server
# Start een lokale webserver voor Gym Tracker

# Configuratie
$port = 8000
$path = Split-Path -Parent $MyInvocation.MyCommand.Path

# Banners
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                   GYM TRACKER PRO                         ║" -ForegroundColor Cyan
Write-Host "║            Local Development Server                       ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Informatie
Write-Host "📁 Server Directory: $path" -ForegroundColor Green
Write-Host "🌐 Server URL:      http://localhost:$port" -ForegroundColor Green
Write-Host "📱 App URL:         http://localhost:$port/gym-tracker.html" -ForegroundColor Green
Write-Host ""

# PWA Info
Write-Host "📲 PWA Installation:" -ForegroundColor Yellow
Write-Host "   • Desktop: Menu → Apps → Install app" -ForegroundColor Gray
Write-Host "   • Mobile: Add to home screen" -ForegroundColor Gray
Write-Host "   • App staat dan offline beschikbaar" -ForegroundColor Gray
Write-Host ""

# Service Worker Info
Write-Host "⚙️  Service Worker:" -ForegroundColor Yellow
Write-Host "   • Cacht alle files automatisch" -ForegroundColor Gray
Write-Host "   • Offline mode ingeschakeld" -ForegroundColor Gray
Write-Host "   • DevTools → Application → Service Workers checken" -ForegroundColor Gray
Write-Host ""

# Instructies
Write-Host "📖 Instructies:" -ForegroundColor Yellow
Write-Host "   1. Server start nu..." -ForegroundColor Gray
Write-Host "   2. Open http://localhost:$port/gym-tracker.html in je browser" -ForegroundColor Gray
Write-Host "   3. Installeer als PWA voor offline support" -ForegroundColor Gray
Write-Host "   4. Druk Ctrl+C hier om server te stoppen" -ForegroundColor Gray
Write-Host ""

# Check Python
Write-Host "🔍 Controleer Python..." -ForegroundColor Cyan
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ $pythonVersion beschikbaar" -ForegroundColor Green
} catch {
    Write-Host "❌ Python niet gevonden! Install Python 3 van python.org" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Server starten..." -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Start server
try {
    python -m http.server $port --directory $path
} catch {
    Write-Host "❌ Fout bij starten server: $_" -ForegroundColor Red
    exit 1
}
