// Vidéos YouTube choisies automatiquement : premier résultat intégrable de la recherche sur le nom de l'exercice ou de la recette.
// Tu peux remplacer n'importe lequel depuis l'app (Ajouter / Changer le lien vidéo).
export const VIDEOS: Record<string, string> = {
  "calf": "6i112UgRfNA", // MEILLEUR Etirement de KINÉ pour le MOLLET | Kinésithérapie
  "ankle": "YBmUUz00dLI", // Les 5 meilleurs exercices pour une cheville et un pied en bonne santé
  "ham": "PC-KmNmLLVI", // Étirement des ischio-jambiers
  "fold": "g3f1yhwBOGs", // ÉTIREMENT ISCHIO-JAMBIERS : Technique Debout Toucher Pieds | Améliore 
  "hip": "PwiPq5RfZKk", // Étirement des fléchisseurs de la hanche
  "fig4": "G_LQzVDe2Ts", // Traitement du Piriforme : 5 étirements différents
  "butterfly": "5BJXYk4Bdng", // Fais cette routine TOUS les jours pour des hanches souples et un dos L
  "nn": "nNH8GTq6S54", // Améliore Ta Mobilité de Hanche avec le 90/90
  "tilt": "QSPYJIr9vPY", // Bascule du bassin
  "knee": "AAOyHSLJuDY", // Étirement genou-poitrine
  "twist": "caLe9mphEcE", // Étirement de la rotation lombaire | Exercice pour les douleurs lombair
  "child": "RoycepZ8h74", // La posture de l’enfant
  "cat": "SSDi30vN2hs", // Exercice Chiro : Chat - Vache
  "bird": "BKRlCzV9yto", // Exercice de la table ou « Bird Dog »
  "book": "93C-PRmMra0", // Mobilité thoracique - Étirement du livre ouvert
  "thread": "ceSFd9k6SM4", // Mobilité thoracique
  "chest": "Nd-UfkipKkQ", // Étirement du pectoral
  "cross": "mlUh1XQikKM", // ÉTIREMENT ÉPAULE : Technique Bras Croisé Devant la Poitrine | Libère l
  "shoulder": "mvtecz9I11Q", // Cercles avec les épaules
  "neckside": "ULYT0NRotho", // Exercice d'inclinaison des cervicales
  "neckrot": "K-ngRnPLzbw", // Soulager la douleur à la nuque et aux cervicales en 8 minutes
  "chin": "S7zkERMKiSw", // Rentré le menton | Comment la pratiquer | Avantages | Orthoinfo.ca
  "grow": "WLJSTGEFcEc", // POSTURE ASSISE PROLONGÉE : 3 RÈGLES et 5 EXERCICES pour ne plus avoir 
  "stwist": "7iw-wdunt-o", // TREKFIT - Seated torso rotation / Rotation du tronc assis
  "sfig4": "AixLJ4NcoK0", // Étirement des fessiers sur chaise
  "legswing": "jd7LHosI9jA", // Balancement de jambe.mpg
  "hipcircle": "mGyqV7oYTHY", // Cercles de hanches (mobilisation debout)
  "lungetwist": "YA3GIW6eWBo", // Fentes avec Rotation de Buste : Démonstration, technique, conseils
  "squathold": "YFtbK_E6FHQ", // squat tenu
  "porridge": "jOLDe4_fkGQ", // RECETTE PORRIDGE BEURRE DE CACAHUETES
  "omelette": "41k1dyGmkE8", // Omelette au fromage, si simple si délicat.
  "pancakes": "Stpe90s2pD4", // Comment préparer des crêpes à la banane et à l'avoine saines à 3 ingré
  "toast": "EzwRQiQ2mQg", // Recette AVOCADO TOAST de OUF + OEUF MOLLET
  "curry": "Mkx4iRqcbr4", // POULET AU CURRY - Recette de cuisine facile et rapide
  "bolo": "P0lyEdu18Ac", // 🍝 Les Pâtes à la bolognaise
  "saumon": "ez4zQr6CSnY", // POKE BOL HEALTHY RIZ ET SAUMON (POKE BOWL)
  "steak": "Br6zenKCxAE", // Recette du steak haché, purée & haricots verts
  "wrap": "vh0b87FuqLg", // Recette du thon & fromage frais
  "skyr": "0IkR-f1_sHE", // Cuisinez malin: Breakfast bowl Skyr fruits frais et granola sans glute
  "amandes": "JS2EzWp6yVw", // Breakfast bowl banane, amandes et chocolat
  "shake": "GY0R0BCExRE", // Le Meilleur Smoothie en Prise de Masse Sans Whey
};

export const videoLink = (id: string): string | undefined =>
  VIDEOS[id] ? `https://www.youtube.com/watch?v=${VIDEOS[id]}` : undefined;
