# ===================================================
# WERKNEMERPLANNING - OneDrive Setup Script
# ===================================================
# 
# Dit script verplaatst je werknemerplanning naar OneDrive
# voor automatische synchronisatie tussen thuis en kantoor.
#
# ===================================================

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " WERKNEMERPLANNING - OneDrive Setup" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check OneDrive paths
$oneDrivePersonal = $env:OneDrive
$oneDriveCommercial = $env:OneDriveCommercial

Write-Host "Gedetecteerde OneDrive locaties:" -ForegroundColor Yellow
Write-Host "  Privé OneDrive: " -NoNewline
if ($oneDrivePersonal) {
    Write-Host "$oneDrivePersonal" -ForegroundColor Green
} else {
    Write-Host "Niet gevonden" -ForegroundColor Red
}

Write-Host "  Werk OneDrive:  " -NoNewline
if ($oneDriveCommercial) {
    Write-Host "$oneDriveCommercial" -ForegroundColor Green
} else {
    Write-Host "Niet beschikbaar op dit apparaat" -ForegroundColor Gray
}

Write-Host ""

# Kies OneDrive
$targetOneDrive = $null
if ($oneDrivePersonal) {
    $choice = Read-Host "Gebruik privé OneDrive? (J/N) [standaard: J]"
    if ($choice -eq "" -or $choice -eq "J" -or $choice -eq "j") {
        $targetOneDrive = $oneDrivePersonal
    }
}

if (-not $targetOneDrive -and $oneDriveCommercial) {
    $choice = Read-Host "Gebruik werk OneDrive? (J/N)"
    if ($choice -eq "J" -or $choice -eq "j") {
        $targetOneDrive = $oneDriveCommercial
    }
}

if (-not $targetOneDrive) {
    Write-Host "❌ Geen OneDrive geselecteerd. Setup geannuleerd." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "✅ Gekozen: $targetOneDrive" -ForegroundColor Green
Write-Host ""

# Create destination folder
$destFolder = Join-Path $targetOneDrive "Werknemerplanning"
Write-Host "Map maken: $destFolder" -ForegroundColor Yellow

if (-not (Test-Path $destFolder)) {
    New-Item -Path $destFolder -ItemType Directory -Force | Out-Null
    Write-Host "✅ Map aangemaakt" -ForegroundColor Green
} else {
    Write-Host "✅ Map bestaat al" -ForegroundColor Green
}

Write-Host ""

# Source files
$sourceFolder = "c:\Users\Baggerman\Projecten\personal-index"

# Copy files
Write-Host "Bestanden kopiëren..." -ForegroundColor Yellow
Write-Host ""

$filesToCopy = @(
    "index.html",
    "werknemerplanning.html",
    "besluitenpagina.html",
    "ONEDRIVE_SETUP.md",
    "CLOUD_SYNC_INSTRUCTIES.md"
)

$copiedCount = 0
foreach ($file in $filesToCopy) {
    $sourcePath = Join-Path $sourceFolder $file
    $destPath = Join-Path $destFolder $file
    
    if (Test-Path $sourcePath) {
        Copy-Item -Path $sourcePath -Destination $destPath -Force
        Write-Host "  ✅ $file" -ForegroundColor Green
        $copiedCount++
    } else {
        Write-Host "  ⚠️  $file (niet gevonden)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ $copiedCount bestanden gekopieerd" -ForegroundColor Green
Write-Host ""

# Create desktop shortcut
Write-Host "Desktop snelkoppeling maken..." -ForegroundColor Yellow

$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "Werknemerplanning.lnk"
$targetFile = Join-Path $destFolder "werknemerplanning.html"

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $targetFile
$shortcut.IconLocation = "shell32.dll,21"  # Folder icon
$shortcut.Description = "Werknemerplanning met OneDrive sync"
$shortcut.Save()

Write-Host "✅ Snelkoppeling gemaakt op bureaublad" -ForegroundColor Green
Write-Host ""

# Create initial backup file
Write-Host "Initiële backup maken..." -ForegroundColor Yellow

$backupData = @{
    employees = @()
    leaves = @()
    projects = @("OneCRM", "Tranch 4", "PriceKeys")
    lastModified = (Get-Date).ToString("o")
    version = "1.0"
    device = $env:COMPUTERNAME
}

$backupPath = Join-Path $destFolder ".werknemerplanning-backup.json"
$backupData | ConvertTo-Json -Depth 10 | Out-File -FilePath $backupPath -Encoding UTF8

Write-Host "✅ Backup bestand aangemaakt" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " ✅ SETUP VOLTOOID!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📁 Bestanden staan in:" -ForegroundColor Yellow
Write-Host "   $destFolder" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Volgende stappen:" -ForegroundColor Yellow
Write-Host "   1. Dubbelklik op 'Werknemerplanning' icoon op bureaublad" -ForegroundColor White
Write-Host "   2. Of open: $targetFile" -ForegroundColor White
Write-Host "   3. Voeg werknemers en verlof toe" -ForegroundColor White
Write-Host "   4. Data wordt automatisch gesynchroniseerd naar OneDrive" -ForegroundColor White
Write-Host ""
Write-Host "💼 Op kantoor:" -ForegroundColor Yellow
Write-Host "   1. Wacht tot OneDrive sync compleet is" -ForegroundColor White
Write-Host "   2. Open dezelfde HTML vanaf werk OneDrive" -ForegroundColor White
Write-Host "   3. Klik '📥 Import' om thuis data te laden" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Yellow
Write-Host "   - Gebruik '📁 Backup' knop om handmatig op te slaan" -ForegroundColor White
Write-Host "   - Gebruik '📥 Import' knop om te synchroniseren" -ForegroundColor White
Write-Host "   - Backup bestand: .werknemerplanning-backup.json" -ForegroundColor White
Write-Host ""

# Offer to open
$openNow = Read-Host "App nu openen? (J/N)"
if ($openNow -eq "J" -or $openNow -eq "j") {
    Start-Process $targetFile
    Write-Host "✅ App geopend!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Druk op een toets om af te sluiten..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
