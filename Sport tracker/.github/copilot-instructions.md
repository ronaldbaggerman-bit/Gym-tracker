# Gym Tracker Copilot Instructions

## Project Overview
This is a single-file Progressive Web App (PWA) for tracking gym workouts. All HTML, CSS, and JavaScript are embedded in `gym-tracker.html`. No build process required - open the file directly in a browser.

## Architecture
- **Single-file app**: Everything in `gym-tracker.html` (~4,661 lines)
- **Data storage**: localStorage with keys like `workout_history`, `workout_prs`, `gym_custom_exercises`, `gym_settings`
- **State management**: Global variables (`currentView`, `currentWorkout`, `timerSeconds`, etc.)
- **Views**: workout, history, progress, prs, exercises, settings (switched via `switchView()`)

## Key Data Structures
- `WORKOUT_DATA.schemas`: Array of predefined workout schemas with muscle groups and exercises
- Custom exercises: Stored in localStorage as object with auto-incrementing IDs
- Workout history: Array of completed workouts with sets, reps, weights
- PRs: Personal records tracked per exercise with date and weight

## Coding Patterns
- **Functions**: Pure functions for data ops (e.g., `getCustomExercises()`, `saveSettings()`)
- **DOM manipulation**: Direct element access with `document.getElementById()`
- **Event handling**: Inline onclick attributes and addEventListener
- **Styling**: CSS custom properties for themes (dark/light mode)
- **PWA**: Manifest embedded as base64 data URL

## Development Workflow
- Edit `gym-tracker.html` directly
- Test by opening in browser (supports mobile via viewport meta)
- Data persists in browser localStorage
- No dependencies or package managers

## UI Language
- Interface text in Dutch (`lang="nl"`)
- Code comments and variable names in English
- Exercise names in English

## Common Tasks
- Adding exercises: Use `showNewExerciseForm()` and `addExistingExerciseToWorkout()`
- Timer management: `startTimer()`, `pauseTimer()`, `resetTimer()`
- Data export/import: Via settings view (future feature implied)

## Key Files
- [gym-tracker.html](gym-tracker.html): Entire application</content>
<parameter name="filePath">c:\Users\Baggerman\Projecten\Sport tracker\.github\copilot-instructions.md

## Development Workflow
- Edit `gym-tracker.html` directly
- Test by opening in browser (supports mobile via viewport meta)
- Data persists in browser localStorage
- No dependencies or package managers- Voordat je begint met code aanpassingen, geef eerst aan wat je gaat doen. Daarna, na akkoord, mag de code worden aangepast.- **Branch management**: `main` en  `master` Nieuwe features en aanpassingen dienen eerst in een aparte branch te worden ontwikkeld en getest. Na mergen en uitoleen altij ve versie ophogen met 1.