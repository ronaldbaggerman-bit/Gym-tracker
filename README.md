# Gym-Track 💪

[![CI](https://github.com/ronaldbaggerman-bit/Gym-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/ronaldbaggerman-bit/Gym-tracker/actions/workflows/ci.yml)

Stable release: [v0.1.0](https://github.com/ronaldbaggerman-bit/Gym-tracker/releases/tag/v0.1.0)

Een fitness tracking app gebouwd met React Native en Expo, ontworpen om op Windows te worden ontwikkeld en getest met Expo Go op je telefoon.

## Functies

- **Workout**: Beheer en track je workouts
- **Historie**: Bekijk je workout geschiedenis
- **Grafieken**: Visualiseer je training statistieken

## Vereisten

- Node.js (v16+)
- npm of yarn
- [Expo Go](https://expo.dev/go) app op je telefoon (iOS of Android)

## Aan de slag

### 1. Installeer dependencies

```bash
npm install
```

### 2. Start de development server

```bash
npx expo start
```

### 3. Open in Expo Go

- Android: Scan de QR code met je camera of Expo Go app
- iOS: Open de link in Safari en klik op "Open in Expo Go"

## Project Structuur

```
app/
├── (tabs)/              # Tab navigator screens
│   ├── index.tsx       # Workout screen
│   ├── explore.tsx     # Historie screen
│   ├── grafieken.tsx   # Grafieken screen
│   └── _layout.tsx     # Tab navigator setup
├── navigation/         # Navigation configuratie
└── screens/            # Reusable screen componenten
```

## Commando's

- `npm run android` - Bouw voor Android
- `npm run ios` - Bouw voor iOS (macOS vereist)
- `npm run web` - Start web versie

## Documentatie

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)

## Releases

Zie `CHANGELOG.md` voor volledige release notes.

- v0.1.0 (2025-12-12): utilities verplaatst naar `utils/`, imports gefixt naar `@/utils/*`, debug logs toegevoegd, CI workflow toegevoegd.


```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
