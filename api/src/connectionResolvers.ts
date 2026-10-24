import type { IMainContext } from "erxes-api-shared/core-types";
import { createGenerateModels } from "erxes-api-shared/utils";
import type { Connection } from "mongoose";
import {
  type IAttemptModel,
  loadAttemptClass,
} from "./modules/learning/db/models/Attempt.ts";
import {
  type ILearnerModel,
  loadLearnerClass,
} from "./modules/learning/db/models/Learner.ts";
import {
  type IMessageModel,
  loadMessageClass,
} from "./modules/learning/db/models/Message.ts";
import type { IAttemptDocument } from "./modules/learning/db/definitions/attempt.ts";
import type { ILearnerDocument } from "./modules/learning/db/definitions/learner.ts";
import type { IMessageDocument } from "./modules/learning/db/definitions/message.ts";

export interface IModels {
  Learners: ILearnerModel;
  Attempts: IAttemptModel;
  Messages: IMessageModel;
}

/**
 * GraphQL resolver context: what `apolloServerContext` in main.ts returns.
 * `subdomain` is the tenant, `models` are bound to that tenant's database.
 */
// IMainContext declares `models?: any`, which would absorb the typed IModels
// in a plain intersection — Omit it first so resolvers get real types.
export type Context = Omit<IMainContext, "models"> & {
  subdomain: string;
  models: IModels;
};

// Every model must come from this factory: createGenerateModels binds the
// connection for the request's tenant (Mongo `useDb` per organization on
// SaaS), so resolvers never touch another tenant's collections.
const loadClasses = (db: Connection) => {
  const models = {} as IModels;

  models.Learners = db.model<ILearnerDocument, ILearnerModel>(
    "bolomj360_learners",
    loadLearnerClass(models),
  );

  models.Attempts = db.model<IAttemptDocument, IAttemptModel>(
    "bolomj360_attempts",
    loadAttemptClass(models),
  );

  models.Messages = db.model<IMessageDocument, IMessageModel>(
    "bolomj360_messages",
    loadMessageClass(models),
  );

  return models;
};

export const generateModels = createGenerateModels<IModels>(loadClasses);
