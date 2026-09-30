import Dexie, { type Table } from "dexie";

// Les données personnelles restent uniquement dans ce navigateur (IndexedDB).
export interface Setting {
  key: string;
  value: unknown;
}

class PalierDB extends Dexie {
  settings!: Table<Setting, string>;
  constructor() {
    super("paliers");
    this.version(1).stores({ settings: "key" });
  }
}

export const db = new PalierDB();

export async function getSetting<T>(key: string): Promise<T | undefined> {
  return (await db.settings.get(key))?.value as T | undefined;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await db.settings.put({ key, value });
}
