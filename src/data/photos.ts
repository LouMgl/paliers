// Photos des recettes : images sous licence libre (Wikimedia Commons), stockées dans public/recipes/.
// L'attribution est affichée dans chaque recette.
export interface PhotoCredit {
  auteur: string;
  licence: string;
  page: string;
}

export const PHOTO_CREDITS: Record<string, PhotoCredit> = {
  "curry": { auteur: "Gaurav Dhwaj Khadka", licence: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Chicken_Curry_with_Rice.jpg" },
  "porridge": { auteur: "Shisma", licence: "CC BY 4.0", page: "https://commons.wikimedia.org/wiki/File:Banana_oatmeal.jpg" },
  "toast": { auteur: "Asramsey", licence: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Fresh_Avocado_Toast_with_Egg.jpg" },
  "skyr": { auteur: "T.Tseng", licence: "CC BY 2.0", page: "https://commons.wikimedia.org/wiki/File:Yogurt,_fruit,_granola_bowl_(34999358091).jpg" },
  "wrap": { auteur: "Takeaway", licence: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Smoked_chicken_and_avocado_wrap.jpg" },
  "steak": { auteur: "Robert Loescher", licence: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Salisbury_steak_with_mushrooms_and_mashed_potatoes.jpg" },
  "bolo": { auteur: "Noblige (Wikipédia anglaise)", licence: "CC BY-SA 2.5", page: "https://commons.wikimedia.org/wiki/File:Spaghetti_bolognese.jpg" },
  "shake": { auteur: "Maryjeanne.li", licence: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Banana_smoothie_with_weetbix.jpeg" },
  "amandes": { auteur: "HaJunkiyada", licence: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Liat_Portal_for_Foodie_Disorder_-_Banana_Mango_Nut_Bowl.jpg" },
  "saumon": { auteur: "Pokebros", licence: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Salmon_Poke.jpg" },
  "omelette": { auteur: "Horacio Cambeiro", licence: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Omelette_casero_con_queso_derretido_y_piment%C3%B3n.jpg" },
  "pancakes": { auteur: "FitTasteTic", licence: "CC BY-SA 2.0", page: "https://commons.wikimedia.org/wiki/File:Healthy_Banana_Pancakes.jpg" },
};

export const builtinPhoto = (id: string): string | undefined =>
  PHOTO_CREDITS[id] ? `${import.meta.env.BASE_URL}recipes/${id}.jpg` : undefined;
