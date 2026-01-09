# 🏋️ Gym Tracker Pro - Standalone & Offline PWA

**De ultieme fitness tracking app die 100% offline werkt** - geen internet nodig in de sportschool!

---

## 🎯 Wat Je Nodig Hebt

- ✅ Een browser (Chrome, Edge, Safari, Firefox)
- ✅ Een device (PC, Mac, iPhone, Android)
- ❌ **Geen internetverbinding nodig!**

---

## 🚀 SUPER SNELLE START (2 minuten)

### Optie 1: DIRECT OPENEN (Makkelijker)
1. **Windows**: Dubbelklik → `gym-tracker.html`
2. **Mac**: Dubbelklik → `gym-tracker.html`  
3. **iPhone**: Open file → gym-tracker.html
4. **Android**: Open bestand → gym-tracker.html

✅ App start direct in je browser!

### Optie 2: ALS PWA INSTALLEREN (Aanbevolen!)
Dit maakt het een echte native app op je device:

#### 🖥️ **Windows Desktop/Laptop**
1. Open `gym-tracker.html` in Chrome/Edge
2. Menu (3 punten) → "Apps" → "Install this app"
3. App verschijnt in Start Menu
4. **Werkt volledig offline!**

#### 📱 **iPhone/iPad (Safari)**
1. Open `gym-tracker.html` in Safari
2. Deel-knop (↗️) → "Aan Home Screen toevoegen"
3. Geef app een naam → "Toevoegen"
4. App staat in je Home Screen - **offline beschikbaar!**

#### 🤖 **Android (Chrome)**
1. Open `gym-tracker.html` in Chrome
2. Menu (3 punten) → "Installeren" of "App installeren"
3. Volg de stappen
4. App staat in je App drawer - **offline werkend!**

---

## 🌐 Lokale Server (Optional - voor Netwerk-Delen)

Wil je andere mensen laten verbinden via wifi?

### Windows - Met Batch File (Makkelijkste)
1. Dubbelklik: **`start-server.bat`**
2. Zeg ja tegen Windows Defender (eerste keer)
3. Server start automatisch
4. Anderen gaan naar: `http://jouw-computer-naam:8000`

### Windows - Met PowerShell
```powershell
.\start-server.ps1
```

### Mac/Linux - Terminal
```bash
cd "pad/naar/Sport tracker"
python3 -m http.server 8000
```

**Iedereen op je WiFi kan nu openen**: `http://jouw-ip:8000/gym-tracker.html`

---

## 💡 Hoe Dit Werkt (Technisch)

- **Service Worker** cacht alles automatisch
- **localStorage** slaat al je data op je device op
- **Progressive Web App** = installeert als native app
- **100% offline** = geen internet nodig na eerste laad

### Data Locaties
- ✅ Workouts: `localStorage` (jouw device)
- ✅ PRs: `localStorage` (jouw device)
- ✅ Instellingen: `localStorage` (jouw device)
- ❌ Nergens in cloud! Je data is van jou!

---

## 📱 Installatie per Platform

| Platform | Methode | Offline | PWA |
|----------|---------|---------|-----|
| **Windows** | browser/installeer | ✅ | ✅ |
| **Mac** | browser/installeer | ✅ | ✅ |
| **iPhone** | Safari → Home Screen | ✅ | ✅ |
| **Android** | Chrome → Installeer | ✅ | ✅ |

---

## 🔄 Backup & Sync Tussen Devices

### Backup Maken
1. Open app
2. ⚙️ Instellingen
3. "📥 Export Data"
4. Bestand gedownload: `gym-tracker-backup-[datum].json`
5. Sla in cloud op (OneDrive/Google Drive)

### Op Ander Device Herstellen
1. Download je backup-bestand
2. Open app op ander device
3. ⚙️ Instellingen
4. "📤 Import Data"
5. Kies je backup-bestand
6. ✅ Alles hersteld!

---

## ✨ Wat Werkt Offline

