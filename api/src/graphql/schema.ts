import { gql } from "graphql-tag";
import { GraphQLError } from "graphql";
import { manifest } from "../config.ts";
import type { Context, IModels } from "../connectionResolvers.ts";
import type { ILearnerDocument } from "../modules/learning/db/definitions/learner.ts";
import {
  INBOX_WRITE,
  LEARNING_READ,
  LEARNING_WRITE,
} from "../permissions.ts";

// Every type and operation is prefixed with the plugin name: the gateway
// composes all plugins into one supergraph, so names must be unique across it.
export const typeDefs = gql`
  extend schema @link(url: "https://specs.apollo.dev/federation/v2.9", import: ["@key"])

  type Bolomj360Status {
    plugin: String!
    version: String!
    subdomain: String!
    userId: String
    userEmail: String
  }

  type Bolomj360Totals {
    attempts: Int!
    correct: Int!
    accuracy: Int!
    topicsCompleted: Int!
  }

  type Bolomj360TopicProgress {
    grade: Int!
    subject: String!
    topicId: String!
    topicTitle: String!
    attempts: Int!
    correct: Int!
    lastAttemptAt: String
  }

  type Bolomj360Attempt {
    _id: ID!
    grade: Int!
    subject: String!
    topicId: String!
    topicTitle: String!
    correct: Boolean!
    createdAt: String!
  }

  type Bolomj360Profile {
    _id: ID!
    displayName: String!
    grade: Int!
    avatar: String!
    carLevel: Int!
    coins: Int!
    xp: Int!
    streak: Int!
    lastActiveOn: String
    totals: Bolomj360Totals!
    topics: [Bolomj360TopicProgress!]!
    recentAttempts: [Bolomj360Attempt!]!
    createdAt: String!
  }

  type Bolomj360AttemptResult {
    profile: Bolomj360Profile!
    coinsEarned: Int!
    xpEarned: Int!
  }

  type Bolomj360GarageResult {
    profile: Bolomj360Profile!
    coinsSpent: Int!
  }

  type Bolomj360Leader {
    rank: Int!
    displayName: String!
    avatar: String!
    grade: Int!
    xp: Int!
    streak: Int!
  }

  type Bolomj360Stats {
    learners: Int!
    attempts: Int!
    correct: Int!
    accuracy: Int!
  }

  input Bolomj360ProfileInput {
    displayName: String
    grade: Int
    avatar: String
  }

  input Bolomj360AttemptInput {
    grade: Int!
    subject: String!
    topicId: String!
    topicTitle: String!
    correct: Boolean!
    difficulty: String
  }

  input Bolomj360MessageInput {
    name: String!
    contact: String!
    body: String!
  }

  type Query {
    bolomj360Status: Bolomj360Status!
    bolomj360Profile: Bolomj360Profile!
    bolomj360Leaderboard(limit: Int = 10): [Bolomj360Leader!]!
    bolomj360Stats: Bolomj360Stats!
  }

  type Mutation {
    bolomj360UpdateProfile(input: Bolomj360ProfileInput!): Bolomj360Profile!
    bolomj360RecordAttempt(input: Bolomj360AttemptInput!): Bolomj360AttemptResult!
    bolomj360UpgradeCar(expectedLevel: Int!): Bolomj360GarageResult!
    bolomj360SubmitMessage(input: Bolomj360MessageInput!): Boolean!
  }
`;

// Correct answers needed before a topic counts as completed in progress views.
const TOPIC_TARGET = 5;
const DAY_MS = 86_400_000;

const badInput = (message: string) =>
  new GraphQLError(message, { extensions: { code: "BAD_USER_INPUT" } });

const clean = (value: string) => value.trim().replace(/\s+/g, " ");

const dayKey = (offsetDays = 0) =>
  new Date(Date.now() + offsetDays * DAY_MS).toISOString().slice(0, 10);

