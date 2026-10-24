import { schemaWrapper } from "erxes-api-shared/utils";
import { Schema, type Document } from "mongoose";

export interface IAttempt {
  userId: string;
  grade: number;
  subject: string;
  topicId: string;
  topicTitle: string;
  correct: boolean;
  createdAt: Date;
}

export interface IAttemptDocument extends IAttempt, Document {}

// Append-only answer history. Profiles are derived from it so the UI can show
// per-topic progress and accuracy without trusting client-side counters.
export const attemptSchema = schemaWrapper(
  new Schema({
    userId: { type: String, required: true, index: true },
    grade: { type: Number, required: true, min: 1, max: 12 },
    subject: { type: String, required: true, trim: true },
    topicId: { type: String, required: true, trim: true },
    topicTitle: { type: String, required: true, trim: true },
    correct: { type: Boolean, required: true },
    createdAt: { type: Date, default: Date.now },
  }),
);

attemptSchema.index({ userId: 1, createdAt: -1 });