✅ **ALLES!** Dit werkt volledig zonder internet:
- 🏃 Workouts loggen
- 📊 Historie bekijken
- 🏆 PRs bijhouden
- 📈 Statistieken & grafieken
- ⏱️ Rest timer
- 🎯 Doelen stellen
- 🔊 Audio feedback
- 📱 Vibratie (op PWA)

### Wat Niet Offline Werkt
- ❌ Chart.js grafieken (maar canvas grafieken werken wel!)
- ❌ Externe libraries (maar allemaal ingebouwd!)

---

## 🛠️ Troubleshooting

### "App werkt offline niet?"
```
1. F12 → Application → Service Workers
2. Check of "service-worker.js" listed is
3. Status moet: "Active and running"
4. Anders: Hard refresh (Ctrl+Shift+R)
```

### "Kan niet installeren als PWA?"
```
1. Check: https (https://...) in URL - offline werkt via file://
2. Op een echt domein: PWA install werkt
3. Lokaal: Gebruik "start-server.bat" en ga naar http://localhost:8000
```

### "Data verdwenen?"
```
1. Check localStorage: DevTools → Application → Local Storage
2. Herstellen? Importeer je backup-bestand
3. Backup lost? Sorry - lokale data kan niet teruggehaald
```

### "Vibratie werkt niet op iPhone?"
```
→ Dit vereist PWA-modus, niet browser
→ Zorg dat app geïnstalleerd is via "Aan Home Screen"
→ Werkt dan via Vibration API
```

---

## 📁 Bestandsstructuur

```
Sport tracker/
├── gym-tracker.html           ← 🎯 OPEN DEZE!
├── index-standalone.html      ← Startpagina (optional)
├── service-worker.js          ← Offline caching (auto)
├── manifest.json              ← PWA config (auto)
├── start-server.bat           ← Lokale server (Windows)
├── start-server.ps1           ← Lokale server (PowerShell)
├── OFFLINE_SETUP.md           ← Gedetailleerde gids
└── README.md                  ← Dit bestand
```

---

## 🚀 Performance Tips

1. **Eerste laad**: Laadt van CDN (internet nodig)
2. **Volgende laads**: Laadt van cache (geen internet nodig)
3. **Offline modus**: 10-100x sneller dan online
4. **PWA modus**: Snelste - voelt als native app

---

## 🔐 Privacy & Veiligheid

✅ **Volledig veilig:**
- Alle data lokaal (op jouw device)
- Geen servers, geen cloud
- Geen tracking, geen analytics
- Geen verkopers van je data
- **Je bent eigenaar van je data!**

---

## 📞 Veelgestelde Vragen

**Q: Hoeveel data kan ik opslaan?**
A: ~10MB (genoeg voor jaren workouts)

**Q: Kan ik data met vrienden delen?**
A: Ja! Export → stuur bestand → zij importeren

**Q: Werkt het in vliegtuigmodus?**
A: Ja, 100% offline!

**Q: Hoe verwijder ik de app?**
A: Normale app-verwijdering op je device

**Q: Kan ik toegang krijgen van overal?**
A: Ja, als je PWA op meerdere devices installeerde en sync via backup

**Q: Is dit een virus?**
A: Nee! Dit is open-source, geen malware, volledig veilig

---

## 💻 Systeem Requirements

- **Browser**: Chrome 40+, Edge 15+, Safari 11+, Firefox 55+
- **OS**: Windows 7+, Mac OS X 10.11+, iOS 11+, Android 5+
- **Netwerk**: Niet nodig! (na eerste laad)
- **Storage**: Min. 50MB vrij (meestal genoeg)

---

## 📚 Meer Informatie

Zie `OFFLINE_SETUP.md` voor gedetailleerde instructies per device type.

---

## 🎉 Klaar?

1. **Windows**: Dubbelklik `gym-tracker.html`
2. **Mac**: Dubbelklik `gym-tracker.html`
3. **iPhone**: Safari → Open bestand → `gym-tracker.html`
4. **Android**: Chrome → Open bestand → `gym-tracker.html`

**Dat's het! App werkt nu offline. 💪**

---

**Veel sterkte met je workouts! 🏋️💪**

_Gym Tracker Pro - De offline fitness app die altijd werkt_
