// Catalogue de mobilité. Les consignes en texte servent toujours de repli hors ligne.
// Les champs videoUrl restent vides : c'est toi qui choisis et valides les vidéos (Mobilité > Voir la vidéo > Ajouter un lien).

export type Zone = "cheville" | "ischio" | "hanches" | "dos" | "thoracique" | "epaules" | "nuque";

export const ZONES: Record<Zone, string> = {
  cheville: "Chevilles et mollets",
  ischio: "Ischio-jambiers",
  hanches: "Hanches et fessiers",
  dos: "Bas du dos",
  thoracique: "Colonne thoracique",
  epaules: "Épaules et pectoraux",
  nuque: "Nuque",
};

export interface MobilityMove {
  id: string;
  nom: string;
  zone: Zone;
  /** durée par côté, en secondes */
  duree: number;
  cotes: boolean;
  consignes: string;
  erreurs: string;
  videoUrl?: string;
  progression: string;
  dynamique?: boolean;
}

const m = (x: MobilityMove): MobilityMove => x;

export const MOVES: MobilityMove[] = [
  m({ id: "calf", nom: "Mollets au mur", zone: "cheville", duree: 30, cotes: true, consignes: "Face à un mur, une jambe en arrière, talon au sol, jambe tendue. Avance le bassin vers le mur jusqu'à sentir le mollet.", erreurs: "Talon qui décolle, pied qui part vers l'extérieur.", progression: "Recule un peu le pied arrière, ou plie légèrement le genou pour cibler le bas du mollet." }),
  m({ id: "ankle", nom: "Mobilité de cheville", zone: "cheville", duree: 30, cotes: true, consignes: "Pied à plat, face au mur. Pousse le genou vers l'avant au-dessus des orteils sans décoller le talon, puis reviens.", erreurs: "Talon qui se soulève, genou qui rentre vers l'intérieur.", progression: "Éloigne progressivement le pied du mur." }),
  m({ id: "ham", nom: "Ischio-jambiers allongé", zone: "ischio", duree: 30, cotes: true, consignes: "Sur le dos, une jambe tendue vers le plafond, mains ou sangle derrière la cuisse. L'autre jambe fléchie, pied au sol.", erreurs: "Forcer jusqu'à tendre le dos ou fléchir trop le genou.", progression: "Rapproche peu à peu la jambe de toi, puis tends complètement le genou." }),
  m({ id: "fold", nom: "Flexion avant, genoux souples", zone: "ischio", duree: 30, cotes: false, consignes: "Debout, genoux légèrement fléchis, laisse pendre le buste en avant. Bras et tête relâchés, respire lentement.", erreurs: "Rebondir, bloquer les genoux ou forcer dans le bas du dos.", progression: "Tends un peu plus les jambes à mesure que ça se détend. Reviens en te déroulant lentement." }),
  m({ id: "hip", nom: "Fléchisseurs de hanche", zone: "hanches", duree: 30, cotes: true, consignes: "Un genou au sol, l'autre pied devant. Serre la fesse du côté du genou au sol et avance légèrement le bassin. Le dos reste neutre, sans cambrer.", erreurs: "Cambrer le bas du dos au lieu d'avancer le bassin.", progression: "Lève le bras du côté du genou au sol pour intensifier." }),
  m({ id: "fig4", nom: "Fessier et piriforme", zone: "hanches", duree: 30, cotes: true, consignes: "Sur le dos, cheville posée sur le genou opposé. Tire la cuisse vers toi. Tu sens l'étirement sur le côté de la fesse.", erreurs: "Tirer sur le genou plutôt que sur la cuisse.", progression: "Pose d'abord le pied au sol, puis tire la jambe croisée vers la poitrine." }),
  m({ id: "butterfly", nom: "Papillon", zone: "hanches", duree: 40, cotes: false, consignes: "Assis, plantes de pieds l'une contre l'autre, genoux vers l'extérieur. Dos long, penche-toi légèrement en avant.", erreurs: "Dos rond ou pression forcée sur les genoux.", progression: "Rapproche les talons du corps. Ne pousse jamais sur les genoux avec les mains." }),
  m({ id: "nn", nom: "90/90 des hanches", zone: "hanches", duree: 30, cotes: true, consignes: "Assis au sol, une jambe pliée devant, l'autre sur le côté, genoux à 90°. Redresse le dos, puis penche-toi doucement vers la jambe avant.", erreurs: "S'affaler sur le côté ou arrondir le dos.", progression: "Ajoute une petite bascule du buste vers la jambe arrière." }),
  m({ id: "tilt", nom: "Bascule du bassin", zone: "dos", duree: 40, cotes: false, consignes: "Allongé sur le dos, genoux fléchis. En expirant, aplatis doucement le bas du dos contre le sol, puis relâche. Petit mouvement, lent.", erreurs: "Pousser avec les jambes ou retenir sa respiration.", progression: "Augmente peu à peu l'amplitude et la lenteur." }),
  m({ id: "knee", nom: "Genou vers la poitrine", zone: "dos", duree: 30, cotes: true, consignes: "Sur le dos, ramène un genou vers toi avec les mains. L'autre pied reste au sol. Respire dans le ventre, sans forcer.", erreurs: "Soulever la tête ou les épaules.", progression: "Passe à deux genoux en fin de séance si c'est confortable." }),
  m({ id: "twist", nom: "Rotation lombaire allongé", zone: "dos", duree: 30, cotes: true, consignes: "Sur le dos, genoux fléchis, laisse-les tomber d'un côté, épaules bien au sol. Amplitude confortable seulement.", erreurs: "Forcer la rotation ou décoller l'épaule du sol.", progression: "Place un coussin sous les genoux si tu es raide, puis retire-le." }),
  m({ id: "child", nom: "Posture de l'enfant", zone: "dos", duree: 45, cotes: false, consignes: "À genoux, assieds-toi sur les talons et allonge les bras devant toi. Front posé, respiration lente.", erreurs: "Se crisper si les fesses ne descendent pas sur les talons : écarte les genoux ou pose un coussin.", progression: "Marche avec les mains d'un côté puis de l'autre pour étirer les flancs." }),
  m({ id: "cat", nom: "Chat-vache", zone: "dos", duree: 45, cotes: false, consignes: "À quatre pattes, alterne dos rond et dos creux au rythme de la respiration. Lent, sans aller au bout de l'amplitude.", erreurs: "Aller trop vite ou creuser à fond le bas du dos.", progression: "Allonge le mouvement en gardant le contrôle." }),
  m({ id: "bird", nom: "Bird-dog", zone: "dos", duree: 40, cotes: false, consignes: "À quatre pattes, tends un bras et la jambe opposée, bassin stable. Tiens 2 secondes, reviens, alterne les côtés.", erreurs: "Bassin qui bascule ou dos qui se creuse.", progression: "Tiens plus longtemps, ou ajoute un petit cercle du coude vers le genou." }),
  m({ id: "book", nom: "Livre ouvert", zone: "thoracique", duree: 30, cotes: true, consignes: "Allongé sur le côté, genoux fléchis, mains jointes. Ouvre le bras du dessus vers l'arrière en suivant la main du regard.", erreurs: "Laisser les genoux s'écarter.", progression: "Tiens la position ouverte en respirant profondément." }),
  m({ id: "thread", nom: "Enfilage d'aiguille", zone: "thoracique", duree: 30, cotes: true, consignes: "À quatre pattes, glisse un bras sous le corps, paume vers le haut, épaule et tempe vers le sol. Respire lentement.", erreurs: "S'effondrer sur le cou. Reste léger sur la tête.", progression: "Reviens en ouvrant le bras vers le plafond." }),
  m({ id: "chest", nom: "Ouverture des pectoraux", zone: "epaules", duree: 30, cotes: false, consignes: "Debout dans l'encadrement d'une porte, avant-bras contre le cadre. Avance un pied et ouvre la poitrine sans cambrer le dos.", erreurs: "Cambrer le dos ou hausser les épaules.", progression: "Change la hauteur du coude pour varier l'étirement." }),
  m({ id: "cross", nom: "Épaule croisée", zone: "epaules", duree: 25, cotes: true, consignes: "Bras tendu devant la poitrine, ramène-le contre toi avec l'autre bras. Épaule basse, dos droit.", erreurs: "Tirer sur le coude ou tourner le buste.", progression: "Abaisse doucement l'épaule pendant l'expiration." }),
  m({ id: "shoulder", nom: "Cercles d'épaules", zone: "epaules", duree: 30, cotes: false, consignes: "Debout, tourne les épaules en grands cercles lents vers l'arrière, puis vers l'avant.", erreurs: "Aller trop vite.", progression: "Agrandis les cercles peu à peu.", dynamique: true }),
  m({ id: "neckside", nom: "Inclinaison de la nuque", zone: "nuque", duree: 20, cotes: true, consignes: "Assis ou debout, incline l'oreille vers l'épaule. Épaules basses, sans tirer sur la tête avec la main.", erreurs: "Hausser l'épaule du même côté.", progression: "Pose légèrement la main sans pousser ; le poids du bras suffit." }),
  m({ id: "neckrot", nom: "Rotation de la nuque", zone: "nuque", duree: 20, cotes: true, consignes: "Regarde lentement par-dessus l'épaule, menton à l'horizontale, sans forcer.", erreurs: "Rotation brusque ou bloquer la respiration.", progression: "Marque une pause de 2 secondes en fin d'amplitude confortable." }),
  m({ id: "chin", nom: "Menton rentré", zone: "nuque", duree: 30, cotes: false, consignes: "Assis, dos long. Recule doucement la tête comme pour faire un double menton, tiens 3 secondes, relâche.", erreurs: "Baisser ou relever le menton.", progression: "Enchaîne des petites répétitions lentes." }),
  m({ id: "grow", nom: "Grandir la colonne", zone: "dos", duree: 30, cotes: false, consignes: "Assis au fond de ta chaise, pieds à plat. Inspire en t'allongeant vers le haut, expire en relâchant les épaules.", erreurs: "Cambrer le dos ou lever le menton.", progression: "Ajoute une petite élévation des bras à l'inspiration." }),
  m({ id: "stwist", nom: "Rotation assise", zone: "thoracique", duree: 30, cotes: true, consignes: "Assis, pieds à plat, tourne doucement le buste en t'aidant du dossier ou de l'accoudoir. Le bassin reste face à l'écran.", erreurs: "Tourner le bassin ou tirer fort sur l'accoudoir.", progression: "Accompagne la rotation avec le regard." }),
  m({ id: "sfig4", nom: "Fessier assis", zone: "hanches", duree: 30, cotes: true, consignes: "Assis, cheville sur le genou opposé, penche le buste vers l'avant en gardant le dos long.", erreurs: "Arrondir le dos.", progression: "Avance le buste un peu plus loin en gardant le dos droit." }),
  m({ id: "legswing", nom: "Balancier de jambe", zone: "hanches", duree: 30, cotes: true, consignes: "Debout, main sur un appui, balance la jambe d'avant en arrière, en douceur et en contrôle.", erreurs: "Balancer trop fort ou cambrer le dos.", progression: "Augmente peu à peu l'amplitude, jamais l'à-coup.", dynamique: true }),
  m({ id: "hipcircle", nom: "Cercles de hanches", zone: "hanches", duree: 30, cotes: false, consignes: "Debout, mains sur les hanches, dessine de grands cercles lents avec le bassin, dans les deux sens.", erreurs: "Bouger les épaules à la place du bassin.", progression: "Agrandis le cercle et ralentis.", dynamique: true }),
  m({ id: "lungetwist", nom: "Fente avec rotation", zone: "thoracique", duree: 30, cotes: true, consignes: "Fais un pas en avant en fente, pose la main du côté de la jambe arrière au sol ou sur ta cuisse et ouvre l'autre bras vers le plafond.", erreurs: "Dos qui s'arrondit ou genou avant qui rentre.", progression: "Marque une pause en haut avec le regard sur la main.", dynamique: true }),
  m({ id: "squathold", nom: "Squat tenu", zone: "hanches", duree: 40, cotes: false, consignes: "Descends en squat profond, talons au sol si possible, coudes à l'intérieur des genoux. Tiens en respirant. Accroche-toi à un appui si besoin.", erreurs: "Talons qui décollent : surélève-les avec un livre si besoin.", progression: "Réduis l'appui de tes mains progressivement." }),
];

