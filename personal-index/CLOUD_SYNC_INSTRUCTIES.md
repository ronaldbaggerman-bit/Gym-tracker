# Cloud Synchronisatie Instructies

## ☁️ Wat is geïmplementeerd?

Je werknemerplanning heeft nu **automatische cloud synchronisatie**:

- ✅ Data wordt automatisch naar de cloud gestuurd bij elke wijziging
- ✅ Automatische backup bij browser/tab afsluiten
- ✅ Synchronisatie om de 30 seconden
- ✅ Toegankelijk vanaf meerdere apparaten/browsers
- ✅ Geen dataverlies meer bij browser data wissen

## 🚀 Hoe activeer je het?

### Stap 1: Gratis API Key Aanmaken

1. Ga naar **[jsonbin.io](https://jsonbin.io)**
2. Klik op **"Sign Up"** (gratis account)
3. Bevestig je email
4. Log in en ga naar **"API Keys"** in het menu
5. Klik op **"Create Access Key"**
6. Geef het een naam: `werknemerplanning`
7. Kopieer de API key (begint met `$2a$10$...`)

### Stap 2: Configureren in de App

1. Open **werknemerplanning.html**
2. Klik op de **☁️ Cloud** knop (linksboven bij knoppen)
3. Vink aan: **"Automatische cloud synchronisatie inschakelen"**
4. Plak je API key in het veld
5. Klik op **"Nu Synchroniseren"**
6. Je ziet: ✅ **"Actief"** status

### Stap 3: Klaar!

- Je data wordt nu automatisch gesynchroniseerd
- Open de app op een ander apparaat met dezelfde API key
- Je data wordt automatisch geladen

## 🔧 Hoe werkt het?

```
Wijziging maken → Automatisch naar cloud
Browser sluiten → Backup naar cloud  
30 seconden timer → Sync naar cloud
App openen → Check cloud voor nieuwste data
```

## 📊 Status Indicatoren

| Icoon | Betekenis |
|-------|-----------|
| ☁️ Grijs | Cloud sync uitgeschakeld |
| ☁️ Groen | Actief en werkend |
| ⚠️ Geel | API key ontbreekt |
| ☁️ + popup | Synchronisatie succesvol |

## 🔐 Privacy & Veiligheid

- **Gratis plan JSONBin**: Tot 500 requests per maand (ruim voldoende)
- **Private bins**: Alleen jij hebt toegang met je API key
- **HTTPS**: Alle communicatie versleuteld
- **Geen vendor lock-in**: Je kunt je data altijd exporteren als CSV

## 🛠️ Troubleshooting

### "API key vereist"
→ Je hebt nog geen geldige API key ingevoerd

### "Sync mislukt"
→ Check je internetverbinding
→ Controleer of je API key geldig is
→ Check of je het maandelijkse limiet niet hebt bereikt

### Data niet gesynchroniseerd tussen apparaten
→ Zorg dat je op beide apparaten dezelfde API key gebruikt
→ Klik handmatig op "Nu Synchroniseren"

### Cloud uitschakelen
→ Vink uit: "Automatische cloud synchronisatie inschakelen"
→ Data blijft wel lokaal beschikbaar

## 💡 Tips

1. **Meerdere apparaten**: Gebruik dezelfde API key op alle apparaten
2. **Backup**: Export regelmatig als CSV voor extra zekerheid
3. **Privacy**: Deel je API key NOOIT met anderen
4. **Test eerst**: Maak een test medewerker om te testen of sync werkt

## 🎯 Volgende stappen (optioneel)

Wil je nog meer? We kunnen ook:
- Real-time sync (WebSocket) toevoegen
- Conflict resolutie bij gelijktijdig bewerken
- Versie geschiedenis met rollback
- Encryptie van data in de cloud
- Eigen backend server met database

Laat maar weten!
