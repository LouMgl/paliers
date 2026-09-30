import Dexie, { type Table } from "dexie";
import type { SetRow, MeasureRow } from "./hevy.ts";
import type { LogRow, MobilityTest } from "./engine.ts";

// Les données personnelles restent uniquement dans ce navigateur (IndexedDB).
export interface Setting {
  key: string;
  value: unknown;
}
export interface StoredLog extends LogRow {
  id?: number;
}
export interface Recipe {
  id: string;
  nom: string;
  type: "petit-dej" | "repas" | "snack" | "boisson";
  kcal: number;
  proteines: number;
  temps: number;
  tags: string[];
  ingredients: string[];
  etapes: string[];
  videoUrl?: string;
  /** Recette créée par l'utilisateur */
  custom?: boolean;
}
export interface Photo {
  id: string;
  blob: Blob;
}

class PalierDB extends Dexie {
  settings!: Table<Setting, string>;
  sets!: Table<SetRow, string>;
  measures!: Table<MeasureRow, string>;
  logs!: Table<StoredLog, number>;
  tests!: Table<MobilityTest, string>;
  recipes!: Table<Recipe, string>;
  photos!: Table<Photo, string>;
  constructor() {
    super("paliers");
    this.version(1).stores({ settings: "key" });
    this.version(2).stores({
      settings: "key",
      sets: "key, start, day, exercise",
      measures: "date",
      logs: "++id, day, type",
      tests: "date",
      recipes: "id",
      photos: "id",
    });
  }
}

export const db = new PalierDB();

export async function getSetting<T>(key: string): Promise<T | undefined> {
  return (await db.settings.get(key))?.value as T | undefined;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await db.settings.put({ key, value });
}
