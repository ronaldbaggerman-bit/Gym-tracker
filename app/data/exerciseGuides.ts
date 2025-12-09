export interface ExerciseGuide {
  image: string;
  cues: string[];
  tips?: string[];
  primaryMuscles?: string;
  equipment?: string;
  icon?: string; // Emoji icon for quick visual reference
}

export const EXERCISE_GUIDES: Record<string, ExerciseGuide> = {
  'Chest Press': {
    icon: '🤸',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80',
    primaryMuscles: 'Borst, triceps, schouders',
    equipment: 'Machine of dumbbells',
    cues: [
      'Zet je schouderbladen vast tegen de rugleuning en houd je voeten plat.',
      'Duw gecontroleerd uit tot je armen bijna gestrekt, zonder je ellebogen te locken.',
      'Laat langzaam zakken tot je ellebogen net onder schouderhoogte blijven.',
    ],
    tips: ['Neutrale polsen, borst omhoog.', 'Langzame excentrische fase voor meer spanning.'],
  },
  'DB Press': {
    icon: '💪',
    image: 'https://images.unsplash.com/photo-1599059819754-4004d89c86e8?auto=format&fit=crop&w=1200&q=80',
    primaryMuscles: 'Borst, triceps, schouders',
    equipment: 'Dumbbells + bankje',
    cues: [
      'Start met dumbbells boven de borst, ellebogen 45° van je romp.',
      'Duw omhoog in een lichte boog, schouderbladen blijven ingetrokken.',
      'Zak gecontroleerd tot de dumbbells op borstlijn komen.',
    ],
    tips: ['Houd de polsen recht boven de onderarmen.', 'Vermijd een extreem holle rug.'],
  },
  'Db chest turn shoulder press': {
    icon: '🔄',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80',
    primaryMuscles: 'Borst en schouders',
    equipment: 'Dumbbells + bankje',
    cues: [
      'Start met dumbbells op borsthoogte, palmen naar binnen.',
      'Duw omhoog en draai aan het eind naar een schouderpress positie.',
      'Controleer de draai terug tijdens het zakken.',
    ],
    tips: ['Voel de transitie van borst naar schouder.', 'Houd je core aangespannen tijdens de draai.'],
  },
  'Flyes': {
    icon: '🦋',
    image: 'https://images.unsplash.com/photo-1558611848-73f7eb4001a1?auto=format&fit=crop&w=1200&q=80',
    primaryMuscles: 'Borst',
    equipment: 'Dumbbells of kabels',
    cues: [
      'Lichte buiging in de ellebogen en schouderbladen ingetrokken.',
      'Open de armen in een boog tot net onder schouderlijn.',
      'Breng ze terug door de borst te knijpen, niet uit de armen te trekken.',
    ],
    tips: ['Tempo traag houden, vooral omlaag.', 'Stop als je ellebogen dieper zakken dan je schouders.'],
  },
  'Pull down': {
    icon: '⬇️',
    image: 'https://images.unsplash.com/photo-1517960413843-0aee8e2b3285?auto=format&fit=crop&w=1200&q=80',
    primaryMuscles: 'Latissimus, biceps',
    equipment: 'Lat pulldown',
    cues: [
      'Pak de stang iets breder dan schouderbreed.',
      'Trek je schouderbladen eerst naar beneden, daarna de stang naar borsthoogte.',
      'Controleer de weg omhoog zonder te ver doortrekken.',
    ],
    tips: ['Borst omhoog, kijk vooruit.', 'Voorkom trekken met de onderrug.'],
  },
  'Shoulder Press': {
    icon: '🎯',
    image: 'https://images.unsplash.com/photo-1594737625785-c84c0e1d432b?auto=format&fit=crop&w=1200&q=80',
    primaryMuscles: 'Schouders, triceps',
    equipment: 'Dumbbells of machine',
    cues: [
      'Start met dumbbells op schouderhoogte, palmen naar voren of neutraal.',
      'Duw recht omhoog tot armen bijna gestrekt.',
      'Laat rustig zakken tot net onder oorhoogte.',
    ],
    tips: ['Ribben omlaag, core aangespannen.', 'Vermijd te ver naar achter leunen.'],
  },
  'Seated Row': {
    icon: '🏃',
    image: 'https://images.unsplash.com/photo-1509475826633-fed577a2c71b?auto=format&fit=crop&w=1200&q=80',
    primaryMuscles: 'Rug, biceps, achterste schouder',
    equipment: 'Cable row',
    cues: [
      'Zit rechtop, schouderbladen licht ingetrokken.',
      'Trek de hendel naar je navel, ellebogen langs het lichaam.',
      'Controleer terug zonder de schouders naar voren te laten schieten.',
    ],
    tips: ['Geen rukbewegingen.', 'Houd spanning op de lats tijdens het teruggaan.'],
  },
  'One Arm Row': {
    icon: '🤏',
    image: 'https://images.unsplash.com/photo-1509475826633-fed577a2c71b?auto=format&fit=crop&w=1200&q=80',
    primaryMuscles: 'Rug, biceps',
    equipment: 'Dumbbell + bankje',
    cues: [
      'Hand en knie op de bank, rug neutraal.',
      'Trek de dumbbell naar de heup, elleboog langs de romp.',
      'Laat gecontroleerd zakken tot arm bijna gestrekt.',
    ],
    tips: ['Vermijd draaien in de romp.', 'Houd de nek neutraal, kijk naar de grond.'],
  },
  'Front side Raise': {
    icon: '↗️',
    image: 'https://images.unsplash.com/photo-1594737625785-c84c0e1d432b?auto=format&fit=crop&w=1200&q=80',
    primaryMuscles: 'Voorste en middelste schouder',
    equipment: 'Dumbbells',
    cues: [
      'Hef dumbbells tot schouderhoogte met gestrekte maar zachte armen.',
      'Til voorwaarts of zijwaarts zonder momentum.',
      'Controleer omlaag tot net boven de heup.',
    ],
    tips: ['Lage gewichten, strakke vorm.', 'Polsen neutraal houden.'],
  },
  'Leg Press': {
    icon: '🦵',
    image: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?auto=format&fit=crop&w=1200&q=80',
    primaryMuscles: 'Quads, bilspieren, hamstrings',
    equipment: 'Leg press',
    cues: [
      'Voeten schouderbreed, midden van het platform.',
      'Laat de slede zakken tot knieën ~90° buigen zonder de onderrug te krommen.',
      'Duw uit via de hielen tot benen bijna gestrekt.',
    ],
    tips: ['Houd de heupen tegen de rugleuning.', 'Geen lock-out van de knieën.'],
  },
  'Leg Curl': {
    icon: '🔄',
    image: 'https://images.unsplash.com/photo-1594737625785-c84c0e1d432b?auto=format&fit=crop&w=1200&q=80',
    primaryMuscles: 'Hamstrings',
    equipment: 'Leg curl machine',
    cues: [
      'Stel de rol net boven de enkels in.',
      'Buig de knieën gecontroleerd tot bijna 90°.',
      'Laat langzaam terug zonder de heupen te liften.',
    ],
    tips: ['Span je hamstrings aan voor je begint.', 'Geen zwaaien met de heupen.'],
  },
  'Hack Squad': {
    icon: '⬇️',
    image: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?auto=format&fit=crop&w=1200&q=80',
    primaryMuscles: 'Quads, bilspieren',
    equipment: 'Hack squat machine',
    cues: [
      'Rug tegen het kussen, voeten iets voor je heupen.',
      'Zak tot je bovenbenen parallel zijn, knieën volgen de tenen.',
      'Duw via de hielen omhoog, houd je core aangespannen.',
    ],
    tips: ['Knieën niet laten instorten.', 'Controleer de bodempositie, geen stuit.'],
  },
  'French Press': {
    icon: '⬇️',
    image: 'https://images.unsplash.com/photo-1594737625785-c84c0e1d432b?auto=format&fit=crop&w=1200&q=80',
    primaryMuscles: 'Triceps',
    equipment: 'EZ-bar of dumbbell',
    cues: [
      'Liggend of staand: ellebogen boven de schouders, smal.',
      'Laat de stang achter het hoofd zakken met vaste ellebogen.',
      'Strek de armen door de triceps te knijpen.',
    ],
    tips: ['Elleboogpositie stabiel houden.', 'Gebruik een neutrale grip voor minder polsdruk.'],
  },
  'Biceps Barbell Curl': {
    icon: '💪',
    image: 'https://images.unsplash.com/photo-1585675100414-99d3d6443e0b?auto=format&fit=crop&w=1200&q=80',
    primaryMuscles: 'Biceps',
    equipment: 'Barbell',
    cues: [
      'Staan, ellebogen naast je romp, neutrale polsen.',
      'Krul de stang omhoog zonder te swingen.',
      'Controleer terug tot bijna gestrekte armen.',
    ],
    tips: ['Schouders laag houden.', 'Langzame excentrische fase voor meer spanning.'],
  },
  'Incl. Dumbbell Curl': {
    icon: '💪',
    image: 'https://images.unsplash.com/photo-1585675100414-99d3d6443e0b?auto=format&fit=crop&w=1200&q=80',
    primaryMuscles: 'Biceps (lange kop)',
    equipment: 'Dumbbells + incline bench',
    cues: [
      'Leun achterover, armen hangen recht naar beneden.',
      'Krul omhoog zonder de schouders naar voren te rollen.',
      'Controleer omlaag tot volledige stretch.',
    ],
    tips: ['Elleboog blijft achter de romp.', 'Gebruik licht gewicht voor strakke vorm.'],
  },
  'Reverse Curl': {
    icon: '↗️',
    image: 'https://images.unsplash.com/photo-1585675100414-99d3d6443e0b?auto=format&fit=crop&w=1200&q=80',
    primaryMuscles: 'Brachialis, onderarmen',
    equipment: 'EZ-bar of dumbbells',
    cues: [
      'Pak pronated (handrug omhoog), ellebogen dicht bij de romp.',
      'Krul gecontroleerd omhoog zonder momentum.',
      'Laat langzaam zakken, behoud polsstabiliteit.',
    ],
    tips: ['Houd polsen recht.', 'Niet meeswingen met de heupen.'],
  },
  'Triceps Extension': {
    icon: '✋',
    image: 'https://images.unsplash.com/photo-1594737625785-c84c0e1d432b?auto=format&fit=crop&w=1200&q=80',
    primaryMuscles: 'Triceps',
    equipment: 'Cable of dumbbell',
    cues: [
      'Elleboog vast op één plek, bovenarm stil.',
      'Strek de arm tot bijna volledig, voel de triceps aanspannen.',
      'Controleer terug zonder de schouder te bewegen.',
    ],
    tips: ['Geen ellebogen uitwaaieren.', 'Rustige beweging voor constante spanning.'],
  },
  'Hammer Curl db': {
    icon: '🔨',
    image: 'https://images.unsplash.com/photo-1585675100414-99d3d6443e0b?auto=format&fit=crop&w=1200&q=80',
    primaryMuscles: 'Biceps, brachialis, onderarmen',
    equipment: 'Dumbbells',
    cues: [
      'Neutrale greep (duimen omhoog), ellebogen naast de romp.',
      'Krul omhoog zonder te swingen.',
      'Laat rustig zakken tot bijna gestrekt.',
    ],
    tips: ['Stabiele polsen.', 'Gebruik gecontroleerd tempo.'],
  },
} satisfies Record<string, ExerciseGuide>;
