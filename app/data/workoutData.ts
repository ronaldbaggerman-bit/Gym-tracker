export const WORKOUT_DATA = {
  schemas: [
    {
      id: 'schema1',
      name: 'Schema 1',
      description: 'Push/Pull - Upper Body',
      color: '#34C759',
      muscleGroups: [
        {
          id: 'borst',
          name: 'Borst',
          exercises: [
            { id: 101, name: 'Chest Press', met: 5.0 },
            { id: 102, name: 'DB Press', met: 5.0 },
            { id: 118, name: 'Db chest turn shoulder press', met: 5.0 },
          ],
        },
        {
          id: 'schouder',
          name: 'Schouder',
          exercises: [
            { id: 103, name: 'Flyes', met: 5.0 },
            { id: 104, name: 'Pull down', met: 5.0 },
            { id: 107, name: 'Shoulder Press', met: 5.0 },
          ],
        },
        {
          id: 'rug',
          name: 'Rug',
          exercises: [
            { id: 105, name: 'Seated Row', met: 5.0 },
          ],
        },
        {
          id: 'triceps_biceps',
          name: 'Triceps / Biceps',
          exercises: [
            { id: 106, name: 'One Arm Row', met: 5.0 },
            { id: 108, name: 'Front side Raise', met: 5.0 },
          ],
        },
      ],
    },
    {
      id: 'schema2',
      name: 'Schema 2',
      description: 'Legs & Arms - Lower Body Focus',
      color: '#FF9500',
      muscleGroups: [
        {
          id: 'benen',
          name: 'Benen',
          exercises: [
            { id: 109, name: 'Leg Press', met: 5.0 },
            { id: 110, name: 'Leg Curl', met: 5.0 },
            { id: 111, name: 'Hack Squad', met: 5.0 },
          ],
        },
        {
          id: 'triceps_biceps_2',
          name: 'Triceps / Biceps',
          exercises: [
            { id: 112, name: 'French Press', met: 5.0 },
            { id: 113, name: 'Biceps Barbell Curl', met: 5.0 },
            { id: 114, name: 'Incl. Dumbbell Curl', met: 5.0 },
            { id: 115, name: 'Reverse Curl', met: 5.0 },
            { id: 116, name: 'Triceps Extension', met: 5.0 },
            { id: 117, name: 'Hammer Curl db', met: 5.0 },
          ],
        },
      ],
    },
  ],
};

export type Schema = typeof WORKOUT_DATA.schemas[0];
export type MuscleGroup = Schema['muscleGroups'][0];
export type Exercise = MuscleGroup['exercises'][0];
