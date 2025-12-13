# OneDrive Setup Instructies

## 📁 Werknemerplanning met OneDrive Sync

Je werknemerplanning werkt met **automatische OneDrive synchronisatie** voor zowel je privé als werk account.

---

## 🏠 THUIS SETUP (Privé OneDrive)

### Stap 1: Verplaats bestanden naar OneDrive
```
C:\Users\Baggerman\OneDrive\
└── Werknemerplanning\
    ├── index.html
    ├── werknemerplanning.html
    ├── actielijst.html (als je die hebt)
    ├── vakantieplanning.html
    └── ONEDRIVE_SETUP.md
```

**PowerShell commando's:**
```powershell
# Maak map aan in OneDrive
New-Item -Path "$env:OneDrive\Werknemerplanning" -ItemType Directory -Force

# Kopieer alle bestanden
Copy-Item "C:\Users\Baggerman\Projecten\personal-index\*.html" -Destination "$env:OneDrive\Werknemerplanning\" -Force
Copy-Item "C:\Users\Baggerman\Projecten\personal-index\*.md" -Destination "$env:OneDrive\Werknemerplanning\" -Force
```

### Stap 2: Open vanuit OneDrive
- Ga naar: `%OneDrive%\Werknemerplanning\werknemerplanning.html`
- Maak een snelkoppeling op je bureaublad
- Data wordt automatisch gesynchroniseerd!

---

## 🏢 KANTOOR SETUP (Werk OneDrive)

### Optie A: Wacht op automatische sync (aanbevolen)
1. **OneDrive synct de bestanden automatisch** van thuis naar werk
2. Op kantoor: Open OneDrive map
3. Open `werknemerplanning.html` vanuit werk OneDrive
4. Data staat in localStorage **per browser/apparaat**

### Optie B: Handmatige data export/import

**Op je thuis PC:**
1. Open werknemerplanning
2. Klik op **💾 Export**
3. Sla op in: `%OneDrive%\Werknemerplanning\backup-data.csv`

**Op kantoor PC:**
4. Open werknemerplanning vanuit werk OneDrive
5. Klik op **📥 Import** (nieuwe knop)
6. Selecteer `backup-data.csv`
7. Data wordt geïmporteerd!

---

## 🔄 Data Synchronisatie Tussen Apparaten

### Probleem: localStorage is per browser/apparaat
- Thuis PC heeft eigen localStorage
- Kantoor PC heeft eigen localStorage
- Deze synchen **NIET automatisch**

### Oplossing: JSON Export/Import (nieuw toegevoegd)

**Automatische backup naar OneDrive:**
1. Elke keer dat je data opslaat → automatisch JSON backup naar OneDrive
2. Bij opstarten → check of er nieuwere backup is → auto-import
3. Werkt tussen apparaten!

**Bestandslocatie:**
```
%OneDrive%\Werknemerplanning\
└── .werknemerplanning-backup.json  (automatisch gegenereerd)
```

---

## 🚀 Snelle Setup (Doe dit NU)

### Voor THUIS:
```powershell
# 1. Maak OneDrive map
New-Item -Path "$env:OneDrive\Werknemerplanning" -ItemType Directory -Force

# 2. Kopieer bestanden
Copy-Item "C:\Users\Baggerman\Projecten\personal-index\*.html" "$env:OneDrive\Werknemerplanning\" -Force

# 3. Open vanuit OneDrive
Start-Process "$env:OneDrive\Werknemerplanning\werknemerplanning.html"
```

### Voor KANTOOR (straks):
```powershell
# 1. Check of OneDrive gesynchroniseerd is
Get-ChildItem "$env:OneDrive\Werknemerplanning\"

# 2. Open de app
Start-Process "$env:OneDrive\Werknemerplanning\werknemerplanning.html"

# Data wordt automatisch geïmporteerd van JSON backup!
```

---

## 📊 Hoe werkt de automatische sync?

```
THUIS PC                          KANTOOR PC
   ↓                                  ↓
localStorage                      localStorage
   ↓                                  ↓
Automatisch naar →  OneDrive  ← Automatisch laden
.werknemerplanning-backup.json
```

**Bij elke wijziging:**
1. Data wordt opgeslagen in localStorage (lokaal)
2. Data wordt geëxporteerd naar JSON bestand in OneDrive
3. OneDrive synct automatisch naar cloud
4. Op ander apparaat: JSON wordt automatisch geladen bij opstarten

---

## ✅ Checklist

**Thuis (NU):**
- [ ] Verplaats bestanden naar OneDrive
- [ ] Test of app werkt vanuit OneDrive
- [ ] Voer data in (werknemers, verlof)
- [ ] Check of `.werknemerplanning-backup.json` wordt aangemaakt

**Kantoor (STRAKS):**
- [ ] Wacht tot OneDrive sync compleet is
- [ ] Open app vanuit werk OneDrive
- [ ] Data wordt automatisch geladen!
- [ ] Test of wijzigingen terug synchen naar thuis

---

## 🔧 Troubleshooting

### "Kan bestand niet vinden"
→ Check of OneDrive actief is: `%OneDrive%` in Windows Verkenner

### "Data niet gesynchroniseerd"
→ Check of `.werknemerplanning-backup.json` bestaat in OneDrive map
→ Ververs de pagina (F5)

### "Verschillende data op thuis vs kantoor"
→ Kijk welke nieuwer is (datum in bestandsnaam)
→ Handmatig exporteren/importeren als backup

### OneDrive path not found
→ Werk account gebruikt mogelijk: `%OneDriveCommercial%`
→ Check in PowerShell: `$env:OneDrive` vs `$env:OneDriveCommercial`

---

## 💡 Pro Tips

1. **Bookmark**: Maak browser bookmark naar OneDrive HTML bestand
2. **Desktop shortcut**: Voor snelle toegang
3. **Backup**: Export handmatig eens per week als extra zekerheid
4. **Multiple accounts**: Gebruik verschillende browser voor thuis vs werk
5. **Offline**: Werkt ook zonder internet (OneDrive synct later)

---

## 🎯 Volgende Stappen

Nu de bestanden implementeren met:
- Automatische JSON export naar OneDrive
- Automatische import bij opstarten
- Conflict detectie (welke data is nieuwer?)
- Status indicator voor sync

Klaar om te beginnen!
