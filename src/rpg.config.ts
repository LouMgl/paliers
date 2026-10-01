// Toutes les valeurs du système RPG sont ici : modifie-les pour ajuster le jeu.
// Ce sont des repères de jeu, pas des normes médicales.

export interface MainLift {
  id: string;
  label: string;
  /** Reconnaît le nom de l'exercice tel qu'il vient de Hevy */
  match: RegExp;
  /** Pour les haltères, Hevy note le poids d'UN haltère : on double pour le ratio */
  dumbbellFactor: number;
  /** Ratios e1RM / poids de corps pour passer chaque niveau (niveau 1 = sous le premier seuil) */
  thresholds: number[];
  /** Ratio visé pour le « boss » de cet exercice */
  boss: number;
}

export const RPG = {
  xp: {
    sessionBase: 60,
    /** 1 XP par tranche de tonnage… */
    tonnageStep: 100,
    /** …plafonné à ce nombre de points */
    tonnageCap: 40,
    perRecord: 40,
    /** Plafond d'XP par séance : la progression sûre et la régularité comptent plus qu'une séance record */
    sessionCap: 200,
    /** Bonus de série : +5 % par semaine consécutive d'entraînement, jusqu'à +20 % */
    streakBonusPerWeek: 0.05,
    streakBonusMax: 0.2,
    mobilityRoutine: 30,
    mobilityRoutinesPerDay: 2,
    recipeCooked: 20,
    mobilityTestImproved: 25,
  },
  /** XP cumulée pour atteindre le niveau L */
  xpForLevel: (L: number): number => 50 * (L - 1) * L,
  ranks: [
    { min: 1, name: "Recrue" },
    { min: 3, name: "Apprenti" },
    { min: 5, name: "Aventurier" },
    { min: 8, name: "Gardien" },
    { min: 11, name: "Champion" },
    { min: 15, name: "Titan" },
    { min: 20, name: "Légende" },
  ],
  /** Exercices hors « principaux » : 1 niveau tous les +5 % d'e1RM par rapport à la première mesure */
  otherLiftStep: 0.05,
  /** Poids de corps utilisé tant qu'aucune mesure n'est importée (modifiable dans Profil) */
  bodyweightFallbackKg: 70,
  mainLifts: [
    { id: "bench", label: "Développé couché", match: /^Développé Couché( \((Barre|Haltère)\))?$/i, dumbbellFactor: 2, thresholds: [0.5, 0.75, 1, 1.25, 1.5], boss: 1 },
    { id: "squat", label: "Squat", match: /^Squat( \(Barre\))?$/i, dumbbellFactor: 2, thresholds: [0.75, 1, 1.25, 1.5, 2], boss: 1.25 },
    { id: "deadlift", label: "Soulevé de terre", match: /^Soulevé de Terre( \(Barre\))?$/i, dumbbellFactor: 2, thresholds: [1, 1.25, 1.5, 2, 2.5], boss: 1.5 },
    { id: "ohp", label: "Développé militaire", match: /^Développé Militaire( Debout)?( \((Barre|Haltère)\))?$/i, dumbbellFactor: 2, thresholds: [0.35, 0.5, 0.65, 0.8, 1], boss: 0.75 },
    { id: "row", label: "Rowing", match: /^Rowing( Poulie Assis| \(Barre\)| \(Haltère\))?$/i, dumbbellFactor: 2, thresholds: [0.4, 0.6, 0.8, 1, 1.25], boss: 1 },
  ] as MainLift[],
  /** Exercices où le poids saisi est une aide (traction assistée…) : on compte les répétitions */
  assistedMatch: /assist/i,
  stats: {
    /** Fenêtre d'analyse (semaines) pour l'endurance */
    enduranceWeeks: 8,
    /** Séries par semaine considérées comme « pleines » */
    fullWeeklySets: 60,
    /** Séances minimum dans une semaine pour la compter comme « active » */
    activeWeekSessions: 2,
    mobilityRoutinesTarget: 12,
    cookedTarget: 12,
    windowDays: 28,
    scaleMax: 20,
  },
  quests: {
    weeklySessions: 3,
    weeklyRoutines: 3,
    weeklyRecipes: 2,
  },
  mobilityTestEveryDays: 28,
};

export type Rank = (typeof RPG.ranks)[number];