const requireUserId = (user: Context["user"]) => {
  const userId = user?._id;

  if (!userId) {
    throw new GraphQLError("Login required", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  return String(userId);
};

const requireTenant = (subdomain: string) => {
  if (!subdomain) {
    throw new GraphQLError("Tenant required", {
      extensions: { code: "FORBIDDEN" },
    });
  }
};

const defaultDisplayName = (user: Context["user"]) => {
  const email = user?.email;

  if (!email) {
    return "Сурагч";
  }

  const name = clean(email.split("@")[0] ?? "");

  return name.length >= 2 ? name.slice(0, 40) : "Сурагч";
};

const nextStreak = (learner: ILearnerDocument) => {
  const today = dayKey();

  if (learner.lastActiveOn === today) {
    return Math.max(learner.streak, 1);
  }

  if (learner.lastActiveOn === dayKey(-1)) {
    return learner.streak + 1;
  }

  return 1;
};

const buildProfile = async (models: IModels, learner: ILearnerDocument) => {
  const [summary, recent] = await Promise.all([
    models.Attempts.summary(learner.userId),
    models.Attempts.recent(learner.userId, 8),
  ]);

  const attempts = summary.reduce((total, topic) => total + topic.attempts, 0);
  const correct = summary.reduce((total, topic) => total + topic.correct, 0);

  return {
    _id: String(learner._id),
    displayName: learner.displayName,
    grade: learner.grade,
    avatar: learner.avatar,
    carLevel: learner.carLevel ?? 0,
    coins: learner.coins,
    xp: learner.xp,
    streak: learner.streak,
    lastActiveOn: learner.lastActiveOn,
    totals: {
      attempts,
      correct,
      accuracy: attempts > 0 ? Math.round((correct / attempts) * 100) : 0,
      topicsCompleted: summary.filter((topic) => topic.correct >= TOPIC_TARGET)
        .length,
    },
    topics: summary.map((topic) => ({
      grade: topic.grade,
      subject: topic.subject,
      topicId: topic.topicId,
      topicTitle: topic.topicTitle,
      attempts: topic.attempts,
      correct: topic.correct,
      lastAttemptAt: new Date(topic.lastAttemptAt).toISOString(),
    })),
    recentAttempts: recent.map((attempt) => ({
      _id: String(attempt._id),
      grade: attempt.grade,
      subject: attempt.subject,
      topicId: attempt.topicId,
      topicTitle: attempt.topicTitle,
      correct: attempt.correct,
      createdAt: attempt.createdAt.toISOString(),
    })),
    createdAt: learner.createdAt.toISOString(),
  };
};

const ensureLearner = async (context: Context, userId: string) => {
  const learner = await context.models.Learners.ensureProfile(
    userId,
    defaultDisplayName(context.user),
  );

  if (!learner) {
    throw new GraphQLError("Could not create learner profile", {
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
  }

  return learner;
};

interface ProfileInput {
  displayName?: string | null;
  grade?: number | null;
  avatar?: string | null;
}

interface AttemptInput {
  grade: number;
  subject: string;
  topicId: string;
  topicTitle: string;
  correct: boolean;
  difficulty?: string | null;
}

interface MessageInput {
  name: string;
  contact: string;
  body: string;
}

export const resolvers = {
  Query: {
    bolomj360Status: (
      _parent: unknown,
      _args: unknown,
      { subdomain, user }: Context,
    ) => ({
      plugin: manifest.name,
      version: manifest.version,
      subdomain,
      userId: user?._id ?? null,
      userEmail: user?.email ?? null,
    }),
    bolomj360Profile: async (
      _parent: unknown,
      _args: unknown,
      context: Context,
    ) => {
      const userId = requireUserId(context.user);
      requireTenant(context.subdomain);
      await context.checkPermission(LEARNING_READ);

      const learner = await ensureLearner(context, userId);

      return buildProfile(context.models, learner);
    },
    bolomj360Leaderboard: async (
      _parent: unknown,
      { limit = 10 }: { limit?: number },
      context: Context,
    ) => {
      const userId = requireUserId(context.user);
      requireTenant(context.subdomain);
      await context.checkPermission(LEARNING_READ);

      if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
        throw badInput("Use limit 1–50");
      }

      // Keep the caller's own row out of a list that is about peers.
      const learners = (await context.models.Learners.listTop(limit + 1)).filter(
        (learner) => learner.userId !== userId,
      );

      return learners.slice(0, limit).map((learner, index) => ({
        rank: index + 1,
        displayName: learner.displayName,
        avatar: learner.avatar,
        grade: learner.grade,
        xp: learner.xp,
        streak: learner.streak,
      }));
    },
    bolomj360Stats: async (
      _parent: unknown,
      _args: unknown,
      context: Context,
    ) => {
      requireUserId(context.user);
      requireTenant(context.subdomain);
      await context.checkPermission(LEARNING_READ);

      const [learners, stats] = await Promise.all([
        context.models.Learners.countLearners(),
        context.models.Attempts.stats(),
      ]);

      return {
        learners,
        attempts: stats.attempts,
        correct: stats.correct,
        accuracy:
          stats.attempts > 0
            ? Math.round((stats.correct / stats.attempts) * 100)
            : 0,
      };
    },
  },
  Mutation: {
    bolomj360UpdateProfile: async (
      _parent: unknown,
      { input }: { input: ProfileInput },
      context: Context,
    ) => {
      const userId = requireUserId(context.user);
      requireTenant(context.subdomain);
      await context.checkPermission(LEARNING_WRITE);
      await ensureLearner(context, userId);

      const patch: { displayName?: string; grade?: number; avatar?: string } = {};

      if (input.displayName !== undefined && input.displayName !== null) {
        const displayName = clean(input.displayName);

        if (displayName.length < 2 || displayName.length > 40) {
          throw badInput("Display name must be 2–40 characters");
        }

        patch.displayName = displayName;
      }

      if (input.grade !== undefined && input.grade !== null) {
        if (!Number.isInteger(input.grade) || input.grade < 1 || input.grade > 12) {
          throw badInput("Grade must be between 1 and 12");
        }

        patch.grade = input.grade;
      }

      if (input.avatar !== undefined && input.avatar !== null) {
        const avatar = input.avatar.trim();

        if (avatar.length < 1 || avatar.length > 8) {
          throw badInput("Avatar must be one emoji");
        }

        patch.avatar = avatar;
      }

      const learner = await context.models.Learners.patchProfile(userId, patch);

      if (!learner) {
        throw new GraphQLError("Learner not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      return buildProfile(context.models, learner);
    },
    bolomj360RecordAttempt: async (
      _parent: unknown,
      { input }: { input: AttemptInput },
      context: Context,
    ) => {
      const userId = requireUserId(context.user);
      requireTenant(context.subdomain);
      await context.checkPermission(LEARNING_WRITE);

      const subject = clean(input.subject);
      const topicTitle = clean(input.topicTitle);
      const topicId = input.topicId.trim();

      if (
        !Number.isInteger(input.grade) ||
        input.grade < 1 ||
        input.grade > 12
      ) {
        throw badInput("Grade must be between 1 and 12");
      }

      if (subject.length < 2 || subject.length > 60) {
        throw badInput("Subject must be 2–60 characters");
      }

      if (topicTitle.length < 2 || topicTitle.length > 80) {
        throw badInput("Topic title must be 2–80 characters");
      }

      if (topicId.length < 2 || topicId.length > 64) {
        throw badInput("Topic id must be 2–64 characters");
      }

      if (typeof input.correct !== "boolean") {
        throw badInput("correct must be a boolean");
      }

      const rewards: Record<string, number> = {
        easy: 1,
        hard: 2,
        impossible: 3,
      };
      const difficulty = input.difficulty ?? undefined;

      if (
        difficulty !== undefined &&
        (subject !== "Тоглоом" ||
          !["easy", "hard", "impossible"].includes(difficulty))
      ) {
        throw badInput("Difficulty rewards are only valid for game attempts");
      }

      const learner = await ensureLearner(context, userId);
      const coinsEarned = input.correct
        ? difficulty === undefined
          ? 2
          : (rewards[difficulty] ?? 0)
        : 0;
      const xpEarned = input.correct ? 10 : 2;

      await context.models.Attempts.createAttempt({
        userId,
        grade: input.grade,
        subject,
        topicId,
        topicTitle,
        correct: input.correct,
      });

      const updated = await context.models.Learners.touch(userId, {
        coins: coinsEarned,
        xp: xpEarned,
        streak: nextStreak(learner),
        lastActiveOn: dayKey(),
      });

      if (!updated) {
        throw new GraphQLError("Learner not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      return {
        profile: await buildProfile(context.models, updated),
        coinsEarned,
        xpEarned,
      };
    },
    bolomj360UpgradeCar: async (
      _parent: unknown,
      { expectedLevel }: { expectedLevel: number },
      context: Context,
    ) => {
      const userId = requireUserId(context.user);
      requireTenant(context.subdomain);
      await context.checkPermission(LEARNING_WRITE);

      if (
        !Number.isInteger(expectedLevel) ||
        expectedLevel < 0 ||
        expectedLevel > 2
      ) {
        throw badInput("Car is already at maximum level");
      }

      const upgradeCosts = [15, 30, 60];
      const coinsSpent = upgradeCosts[expectedLevel] ?? 0;
      const learner = await ensureLearner(context, userId);
      const currentLevel = learner.carLevel ?? 0;

      if (currentLevel !== expectedLevel) {
        throw badInput("Car level changed; refresh the game and try again");
      }

      if (learner.coins < coinsSpent) {
        throw badInput("Not enough coins to upgrade the car");
      }

      const upgraded = await context.models.Learners.upgradeCar(
        userId,
        expectedLevel,
        coinsSpent,
      );

      if (!upgraded) {
        throw badInput("Could not upgrade the car; refresh and try again");
      }

      return {
        profile: await buildProfile(context.models, upgraded),
        coinsSpent,
      };
    },
    bolomj360SubmitMessage: async (
      _parent: unknown,
      { input }: { input: MessageInput },
      context: Context,
    ) => {
      const userId = requireUserId(context.user);
      requireTenant(context.subdomain);
      await context.checkPermission(INBOX_WRITE);

      const name = clean(input.name);
      const contact = clean(input.contact);
      const body = input.body.trim();

      if (name.length < 2 || name.length > 60) {
        throw badInput("Name must be 2–60 characters");
      }

      if (contact.length < 3 || contact.length > 120) {
        throw badInput("Contact must be 3–120 characters");
      }

      if (body.length < 5 || body.length > 2000) {
        throw badInput("Message must be 5–2000 characters");
      }

      await context.models.Messages.createMessage({
        userId,
        name,
        contact,
        body,
      });

      return true;
    },
  },
};
