import type { Recipe } from "../db.ts";

// Catalogue de départ (tiré du prototype). Les macros sont approximatives, pour une portion.
export const RECIPES: Recipe[] = [
  {
    "id": "porridge",
    "nom": "Porridge banane et beurre de cacahuète",
    "type": "petit-dej",
    "kcal": 650,
    "proteines": 28,
    "temps": 8,
    "tags": [
      "Rapide",
      "Calories denses"
    ],
    "ingredients": [
      "80 g de flocons d'avoine",
      "300 ml de lait entier",
      "1 banane",
      "1 c. à soupe de beurre de cacahuète",
      "1 c. à café de miel",
      "1 pincée de cannelle"
    ],
    "etapes": [
      "Chauffe le lait avec les flocons à feu moyen pendant 4 à 5 minutes en remuant.",
      "Écrase la moitié de la banane dans le porridge en fin de cuisson.",
      "Verse dans un bol, ajoute le reste de la banane en rondelles, le beurre de cacahuète, le miel et la cannelle."
    ]
  },
  {
    "id": "omelette",
    "nom": "Omelette 4 œufs, fromage et pain complet",
    "type": "petit-dej",
    "kcal": 620,
    "proteines": 38,
    "temps": 10,
    "tags": [
      "Riche en protéines",
      "Rapide"
    ],
    "ingredients": [
      "4 œufs",
      "30 g d'emmental râpé",
      "2 tranches de pain complet",
      "1 c. à café d'huile d'olive",
      "Sel, poivre",
      "1 fruit au choix"
    ],
    "etapes": [
      "Bats les œufs avec sel et poivre.",
      "Chauffe l'huile dans une poêle, verse les œufs et laisse prendre à feu moyen.",
      "Ajoute le fromage, replie l'omelette et sers avec le pain grillé et le fruit."
    ]
  },
  {
    "id": "pancakes",
    "nom": "Pancakes banane et avoine",
    "type": "petit-dej",
    "kcal": 560,
    "proteines": 33,
    "temps": 15,
    "tags": [
      "Riche en protéines",
      "Sans farine"
    ],
    "ingredients": [
      "80 g de flocons d'avoine",
      "2 œufs",
      "1 banane",
      "100 g de fromage blanc",
      "1 c. à café de levure chimique",
      "1 c. à café d'huile ou de beurre pour la poêle"
    ],
    "etapes": [
      "Mixe les flocons, les œufs, la banane, le fromage blanc et la levure jusqu'à une pâte lisse.",
      "Fais chauffer la poêle légèrement huilée.",
      "Cuis des petits pancakes 2 minutes par face à feu moyen.",
      "Sers avec un peu de miel ou des fruits rouges."
    ]
  },
  {
    "id": "toast",
    "nom": "Toasts avocat et œufs",
    "type": "petit-dej",
    "kcal": 540,
    "proteines": 26,
    "temps": 10,
    "tags": [
      "Rapide"
    ],
    "ingredients": [
      "2 tranches de pain complet",
      "1/2 avocat",
      "2 œufs",
      "1 c. à café d'huile d'olive",
      "Sel, poivre, piment (facultatif)"
    ],
    "etapes": [
      "Grille le pain.",
      "Cuis les œufs au plat ou brouillés dans l'huile.",
      "Écrase l'avocat sur les toasts, assaisonne, dépose les œufs dessus."
    ]
  },
  {
    "id": "curry",
    "nom": "Poulet-riz curry crémeux",
    "type": "repas",
    "kcal": 730,
    "proteines": 52,
    "temps": 25,
    "tags": [
      "Riche en protéines",
      "Calories denses"
    ],
    "ingredients": [
      "150 g de blanc de poulet",
      "100 g de riz (poids cru)",
      "1/2 oignon",
      "1 c. à café de curry",
      "80 ml de crème liquide légère",
      "1 c. à soupe d'huile d'olive",
      "Sel, poivre"
    ],
    "etapes": [
      "Cuis le riz selon les indications du paquet.",
      "Fais dorer l'oignon émincé dans l'huile, ajoute le poulet en dés et le curry.",
      "Cuis 8 minutes, verse la crème et laisse mijoter 3 minutes.",
      "Sers sur le riz."
    ]
  },
  {
    "id": "bolo",
    "nom": "Pâtes bolognaise renforcée",
    "type": "repas",
    "kcal": 760,
    "proteines": 48,
    "temps": 25,
    "tags": [
      "Riche en protéines",
      "Calories denses"
    ],
    "ingredients": [
      "100 g de pâtes (poids cru)",
      "150 g de bœuf haché 5 % de matière grasse",
      "150 g de sauce tomate",
      "1/2 oignon",
      "1 c. à soupe d'huile d'olive",
      "20 g de parmesan râpé"
    ],
    "etapes": [
      "Fais dorer l'oignon dans l'huile, ajoute le bœuf et émiette-le.",
      "Verse la sauce tomate, sale, poivre, laisse mijoter 10 minutes.",
      "Cuis les pâtes, mélange avec la sauce et termine avec le parmesan."
    ]
  },
  {
    "id": "saumon",
    "nom": "Bowl saumon, riz et avocat",
    "type": "repas",
    "kcal": 780,
    "proteines": 42,
    "temps": 20,
    "tags": [
      "Bon gras",
      "Calories denses"
    ],
    "ingredients": [
      "130 g de pavé de saumon",
      "90 g de riz (poids cru)",
      "1/2 avocat",
      "1/2 concombre",
      "1 c. à soupe de sauce soja",
      "1 c. à café d'huile de sésame",
      "Graines de sésame"
    ],
    "etapes": [
      "Cuis le riz.",
      "Cuis le saumon à la poêle 3 à 4 minutes par face, puis émiette-le.",
      "Monte le bol : riz, saumon, avocat en tranches, concombre.",
      "Assaisonne avec la sauce soja, l'huile de sésame et les graines."
    ]
  },
  {
    "id": "steak",
    "nom": "Steak haché, pommes de terre rôties et haricots verts",
    "type": "repas",
    "kcal": 690,
    "proteines": 46,
    "temps": 35,
    "tags": [
      "Riche en protéines"
    ],
    "ingredients": [
      "200 g de bœuf haché 5 % de matière grasse",
      "300 g de pommes de terre",
      "150 g de haricots verts",
      "1 c. à soupe d'huile d'olive",
      "Paprika, sel, poivre"
    ],
    "etapes": [
      "Coupe les pommes de terre en morceaux, enrobe-les d'huile et de paprika, enfourne 25 minutes à 200 °C.",
      "Cuis les haricots verts 8 minutes à l'eau bouillante.",
      "Forme deux steaks, poêle-les 3 à 4 minutes par face.",
      "Sers le tout ensemble."
    ]
  },
  {
    "id": "wrap",
    "nom": "Wraps thon et fromage frais",
    "type": "repas",
    "kcal": 520,
    "proteines": 36,
    "temps": 8,
    "tags": [
      "Rapide",
      "Sans cuisson"
    ],
    "ingredients": [
      "2 tortillas de blé",
      "1 boîte de thon au naturel (140 g)",
      "60 g de fromage frais",
      "2 c. à soupe de maïs",
      "Salade, citron, poivre"
    ],
    "etapes": [
      "Mélange le thon égoutté avec le fromage frais, le maïs, un filet de citron et du poivre.",
      "Garnis les tortillas avec la salade et le mélange, puis roule-les."
    ]
  },
  {
    "id": "skyr",
    "nom": "Skyr, granola et miel",
    "type": "snack",
    "kcal": 430,
    "proteines": 32,
    "temps": 3,
    "tags": [
      "Sans cuisson",
      "Riche en protéines"
    ],
    "ingredients": [
      "250 g de skyr nature",
      "40 g de granola",
      "1 c. à soupe de miel",
      "Une poignée de fruits rouges"
    ],
    "etapes": [
      "Verse le skyr dans un bol.",
      "Ajoute le granola, les fruits et le miel."
    ]
  },
  {
    "id": "amandes",
    "nom": "Banane, amandes et chocolat noir",
    "type": "snack",
    "kcal": 380,
    "proteines": 9,
    "temps": 2,
    "tags": [
      "Sans cuisson",
      "Emportable"
    ],
    "ingredients": [
      "1 banane",
      "30 g d'amandes",
      "20 g de chocolat noir"
    ],
    "etapes": [
      "Mange le tout ensemble, ou fais fondre le chocolat pour tremper la banane."
    ]
  },
  {
    "id": "shake",
    "nom": "Shake prise de masse",
    "type": "boisson",
    "kcal": 700,
    "proteines": 40,
    "temps": 3,
    "tags": [
      "Sans cuisson",
      "Calories denses",
      "Facile à boire"
    ],
    "ingredients": [
      "300 ml de lait entier",
      "1 banane",
      "60 g de flocons d'avoine",
      "1 c. à soupe de beurre de cacahuète",
      "1 dose de whey (30 g)"
    ],
    "etapes": [
      "Mets tous les ingrédients dans un blender.",
      "Mixe 1 minute jusqu'à obtenir une texture lisse.",
      "Bois tout de suite ou dans l'heure qui suit."
    ]
  }
];

export const CONTEXTES: Record<NonNullable<Recipe["contexte"]>, string> = {
  entrainement: "Jour d'entraînement",
  "petit-appetit": "Petit appétit",
  polyvalent: "Polyvalent",
};

export const TYPES: Record<Recipe["type"], string> = {
  "petit-dej": "Petit-déjeuner",
  repas: "Repas",
  snack: "Snack",
  boisson: "Boisson",
};

