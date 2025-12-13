# 🚀 QUICK START - OneDrive Setup

## Stap 1: Run het setup script

Open PowerShell en voer uit:

```powershell
cd "c:\Users\Baggerman\Projecten\personal-index"
.\setup-onedrive.ps1
```

**Of rechtsklik op `setup-onedrive.ps1` → "Run with PowerShell"**

---

## Stap 2: Gebruik de app

1. **Dubbelklik op bureaublad icoon** "Werknemerplanning"
2. **Voeg werknemers toe** met de "+" knop
3. **Klik "📁 Backup"** om naar OneDrive op te slaan
4. **OneDrive synct automatisch** naar de cloud

---

## Stap 3: Op kantoor (straks)

1. **Wacht** tot OneDrive gesynchroniseerd is
2. **Open** werknemerplanning.html vanuit werk OneDrive
3. **Klik "📥 Import"** 
4. **Selecteer** `.werknemerplanning-backup.json`
5. **Klaar!** Je data is gesynchroniseerd

---

## 🔄 Dagelijks gebruik

### Thuis PC:
- Open app vanuit OneDrive
- Maak wijzigingen
- Klik **📁 Backup** (of automatisch bij afsluiten)
- OneDrive synct naar cloud

### Kantoor PC:
- Open app vanuit werk OneDrive  
- Klik **📥 Import** om laatste versie te laden
- Maak wijzigingen
- Klik **📁 Backup**
- OneDrive synct terug

---

## 📍 Bestandslocaties

**Thuis (na setup):**
```
C:\Users\Baggerman\OneDrive\Werknemerplanning\
├── werknemerplanning.html (de app)
├── .werknemerplanning-backup.json (automatische backup)
└── ONEDRIVE_SETUP.md (gedetailleerde instructies)
```

**Kantoor (na OneDrive sync):**
```
C:\Users\[JouwNaam]\OneDrive - [Bedrijf]\Werknemerplanning\
├── werknemerplanning.html
├── .werknemerplanning-backup.json
└── ONEDRIVE_SETUP.md
```

---

## ✅ Checklist

**Nu (Thuis):**
- [ ] Run `setup-onedrive.ps1`
- [ ] Open app via bureaublad icoon
- [ ] Voeg test werknemer toe
- [ ] Klik "📁 Backup"
- [ ] Check dat `.werknemerplanning-backup.json` bestaat in OneDrive map

**Straks (Kantoor):**
- [ ] Check of OneDrive sync compleet is
- [ ] Open werknemerplanning.html vanuit werk OneDrive
- [ ] Klik "📥 Import"
- [ ] Selecteer `.werknemerplanning-backup.json`
- [ ] Test of werknemer zichtbaar is

---

## 💡 Tips

- **Backup knop**: Gebruik dit aan het eind van je werkdag
- **Import knop**: Gebruik dit aan het begin van je werkdag op ander apparaat
- **Automatisch**: Bij browser afsluiten wordt automatisch backup gemaakt
- **Veilig**: Backup bestand begint met `.` (verborgen bestand in Windows)
- **Meerdere apparaten**: Gebruik altijd Import/Backup knoppen

---

## 🆘 Problemen?

### "PowerShell script wordt geblokkeerd"
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### "Geen OneDrive gevonden"
- Check of OneDrive geïnstalleerd en ingelogd is
- Open OneDrive via systray icoon

### "Data niet gesynchroniseerd"
- Gebruik handmatig: **📁 Backup** op apparaat 1
- Gebruik handmatig: **📥 Import** op apparaat 2
- Wacht tot OneDrive sync compleet is (check OneDrive icoon)

### "Verschillende data op thuis vs kantoor"
- Check datum in `.werknemerplanning-backup.json` bestandsnaam
- Gebruik de nieuwste versie
- Backup oude versie eerst

---

## 📚 Meer informatie

Zie `ONEDRIVE_SETUP.md` voor gedetailleerde uitleg en troubleshooting.

---

**Succes!** 🎉
