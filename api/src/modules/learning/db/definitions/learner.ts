import { schemaWrapper } from "erxes-api-shared/utils";
import { Schema, type Document } from "mongoose";

export interface ILearner {
  userId: string;
  displayName: string;
  grade: number;
  avatar: string;
  carLevel: number;
  coins: number;
  xp: number;
  streak: number;
  lastActiveOn: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILearnerDocument extends ILearner, Document {}

// One profile per signed-in user in the tenant's database. Progress, coins and
// streaks live here; per-question history lives in bolomj360_attempts.
export const learnerSchema = schemaWrapper(
  new Schema({
    userId: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, required: true, trim: true },
    grade: { type: Number, required: true, min: 1, max: 12, default: 5 },
    avatar: { type: String, required: true, default: "🦊" },
    carLevel: { type: Number, required: true, min: 0, max: 3, default: 0 },
    coins: { type: Number, required: true, min: 0, default: 0 },
    xp: { type: Number, required: true, min: 0, default: 0 },
    streak: { type: Number, required: true, min: 0, default: 0 },
    lastActiveOn: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  }),
);