export const MOVE_BY_ID: Record<string, MobilityMove> = Object.fromEntries(MOVES.map((x) => [x.id, x]));

export type Moment = "reveil" | "avant" | "apres" | "bureau" | "soir" | "dos";

export const MOMENTS: Record<Moment, string> = {
  reveil: "Réveil",
  avant: "Avant séance",
  apres: "Après séance",
  bureau: "Pause bureau",
  soir: "Soirée",
  dos: "Stabilité",
};

export interface Routine {
  id: string;
  nom: string;
  moment: Moment;
  resume: string;
  steps: string[];
}

export const ROUTINES: Routine[] = [
  { id: "wake", nom: "Réveil du corps", moment: "reveil", resume: "Dérouille le dos, les hanches et la nuque en douceur, dès le lever.", steps: ["tilt", "knee", "cat", "child", "twist", "neckside"] },
  { id: "pre", nom: "Échauffement dynamique", moment: "avant", resume: "Des mouvements actifs (pas d'étirement long) avant de soulever.", steps: ["cat", "legswing", "hipcircle", "lungetwist", "shoulder", "squathold"] },
  { id: "after", nom: "Retour au calme", moment: "apres", resume: "Étirements tenus après la séance : hanches, jambes, pectoraux.", steps: ["hip", "ham", "fig4", "calf", "chest", "child"] },
  { id: "desk", nom: "Pause bureau", moment: "bureau", resume: "À faire sur ta chaise, une fois par heure ou deux.", steps: ["grow", "stwist", "sfig4", "chin", "neckrot"] },
  { id: "evening", nom: "Détente du soir", moment: "soir", resume: "Une routine calme pour relâcher le corps avant de dormir.", steps: ["child", "butterfly", "fold", "book", "twist", "neckside"] },
  { id: "core", nom: "Stabilité en douceur", moment: "dos", resume: "Réveille les muscles qui protègent ton dos, sans charge.", steps: ["tilt", "cat", "bird", "thread"] },
  { id: "full", nom: "Corps entier", moment: "soir", resume: "Un tour complet : chevilles, jambes, hanches, dos, épaules et nuque.", steps: ["ankle", "fold", "nn", "child", "thread", "cross", "neckside"] },
];

