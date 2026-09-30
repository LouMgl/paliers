import fs from "node:fs";
const t = fs.readFileSync("paliers.html", "utf8");
const a = t.indexOf("var RECIPES=[");
const b = t.indexOf("];", a);
const R = eval(t.slice(a + "var RECIPES=".length, b + 1));
const out = R.map((r) => ({ id: r.id, nom: r.name, type: r.cat, kcal: r.kcal, proteines: r.p, temps: r.min, tags: r.tags, ingredients: r.ing, etapes: r.steps }));
const body = `import type { Recipe } from "../db.ts";\n\n// Catalogue de départ (tiré du prototype). Les macros sont approximatives, pour une portion.\nexport const RECIPES: Recipe[] = ${JSON.stringify(out, null, 2)};\n\nexport const TYPES: Record<Recipe["type"], string> = {\n  "petit-dej": "Petit-déjeuner",\n  repas: "Repas",\n  snack: "Snack",\n  boisson: "Boisson",\n};\n`;
fs.writeFileSync("src/data/recipes.ts", body);
console.log(out.length);
