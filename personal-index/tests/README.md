# Test Setup voor Personal Index

Deze test setup helpt je om de kwaliteit van je code te waarborgen voordat je wijzigingen deployt.

## 📊 Test Dashboard

Het **Test Dashboard** (`test-suite.html`) is je centrale plek voor het beheren en monitoren van alle tests:

### 🔥 Dashboard Features
- **Live Statistieken**: Real-time overzicht van test resultaten
- **Automatische Unit Tests**: Directe integratie met Jest test suite
- **Interactieve Filters**: Filter op status, module, en zoektermen
- **Test Geschiedenis**: Log van alle uitgevoerde test acties
- **Progress Tracking**: Visuele voortgangsindicatoren
- **Module-gebaseerde Organisatie**: Tests gegroepeerd per functionaliteit

### 🎯 Hoe te Gebruiken
1. **Open Dashboard**: `tests/test-suite.html` in je browser
2. **Auto-Load**: Unit tests draaien automatisch bij het openen
3. **Handmatige Tests**: Klik op individuele tests om uit te voeren
4. **Filter & Zoek**: Gebruik de filter opties om specifieke tests te vinden
5. **Resultaten Bekijken**: Klik op "Details" om test output te zien
6. **Geschiedenis**: Scroll naar beneden voor test geschiedenis

### 🎯 Hoe te Gebruiken
1. **Open Dashboard**: `tests/test-suite.html` in je browser
2. **Auto-Load**: Unit tests draaien automatisch bij het openen
3. **Handmatige Tests**: Klik op individuele tests om uit te voeren
4. **Filter & Zoek**: Gebruik de filter opties om specifieke tests te vinden
5. **Resultaten Bekijken**: Klik op "Details" om test output te zien
6. **Geschiedenis**: Scroll naar beneden voor test geschiedenis

### 📈 Dashboard Metrics
- **Totaal Tests**: Alle beschikbare tests
- **Geslaagd**: Tests die succesvol zijn uitgevoerd
- **Gefaald**: Tests met fouten of problemen
- **In Afwachting**: Handmatige tests die verificatie nodig hebben

## 📦 Installatie

1. Installeer Node.js (versie 16+)
2. Run `npm install` in de project root

## 🧪 Tests Draaien

### Automatische Unit Tests
```bash
# Alle tests draaien
npm test

# Tests in watch mode (herdraait bij bestandswijzigingen)
npm run test:watch

# Tests met coverage rapport
npm run test:coverage
```

### Handmatige UI Tests
1. Open `tests/test-suite.html` in je browser
2. Klik op "Reset naar Defaults" om test data te laden
3. Voer individuele tests uit door op de knoppen te klikken
4. Volg de instructies voor handmatige verificatie

## 📋 Test Scenarios

### Werknemerplanning
- **Data Loading/Saving**: JSON parsing voor employees en leaves
- **Leave Logic**: Verlof detectie, part-time leaves met selectedDays
- **Occupancy Calculation**: Bezettingspercentage berekening
- **Employee Management**: Filtering en project management
- **Date Utilities**: Week nummers en datum ranges

### Actielijst (Tasks)
- **Task Data Structure**: Validatie van task objecten
- **Task Filtering**: Status, project, priority, tags filtering
- **Task Statistics**: Completion rates, priority distribution
- **Project Management**: Project CRUD operaties
- **Task CRUD**: Create, read, update, delete operaties
- **Task Validation**: Required fields en data types

### Besluitenpagina (Decisions)
- **Decision Data Structure**: Validatie van decision objecten
- **Decision Filtering**: Status en project filtering
- **Decision Statistics**: Status counts, overdue detection
- **Decision Options**: Pros/cons management, option selection
- **Decision CRUD**: Create, read, update, delete operaties
- **Decision Validation**: Required fields en status values

### Integratie Tests
- **Project Consistency**: Cross-module project referenties
- **Data Export/Import**: Complete backup/restore workflow
- **End-to-End Workflow**: Complete project lifecycle
- **Data Relationships**: Referential integrity checks

### Performance Tests
- **Data Loading**: Performance met grote datasets
- **Memory Usage**: Geheugen verbruik monitoring

### Data Integrity Tests
- **JSON Validation**: Data format validatie
- **Corruption Recovery**: Herstel van corrupte data

## 🔧 Test Framework

- **Jest**: Voor unit tests van JavaScript logica
- **jsdom**: Browser environment simulatie
- **localStorage mocking**: Voor data persistence tests

## 📝 Test Bestanden

```
tests/
├── setup.js                    # Jest configuratie en mocks
├── werknemerplanning.test.js   # Unit tests voor werknemerplanning (15 tests)
├── actielijst.test.js          # Unit tests voor actielijst (6 tests)
├── besluitenpagina.test.js     # Unit tests voor besluitenpagina (6 tests)
├── integration.test.js         # Integration tests (4 tests)
├── test-suite.html             # Handmatige test interface
└── README.md                   # Deze documentatie
```

## 🚀 CI/CD Integration

Voor geautomatiseerde testing in je deployment pipeline:

```yaml
# GitHub Actions voorbeeld
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm install
    - run: npm test
    - run: npm run test:coverage
```

## 🐛 Issues Rapporteren

Als tests falen:
1. Check de console output voor foutmeldingen
2. Vergelijk met de verwachte resultaten in de test beschrijvingen
3. Controleer of localStorage data corrupt is (gebruik "Test Data Wissen")

## � Test Coverage

Streef naar minimaal 80% code coverage voor nieuwe features:

- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 85%
- **Lines**: 80%

## 🔄 Test Data

De test suite bevat default test data die automatisch wordt geladen. Deze omvat:
- **3 test projecten**: Project Alpha, Beta, Gamma
- **2-3 test werknemers** per module
- **Vooraf geconfigureerde taken, besluiten en verloven**

Gebruik "Reset naar Defaults" om deze data te herstellen.

## 🛠️ Test Development

### Nieuwe Tests Toevoegen
1. Maak een nieuw `.test.js` bestand in de `tests/` map
2. Gebruik `describe()` en `test()` voor structuur
3. Importeer benodigde modules indien nodig
4. Gebruik Jest matchers voor assertions

### Test Best Practices
- **Beschrijvende namen**: `test('should calculate occupancy correctly')`
- **Arrange-Act-Assert**: Setup → Execute → Verify
- **Isolated tests**: Elke test onafhankelijk van anderen
- **Mock external dependencies**: localStorage, DOM APIs
- **Test edge cases**: Empty data, invalid input, errors

### Performance Testing
- Gebruik `performance.now()` voor timing
- Test met realistische data volumes
- Monitor memory usage in browser dev tools
- Set performance budgets

## 📈 Uitbreiding

De test suite kan worden uitgebreid met:
- **Visual Regression Tests**: Screenshot vergelijkingen
- **API Integration Tests**: Backend connectivity
- **Accessibility Tests**: WCAG compliance
- **Security Tests**: XSS, data exposure
- **Load Tests**: Concurrent user simulation</content>
<parameter name="filePath">c:\Users\Baggerman\Projecten\personal-index\tests\README.md