// lib/db.ts
import Dexie, { Table } from "dexie";

export interface Thought {
  id?: number;
  content: string;
  timestamp: Date;
  parentId: number | null;
  sessionId: number;
  branchId: number; // 追加: どの分岐に属するか
}

export interface ThoughtSession {
  id?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Branch {
  id?: number;
  sessionId: number;
  name: string; // 分岐の名前（最初のメッセージから自動生成）
  parentBranchId: number | null; // 親分岐
  rootThoughtId: number; // この分岐の起点となる思考
  createdAt: Date;
}

export class ThoughtDatabase extends Dexie {
  thoughts!: Table<Thought>;
  sessions!: Table<ThoughtSession>;
  branches!: Table<Branch>;

  constructor() {
    super("ThoughtDatabase");
    this.version(2).stores({
      thoughts: "++id, sessionId, parentId, timestamp, branchId",
      sessions: "++id, createdAt, updatedAt",
      branches: "++id, sessionId, parentBranchId, rootThoughtId",
    });
  }
}

export const db = new ThoughtDatabase();
