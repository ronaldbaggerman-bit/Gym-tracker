# Changelog - Gym-Track App

Alle belangrijke wijzigingen aan dit project worden in dit bestand gedocumenteerd.

## [1.0.0] - 2025-12-10

### Basis Features
- ✅ Workout tracking met schema selector
- ✅ Exercise detail cards met sets, reps, weight
- ✅ Set completion tracking met difficulty rating (licht/goed/zwaar)
- ✅ Personal Records (PR) tracking met automatische detectie
- ✅ Workout historie met datum filtering
- ✅ Schema management (custom schemas, exercise management)
- ✅ Progressive overload suggesties

### Geavanceerde Features
- ✅ Exercise guides met uitleg en spiergroep info
- ✅ CSV import vanuit Google Sheets voor historische data
- ✅ Exercise iconen/afbeeldingen in workout cards
- ✅ Kcal tracking met MET-waarden en lichaamgewicht
- ✅ Workout timer met live kcal display
- ✅ Kcal weergave in exercise cards en historie

### Progressie & Analytics
- ✅ Progressie tab met line charts voor gewichtprogressie
- ✅ Schema en exercise filters met dropdown
- ✅ 180-dagen progressie weergave (instelbaar)
- ✅ Metrische cards (current weight, progress, % change, workout count)
- ✅ Grafiek tab met statistieken en volume tracking

### UI/UX Verbeteringen
- ✅ Carbon fiber achtergrond design
- ✅ Pull-to-refresh op alle tabs (Historie, Progressie, Grafieken)
- ✅ Automatische navigatie naar Historie na workout beëindigen
- ✅ Schema ID normalisatie voor geïmporteerde data

### Technisch
- React Native + Expo 54.0.27
- TypeScript voor type safety
- AsyncStorage voor lokale data persistentie
- React Native SVG voor charts en visualisaties
- @react-native-picker/picker voor dropdowns

### Data Management
- CSV import/export functionaliteit
- Session storage met Date serialisatie
- PR tracking per oefening
- Custom schema storage met overrides

## Toekomstige Features (Roadmap)
- [ ] Database migratie naar SQLite
- [ ] Cloud sync / backup
- [ ] Workout templates
- [ ] Rest timer tussen sets
- [ ] Workout notificaties
- [ ] Gebruikers authenticatie
- [ ] Social features (workout delen)
- [ ] Advanced analytics (1RM calculator, volume trends)