export interface StepPlan {
  id: string;
  nom: string;
  side?: "gauche" | "droite";
  duree: number;
  consignes: string;
  prep?: boolean;
}

export function buildSteps(r: Routine): StepPlan[] {
  const out: StepPlan[] = [{ id: "prep", nom: "Installe-toi", duree: 5, consignes: "Trouve ton espace et respire calmement.", prep: true }];
  for (const id of r.steps) {
    const s = MOVE_BY_ID[id];
    if (s.cotes) for (const side of ["gauche", "droite"] as const) out.push({ id, nom: s.nom, side, duree: s.duree, consignes: s.consignes });
    else out.push({ id, nom: s.nom, duree: s.duree, consignes: s.consignes });
  }
  return out;
}

export const routineMinutes = (r: Routine) =>
  Math.max(1, Math.round(buildSteps(r).slice(1).reduce((a, s) => a + s.duree, 0) / 60));

export interface MobilityTestDef {
  id: string;
  nom: string;
  unite: string;
  consigne: string;
  min: number;
  max: number;
  step: number;
}

/** Plus haut = mieux, pour tous les tests. */
export const TESTS: MobilityTestDef[] = [
  { id: "toe", nom: "Toucher des orteils", unite: "cm", consigne: "Debout, jambes tendues, penche-toi. Mesure la distance entre le bout de tes doigts et tes orteils : positive si tu dépasses les orteils, négative si tu n'y arrives pas (ex. -15).", min: -60, max: 30, step: 1 },
  { id: "squat", nom: "Squat profond", unite: "/5", consigne: "Descends en squat, talons au sol. 1 = très limité, 3 = confortable avec appui, 5 = profond, talons au sol, sans appui.", min: 1, max: 5, step: 1 },
  { id: "arm", nom: "Élévation de bras", unite: "/5", consigne: "Dos contre un mur, lève les bras au-dessus de la tête sans cambrer. 1 = très limité, 5 = bras collés au mur, dos plaqué.", min: 1, max: 5, step: 1 },
  { id: "rot", nom: "Rotation du tronc", unite: "/5", consigne: "Assis, bassin fixe, tourne le buste de chaque côté. 1 = très limité, 5 = grande rotation, sans gêne.", min: 1, max: 5, step: 1 },
];
