# Apple Health Import Guide – Gym Tracker

Deze gids helpt je om de geëxporteerde workouts van Gym Tracker automatisch naar Apple Health te importeren.

---

## 📋 Voorbereiding

1. **Gym Tracker PWA openen** op je iPhone
2. Ga naar **⚙️ Instellingen** → **📦 Backup & Synchronisatie**
3. Tik op **⬇️ Export Workouts (JSON, 180d)**
4. Bestand wordt gedownload, bijv. `gym-tracker-workouts-180d-2026-01-09.json`
5. Bewaar het in **Bestanden app** of ergens waar je het kunt terugvinden

---

## 📱 Stap 1: Shortcut maken

### A. Open Shortcuts app
1. Open de **Shortcuts app** op je iPhone
2. Tik op **➕** (Nieuw)
3. Selecteer **Leeg script** (of "Create Blank Shortcut")

### B. Voeg de volgende acties toe (in volgorde):

#### Stap 1.1: Bestand kiezen
```
Ask for [File] Types: JSON
```
- Dit laat je de JSON uit Bestanden selecteren

#### Stap 1.2: Tekst als JSON parsing
```
Ask for [Text] "Plak de JSON hier:"
Set Variable [jsonText] to [Provided Text]
```
*Alternatief (makkelijker):*
```
Choose [File] from [On My iPhone]
Set Variable [jsonFile] to [Chosen File]
Get [Contents] of [jsonFile]
Set Variable [jsonText] to [File Contents]
```

#### Stap 1.3: Parse JSON
```
Get [Dictionary Value] of [jsonText]
Set Variable [workoutsData] to [Dictionary]
```

#### Stap 1.4: Loop door workouts
```
Repeat with each [item] in [workoutsData > workouts]
    Set Variable [currentWorkout] to [repeat item]
    
    // Parse workout data
    Get [schemaName] from [currentWorkout]
    Set Variable [workoutName] to [value]
    
    Get [startTime] from [currentWorkout]
    Set Variable [startDate] to [value]
    
    Get [endTime] from [currentWorkout]
    Set Variable [endDate] to [value]
    
    Get [durationSeconds] from [currentWorkout]
    Set Variable [duration] to [value]
    
    Get [exercises] from [currentWorkout]
    Set Variable [exercises] to [value]
    
    // Calculate calories (MET-based)
    // For now, use a rough estimate: (duration in min) * 5 kcal/min
    // We'll improve this with real MET data
    Calculate [duration] ÷ 60
    Set Variable [durationMin] to [result]
    Calculate [durationMin] × 5
    Set Variable [calories] to [result]
    
    // Add to Apple Health
    Add [Workout] to Health
        Type: Gym
        Start: [startDate]
        End: [endDate]
        Duration: [duration] seconds
        Calories: [calories] kcal
        Name: [workoutName]
End Repeat
```

---

## 🔥 Stap 2: Verbeterde Kcal Berekening

Voor nauwkeurigere caloriën moeten we het **MET** (Metabolic Equivalent Task) gebruiken dat Gym Tracker al opslaat.

**Formule:**
```
Kcal = (MET × Gewicht_kg × Duur_uur)
```

Voeg dit toe **voor** de "Add Workout to Health" stap:

```
Repeat with each [item] in [exercises]
    Set Variable [exercise] to [repeat item]
    Get [sets] from [exercise]
    
    Repeat with each [set] in [sets array]
        Calculate [weight kg] × [reps]
        Total volume += result
    End Repeat
End Repeat

// Schat MET op basis van volume (ruw):
// Per 100 kg volume ≈ 5-7 MET
Calculate [totalVolume] ÷ 100
Calculate [result] × 6
Set Variable [estimatedMET] to [result]

// Zorg voor minimum
If [estimatedMET] < 4
    Set Variable [estimatedMET] to 4
End If

// Ask for body weight (opslaan in variabele)
Ask for [Number] "Wat is je lichaamsgewicht (kg)?"
Set Variable [bodyWeight] to [answer]

// Bereken kcal
Calculate [estimatedMET] × [bodyWeight] × ([duration] ÷ 3600)
Set Variable [finalCalories] to [round result]
```

---

## 🎯 Stap 3: Volledig Shortcut Script (Kopie-klaar)

