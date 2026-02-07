// lib/db.ts
import Dexie, { Table } from "dexie";

export interface Thought {
  id?: number;
  content: string;
  timestamp: Date;
  parentId: number | null;
  sessionId: number;
}

export interface ThoughtSession {
  id?: number;
  createdAt: Date;
  updatedAt: Date;
  x?: number;
  y?: number;
}

export class ThoughtDatabase extends Dexie {
  thoughts!: Table<Thought>;
  sessions!: Table<ThoughtSession>;

  constructor() {
    super("ThoughtDatabase");
    this.version(1).stores({
      thoughts: "++id, sessionId, parentId, timestamp",
      sessions: "++id, createdAt, updatedAt",
    });
  }
}

export const db = new ThoughtDatabase();
