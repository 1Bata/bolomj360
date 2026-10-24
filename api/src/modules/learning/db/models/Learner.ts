import type { Model } from "mongoose";
import type { IModels } from "../../../../connectionResolvers.ts";
import { type ILearnerDocument, learnerSchema } from "../definitions/learner.ts";

export interface ILearnerPatch {
  displayName?: string;
  grade?: number;
  avatar?: string;
}

export interface ILearnerModel extends Model<ILearnerDocument> {
  ensureProfile(userId: string, displayName: string): Promise<ILearnerDocument>;
  patchProfile(userId: string, patch: ILearnerPatch): Promise<ILearnerDocument | null>;
  touch(
    userId: string,
    update: { coins: number; xp: number; streak: number; lastActiveOn: string },
  ): Promise<ILearnerDocument | null>;
  upgradeCar(
    userId: string,
    expectedLevel: number,
    coinCost: number,
  ): Promise<ILearnerDocument | null>;
  listTop(limit: number): Promise<ILearnerDocument[]>;
  countLearners(): Promise<number>;
}

// Model statics live on the schema class, matching the monorepo's
// loadXClass(models) convention.
export const loadLearnerClass = (models: IModels) => {
  class Learner {
    public static async ensureProfile(userId: string, displayName: string) {
      const existing = await models.Learners.findOne({ userId });

      if (existing) {
        return existing;
      }

      return models.Learners.findOneAndUpdate(
        { userId },
        {
          $setOnInsert: {
            userId,
            displayName,
            grade: 5,
            avatar: "🦊",
            carLevel: 0,
            coins: 0,
            xp: 0,
            streak: 0,
            lastActiveOn: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }

    public static patchProfile(userId: string, patch: ILearnerPatch) {
      return models.Learners.findOneAndUpdate(
        { userId },
        { $set: { ...patch, updatedAt: new Date() } },
        { new: true },
      );
    }

    public static touch(
      userId: string,
      update: { coins: number; xp: number; streak: number; lastActiveOn: string },
    ) {
      return models.Learners.findOneAndUpdate(
        { userId },
        {
          $inc: { coins: update.coins, xp: update.xp },
          $set: {
            streak: update.streak,
            lastActiveOn: update.lastActiveOn,
            updatedAt: new Date(),
          },
        },
        { new: true },
      );
    }

    public static upgradeCar(
      userId: string,
      expectedLevel: number,
      coinCost: number,
    ) {
      const levelFilter =
        expectedLevel === 0
          ? { $or: [{ carLevel: 0 }, { carLevel: { $exists: false } }] }
          : { carLevel: expectedLevel };

      return models.Learners.findOneAndUpdate(
        { userId, coins: { $gte: coinCost }, ...levelFilter },
        {
          $inc: { coins: -coinCost, carLevel: 1 },
          $set: { updatedAt: new Date() },
        },
        { new: true },
      );
    }

    public static listTop(limit: number) {
      return models.Learners.find().sort({ xp: -1, _id: 1 }).limit(limit);
    }

    public static countLearners() {
      return models.Learners.countDocuments();
    }
  }

  learnerSchema.loadClass(Learner);

  return learnerSchema;
};
