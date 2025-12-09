# Gym-Track Project Instructions

Dit is een React Native Expo project voor een fitness tracking app met 3 tabbladen: Workout, Historie en Grafieken.

## Project Setup

- Node.js vereist (v16+)
- Windows development omgeving
- Expo Go app op je telefoon voor testen

## Start Development

```bash
npm install
npx expo start
```

Scan de QR code met Expo Go om de app te testen.

## Project Structure

- `app/(tabs)/index.tsx` - Workout tracking screen
- `app/(tabs)/explore.tsx` - Workout history screen
- `app/(tabs)/grafieken.tsx` - Statistics & charts screen
- `app/(tabs)/_layout.tsx` - Bottom tab navigator configuration

## Volgende Stappen

1. Implementeer database/storage voor workouts
2. Voeg workout toevoeg/bewerk formulier toe
3. Voeg push notifications toe
4. Verbeter grafieken met echte data
5. Voeg gebruikers authenticatie toe