```
Ask for [File]

Get [Contents] of [Chosen File]
Set Variable [jsonText] to [File Contents]

Get [Dictionary Value] of [jsonText]
Set Variable [data] to [Dictionary]

Ask for [Number] "Lichaamsgewicht (kg):"
Set Variable [bodyWeight] to [answer]

Get [workouts] from [data]

Repeat with each [workout] in [workouts]
    
    Get [schemaName] from [workout]
    Set Variable [workoutName] to [value]
    
    Get [startTime] from [workout]
    Set Variable [startTime] to [value]
    
    Get [endTime] from [workout]
    Set Variable [endTime] to [value]
    
    Get [durationSeconds] from [workout]
    Set Variable [duration] to [value]
    
    Get [exercises] from [workout]
    Set Variable [exercisesList] to [value]
    
    // Calculate total volume
    Set Variable [totalVolume] to [0]
    
    Repeat with each [exercise] in [exercisesList]
        Get [sets] from [exercise]
        
        Repeat with each [set] in [sets]
            Get [weight] from [set]
            Get [reps] from [set]
            Calculate [weight] × [reps]
            Set Variable [setVolume] to [result]
            Calculate [totalVolume] + [setVolume]
            Set Variable [totalVolume] to [result]
        End Repeat
    End Repeat
    
    // Estimate MET
    Calculate [totalVolume] ÷ 100 × 6
    Set Variable [met] to [result]
    
    If [met] < 4
        Set Variable [met] to [4]
    End If
    
    // Calculate calories
    Calculate [met] × [bodyWeight] × ([duration] ÷ 3600)
    Set Variable [calories] to [round result to 0 decimal places]
    
    // Add to Health
    Add [Workout] to Health
        Type: Gym
        Start Date: [startTime]
        End Date: [endTime]
        Duration: [duration] seconds
        Calories: [calories]
        Name: [workoutName]
    
    Show Result [Added: {workoutName} - {calories} kcal]

End Repeat

Show Result "✅ Alle workouts geïmporteerd naar Apple Health!"
```

---

## 🚀 Stap 4: Shortcut Gebruiken

1. **Eerste keer:**
   - Open Shortcut
   - Selecteer je geëxporteerde JSON bestand
   - Voer je lichaamsgewicht in
   - Wacht terwijl workouts worden toegevoegd (kan even duren voor veel workouts)

2. **Daarna:**
   - Exporteer nieuwe JSON
   - Open Shortcut
   - Herhaal

---

## 📊 Hoe werkt de Kcal berekening?

```
MET = (Total Volume ÷ 100) × 6
  (ruw estimate: sterke trainingen ≈ 5-7 MET)

Kcal = MET × Lichaamsgewicht (kg) × (Duur in seconden ÷ 3600)

Voorbeeld:
- Volume: 300 kg
- Duur: 30 minuten (1800 sec)
- Gewicht: 80 kg
- MET = (300 ÷ 100) × 6 = 18
- Kcal = 18 × 80 × (1800 ÷ 3600) = 18 × 80 × 0.5 = 720 kcal
```

*Opmerking: Dit is een ruw estimate. Voor nauwkeurigheid beter MET per oefening opslaan in Gym Tracker.*

---

## 🔗 Extra Opties

### Optie A: Automatisch dagelijks importeren
Voeg een Automation toe in Shortcuts:
- Trigger: **Dagelijks** op bepaald tijdstip
- Actie: Shortcut uitvoeren
- *Vereist: Gym Tracker JSON beschikbaar op vast locatie*

### Optie B: Meer nauwkeurige MET waarden
Pas je Gym Tracker aan om **MET per oefening** op te slaan (kracht vs cardio):
- Krachtoefeningen: 5-8 MET
- Cardio: 8-15 MET

Dan kan Shortcut echte MET gebruiken i.p.v. ruw estimate.

---

## 💡 Tips & Troubleshooting

| Probleem | Oplossing |
|----------|-----------|
| JSON wordt niet parsed | Check of bestandsindeling `.json` is; retry export |
| Kcal te hoog/laag | Pas lichaamsgewicht aan of MET factor in Shortcut |
| Workouts niet in Apple Health | Grant Shortcut permissions: Instellingen → Gezondheid |
| Duplicate workouts | Delete bestaande en reimporteer, óf voeg deduplication toe |

---

## 📝 Volgende stap

Wil je dat ik:
1. De JSON export in Gym Tracker aanpas om **MET per oefening** mee te nemen?
2. Een **automatische dagelijkse sync** inbouwen (vraagt meer cloud setup)?
3. De Shortcut als **`.shortcut` bestand** exporteren om direct te importeren?

Laat het weten! 🎯
