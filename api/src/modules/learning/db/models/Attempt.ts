import type { Model } from "mongoose";
import type { IModels } from "../../../../connectionResolvers.ts";
import { type IAttemptDocument, attemptSchema } from "../definitions/attempt.ts";

export interface IAttemptInput {
  userId: string;
  grade: number;
  subject: string;
  topicId: string;
  topicTitle: string;
  correct: boolean;
}

export interface ITopicSummary {
  grade: number;
  subject: string;
  topicId: string;
  topicTitle: string;
  attempts: number;
  correct: number;
  lastAttemptAt: Date;
}

export interface IAttemptStats {
  attempts: number;
  correct: number;
}

export interface IAttemptModel extends Model<IAttemptDocument> {
  createAttempt(input: IAttemptInput): Promise<IAttemptDocument>;
  summary(userId: string): Promise<ITopicSummary[]>;
  recent(userId: string, limit: number): Promise<IAttemptDocument[]>;
  stats(): Promise<IAttemptStats>;
}

export const loadAttemptClass = (models: IModels) => {
  class Attempt {
    public static createAttempt(input: IAttemptInput) {
      return models.Attempts.create({ ...input, createdAt: new Date() });
    }

    public static summary(userId: string) {
      return models.Attempts.aggregate<ITopicSummary>([
        { $match: { userId } },
        {
          $group: {
            _id: {
              grade: "$grade",
              subject: "$subject",
              topicId: "$topicId",
              topicTitle: "$topicTitle",
            },
            attempts: { $sum: 1 },
            correct: { $sum: { $cond: ["$correct", 1, 0] } },
            lastAttemptAt: { $max: "$createdAt" },
          },
        },
        { $sort: { lastAttemptAt: -1 } },
        {
          $project: {
            _id: 0,
            grade: "$_id.grade",
            subject: "$_id.subject",
            topicId: "$_id.topicId",
            topicTitle: "$_id.topicTitle",
            attempts: 1,
            correct: 1,
            lastAttemptAt: 1,
          },
        },
      ]);
    }

    public static recent(userId: string, limit: number) {
      return models.Attempts.find({ userId })
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit);
    }

    public static async stats() {
      const [row] = await models.Attempts.aggregate<IAttemptStats>([
        {
          $group: {
            _id: null,
            attempts: { $sum: 1 },
            correct: { $sum: { $cond: ["$correct", 1, 0] } },
          },
        },
        { $project: { _id: 0, attempts: 1, correct: 1 } },
      ]);

      return row ?? { attempts: 0, correct: 0 };
    }
  }

  attemptSchema.loadClass(Attempt);

  return attemptSchema;
};
