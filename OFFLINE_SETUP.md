# Gym Tracker Pro - Offline & Standalone Mode

Dit is een **volledig offline-capable Progressive Web App (PWA)** die kan werken zonder internetverbinding.

## 🚀 Snelle Start - Lokaal Draaien

### Optie 1: Als PWA Installeren (Aanbevolen)
1. Open `gym-tracker.html` in je browser
2. **Desktop/Laptop**: Klik de PWA-installatie prompt of use menu → "Install app"
3. **Mobiel**: 
   - Android: Klik het menu → "Install app" of "Toevoegen aan startscherm"
   - iPhone: Klik Delen → "Aan Home screen toevoegen"
4. App draait nu **volledig offline** met alle functies

### Optie 2: Via Python Server (Voor Netwerk-delen)
```bash
# Windows PowerShell
python -m http.server 8000 --directory "c:\Users\Baggerman\Projecten\Sport tracker"

# Maak dit bestand aan: app-server.ps1
# Zie hieronder voor inhoud
```

Bezoek dan: `http://localhost:8000/gym-tracker.html`

### Optie 3: Rechtstreeks Openen (Beperkt offline)
- Dubbelklik `gym-tracker.html` om in browser te openen
- **Opmerking**: Eerste keer laadt van CDN, daarna cacht service worker alles

## 📱 Installatie Stappen Per Device

### Windows Desktop
1. Chrome/Edge: Open gym-tracker.html → Menu → "Apps" → "Install this app"
2. De app verschijnt in Start Menu en werkbalk
3. Werkt **100% offline** nadat geïnstalleerd

### iPhone
1. Safari: Open gym-tracker.html
2. Deel-knop → "Aan Home Screen toevoegen"
3. Selecteer icoon → "Toevoegen"
4. App verschijnt in je home screen - **volledig offline**

### Android
1. Chrome: Open gym-tracker.html
2. Menu (3 punten) → "Installeren" of "App installeren"
3. Volg instructies
4. App werkt **offline** in standalone modus

## 📊 Wat Werkt Offline

✅ **Alles!** De app slaat alles lokaal op:
- Workouts loggen
- Historie bekijken
- PRs bijhouden
- Statistieken & grafieken
- Instellingen
- Backup & restore (lokale files)

**Geen internetverbinding nodig** in de sportschool!

## 💾 Data Opslag

Alle data staat in **localStorage** van je device:
- Werkt op hetzelfde device waar je installeerde
- Data blijft behouden zelfs na app-update
- **Backup maken**: Instellingen → Export Data → JSON bestand

## 🔄 Backup & Sync Tussen Devices

### Backup Maken (Alles)
1. Open Gym Tracker
2. ⚙️ → "Export Data"
3. Bestand `gym-tracker-backup-[datum].json` gedownload
4. Sla op in OneDrive/Google Drive

### Op Ander Device Herstellen
1. Open Gym Tracker
2. ⚙️ → "Import Data"
3. Selecteer je backup JSON file
4. ✅ Alles hersteld!

## 🐛 Problemen Oplossen

### "App werkt offline niet?"
→ **Oplossing**: Zorg dat Service Worker geregistreerd is:
1. Open DevTools (F12)
2. Application → Service Workers
3. Zou moeten tonen: "service-worker.js" (Active)
4. Anders: Herlaad pagina (Ctrl+Shift+R hard refresh)

### "Geen vibratie feedback op iPhone?"
→ Dit vereist **PWA-modus** (niet in Safari-browser)
→ Oplossing: "Aan Home Screen toevoegen" (zie boven)

### "Data verdwenen?"
→ **Backup herstellen**:
1. ⚙️ → "Import Data"
2. Selecteer je backup-bestand
3. Gegevens worden hersteld

### "Wil app updaten naar nieuwste versie?"
→ Instellingen → 🔄 "Herladen"
→ Of: Ctrl+Shift+R (hard refresh)

## 📁 Bestandsstructuur

```
Sport tracker/
├── gym-tracker.html         ← OPEN DEZE FILE
├── service-worker.js        ← Offline caching (auto geladen)
├── manifest.json            ← PWA configuratie
├── app-server.ps1          ← Optional: lokale server
└── README.md               ← Dit bestand
```

## 🌐 Lokale Server Starten (Optional)

### Windows PowerShell
```powershell
# Maak bestand app-server.ps1 aan met deze inhoud:

$port = 8000
$path = Get-Location

Write-Host "🚀 Gym Tracker Server" -ForegroundColor Cyan
Write-Host "Server start op http://localhost:$port" -ForegroundColor Green
Write-Host "Open deze URL in je browser..." -ForegroundColor Yellow
Write-Host "Druk Ctrl+C om server te stoppen" -ForegroundColor Yellow
Write-Host ""

python -m http.server $port --directory $path
```

Voer uit:
```powershell
.\app-server.ps1
```

## 🎯 Dit Is Nu Mogelijk

- 💪 **Volledig Offline**: Geen internetverbinding nodig
- 📱 **Cross-Device**: Installeer op meerdere apparaten
- 🔄 **Sync**: Export & import via backup files
- ⚡ **Sneller**: Laadt van cache, niet internet
- 📦 **Standalone**: Geen browser-UI, voelt als native app

## ✨ Tips & Tricks

1. **Schneltoets (iPhone)**: "Aan Home Screen" is sneller dan PWA-installatie
2. **Offline eerste**: App laadt van cache, niet internet - veel sneller!
3. **Backup regex**: Exporteer elke week automatisch naar OneDrive
4. **Test mode**: ⚙️ → Toggle "Test Mode" voor snellere timers (3s)

## 📞 Veel Gestelde Vragen

**Q: Werkt het op meerdere devices?**
A: Ja! Installeer op elk device. Data sync via backup/import.

**Q: Hoeveel data kan ik opslaan?**
A: ~10MB per app (meestal genoeg voor jaren workouts)

**Q: Kan ik data met vrienden delen?**
A: Exporteer je backup → stuur .json → zij importeren in hun app

**Q: Werkt het in vliegtuigmodus?**
A: Ja! 100% offline eenmaal geïnstalleerd

**Q: Hoe verwijder ik de app?**
A: Dezelfde manier als native apps op je device:
- Windows: Uninstall via Settings
- iPhone: Houd icoon ingedrukt → Verwijder
- Android: Instellingen → Apps → Gym Tracker → Verwijderen

## 🔐 Privacy & Data

- ✅ Alle data blijft **op jouw device** (localStorage)
- ✅ **Geen tracking** - geen analytics
- ✅ **Geen servers** - je bent eigenaar van je data
- ✅ **Open source** - code is te inspecteren

---

**Geniet van je offline Gym Tracker! 💪**
