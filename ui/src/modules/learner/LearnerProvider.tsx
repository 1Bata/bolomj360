import {
  useMutation,
  useQuery,
  type ApolloError,
} from "@apollo/client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  Bolomj360ProfileQuery,
  Bolomj360RecordAttemptMutationVariables,
  Bolomj360UpdateProfileMutationVariables,
} from "~/gql/graphql";
import { TOPIC_TARGET } from "~/modules/curriculum/curriculum";
import {
  PROFILE_QUERY,
  RECORD_ATTEMPT_MUTATION,
  UPGRADE_CAR_MUTATION,
  UPDATE_PROFILE_MUTATION,
} from "./operations";

export type LearnerProfile = Bolomj360ProfileQuery["bolomj360Profile"];
export type AttemptInput = Bolomj360RecordAttemptMutationVariables["input"];
export type ProfileInput = Bolomj360UpdateProfileMutationVariables["input"];
export type LearnerMode = "live" | "offline" | "local";

const CACHE_KEY = "bolomj360:profile:v1";
const ATTEMPT_QUEUE_KEY = "bolomj360:attempt-queue:v1";
const CAR_QUEUE_KEY = "bolomj360:car-upgrade-queue:v1";
const PATCH_KEY = "bolomj360:profile-patch:v1";
const DAY_MS = 86_400_000;

const readJson = <T,>(key: string): T | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

const writeJson = (key: string, value: unknown) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // Private-mode quota errors must never break a lesson.
  }
};

const dayKey = (offset = 0) =>
  new Date(Date.now() + offset * DAY_MS).toISOString().slice(0, 10);

const createLocalProfile = (): LearnerProfile => ({
  _id: "local",
  displayName: "Сурагч",
  grade: 5,
  avatar: "🦊",
  carLevel: 0,
  coins: 0,
  xp: 0,
  streak: 0,
  lastActiveOn: null,
  createdAt: new Date().toISOString(),
  totals: { attempts: 0, correct: 0, accuracy: 0, topicsCompleted: 0 },
  topics: [],
  recentAttempts: [],
});

const applyAttempt = (
  profile: LearnerProfile,
  input: AttemptInput,
): LearnerProfile => {
  const now = new Date().toISOString();
  const today = dayKey();
  const yesterday = dayKey(-1);
  const coinsEarned = input.correct
    ? input.difficulty === "easy"
      ? 1
      : input.difficulty === "impossible"
        ? 3
        : 2
    : 0;
  const xpEarned = input.correct ? 10 : 2;
  const streak =
    profile.lastActiveOn === today
      ? Math.max(profile.streak, 1)
      : profile.lastActiveOn === yesterday
        ? profile.streak + 1
        : 1;

  const existing = profile.topics.find(
    (topic) =>
      topic.grade === input.grade &&
      topic.subject === input.subject &&
      topic.topicId === input.topicId,
  );

  const topics = existing
    ? profile.topics.map((topic) =>
        topic.grade === input.grade &&
        topic.subject === input.subject &&
        topic.topicId === input.topicId
          ? {
              ...topic,
              attempts: topic.attempts + 1,
              correct: topic.correct + (input.correct ? 1 : 0),
              lastAttemptAt: now,
            }
          : topic,
      )
    : [
        {
          grade: input.grade,
          subject: input.subject,
          topicId: input.topicId,
          topicTitle: input.topicTitle,
          attempts: 1,
          correct: input.correct ? 1 : 0,
          lastAttemptAt: now,
        },
        ...profile.topics,
      ];

  const attempts = profile.totals.attempts + 1;
  const correct = profile.totals.correct + (input.correct ? 1 : 0);

  return {
    ...profile,
    coins: profile.coins + coinsEarned,
    xp: profile.xp + xpEarned,
    streak,
    lastActiveOn: today,
    totals: {
      attempts,
      correct,
      accuracy: Math.round((correct / attempts) * 100),
      topicsCompleted: topics.filter((topic) => topic.correct >= TOPIC_TARGET)
        .length,
    },
    topics,
    recentAttempts: [
      {
        _id: `local-${Date.now()}`,
        grade: input.grade,
        subject: input.subject,
        topicId: input.topicId,
        topicTitle: input.topicTitle,
        correct: input.correct,
        createdAt: now,
      },
      ...profile.recentAttempts,
    ].slice(0, 8),
  };
};

const applyPatch = (
  profile: LearnerProfile,
  patch: ProfileInput,
): LearnerProfile => ({
  ...profile,
  ...(patch.displayName ? { displayName: patch.displayName } : {}),
  ...(patch.grade ? { grade: patch.grade } : {}),
  ...(patch.avatar ? { avatar: patch.avatar } : {}),
});

const mergePatch = (
  current: ProfileInput | null,
  next: ProfileInput,
): ProfileInput => {
  const base: ProfileInput = current ?? {};

  return {
    ...base,
    ...(next.displayName ? { displayName: next.displayName } : {}),
    ...(next.grade ? { grade: next.grade } : {}),
    ...(next.avatar ? { avatar: next.avatar } : {}),
  };
};
const isNetworkFailure = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "networkError" in error &&
  Boolean((error as { networkError?: unknown }).networkError);

interface LearnerContextValue {
  profile: LearnerProfile | null;
  loading: boolean;
  error: ApolloError | undefined;
  mode: LearnerMode;
  online: boolean;
  pending: number;
  recordAttempt: (
    input: AttemptInput,
  ) => Promise<{ coinsEarned: number; xpEarned: number }>;
  updateProfile: (input: ProfileInput) => Promise<void>;
  upgradeCar: () => Promise<number>;
  refetch: () => void;
}

const LearnerContext = createContext<LearnerContextValue | null>(null);

export const LearnerProvider = ({ children }: { children: ReactNode }) => {
  const { data, loading, error, refetch } = useQuery(PROFILE_QUERY, {
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
  });

  const [localProfile, setLocalProfile] = useState<LearnerProfile | null>(() =>
    readJson<LearnerProfile>(CACHE_KEY),
  );
  const [online, setOnline] = useState(
    () => typeof navigator === "undefined" || navigator.onLine,
  );
  const [pending, setPending] = useState(
    () =>
      (readJson<AttemptInput[]>(ATTEMPT_QUEUE_KEY)?.length ?? 0) +
      (readJson<number[]>(CAR_QUEUE_KEY)?.length ?? 0),
  );

  const [recordAttemptMutation] = useMutation(RECORD_ATTEMPT_MUTATION);
  const [upgradeCarMutation] = useMutation(UPGRADE_CAR_MUTATION);
  const [updateProfileMutation] = useMutation(UPDATE_PROFILE_MUTATION);

  const remote = data?.bolomj360Profile ?? null;

  const isNetworkProblem = !!error && isNetworkFailure(error);
  const permissionDenied = !!error && !isNetworkProblem;
  const mode: LearnerMode = !online
    ? "offline"
    : !error
      ? "live"
      : isNetworkProblem
        ? "offline"
        : "local";
  const canSync = online && !permissionDenied;

  const fallbackProfile = useMemo(
    () =>
      localProfile ?? remote ?? (mode !== "live" ? createLocalProfile() : null),
    [localProfile, remote, mode],
  );
  const profile = fallbackProfile;

  useEffect(() => {
    if (remote) {
      setLocalProfile(remote);
      writeJson(CACHE_KEY, remote);
    }
  }, [remote]);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const profileRef = useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const recordAttempt = useCallback(
    async (input: AttemptInput) => {
      if (canSync) {
        try {
          const result = await recordAttemptMutation({ variables: { input } });
          const payload = result.data?.bolomj360RecordAttempt;

          if (payload) {
            return {
              coinsEarned: payload.coinsEarned,
              xpEarned: payload.xpEarned,
            };
          }
        } catch (mutationError) {
          if (!isNetworkFailure(mutationError)) {
            throw mutationError;
          }
        }
      }

      const next = applyAttempt(
        profileRef.current ?? createLocalProfile(),
        input,
      );
      setLocalProfile(next);
      writeJson(CACHE_KEY, next);

      const queue = readJson<AttemptInput[]>(ATTEMPT_QUEUE_KEY) ?? [];
      queue.push(input);
      writeJson(ATTEMPT_QUEUE_KEY, queue);
      setPending(
        queue.length + (readJson<number[]>(CAR_QUEUE_KEY)?.length ?? 0),
      );

      return {
        coinsEarned: input.correct
          ? input.difficulty === "easy"
            ? 1
            : input.difficulty === "impossible"
              ? 3
              : 2
          : 0,
        xpEarned: input.correct ? 10 : 2,
      };
    },
    [canSync, recordAttemptMutation],
  );

  const updateProfile = useCallback(
    async (input: ProfileInput) => {
      if (canSync) {
        try {
          const result = await updateProfileMutation({ variables: { input } });
          const payload = result.data?.bolomj360UpdateProfile;

          if (payload) {
            setLocalProfile(payload);
            writeJson(CACHE_KEY, payload);
            return;
          }
        } catch (mutationError) {
          if (!isNetworkFailure(mutationError)) {
            throw mutationError;
          }
        }
      }

      const next = applyPatch(
        profileRef.current ?? createLocalProfile(),
        input,
      );
      setLocalProfile(next);
      writeJson(CACHE_KEY, next);
      writeJson(
        PATCH_KEY,
        mergePatch(readJson<ProfileInput>(PATCH_KEY), input),
      );
    },
    [canSync, updateProfileMutation],
  );

  const upgradeCar = useCallback(async () => {
    const current = profileRef.current ?? createLocalProfile();
    const currentLevel = current.carLevel ?? 0;
    const coinCost = [15, 30, 60][currentLevel];

    if (coinCost === undefined) {
      throw new Error("Машин дээд түвшинд хүрсэн байна.");
    }

    if (current.coins < coinCost) {
      throw new Error("Машин сайжруулах зоос хүрэлцэхгүй байна.");
    }

    if (canSync) {
      try {
        const result = await upgradeCarMutation({
          variables: { expectedLevel: currentLevel },
        });
        const payload = result.data?.bolomj360UpgradeCar;

        if (payload) {
          setLocalProfile(payload.profile);
          writeJson(CACHE_KEY, payload.profile);
          return payload.coinsSpent;
        }

        throw new Error("Машины шинэчлэлийн хариу ирсэнгүй.");
      } catch (mutationError) {
        if (!isNetworkFailure(mutationError)) {
          throw mutationError;
        }
      }
    }

    const next = {
      ...current,
      coins: current.coins - coinCost,
      carLevel: currentLevel + 1,
    };
    setLocalProfile(next);
    writeJson(CACHE_KEY, next);
    const queue = readJson<number[]>(CAR_QUEUE_KEY) ?? [];
    queue.push(currentLevel);
    writeJson(CAR_QUEUE_KEY, queue);
    setPending(
      (readJson<AttemptInput[]>(ATTEMPT_QUEUE_KEY)?.length ?? 0) + queue.length,
    );

    return coinCost;
  }, [canSync, upgradeCarMutation]);

  const flushQueue = useCallback(async () => {
    let queue = readJson<AttemptInput[]>(ATTEMPT_QUEUE_KEY) ?? [];
    let flushed = false;

    while (queue.length > 0) {
      const [next, ...rest] = queue;

      if (!next) {
        break;
      }

      try {
        await recordAttemptMutation({ variables: { input: next } });
      } catch {
        break;
      }

      queue = rest;
      writeJson(ATTEMPT_QUEUE_KEY, queue);
      setPending(
        queue.length + (readJson<number[]>(CAR_QUEUE_KEY)?.length ?? 0),
      );
      flushed = true;
    }

    let carQueue = readJson<number[]>(CAR_QUEUE_KEY) ?? [];

    while (carQueue.length > 0) {
      const [expectedLevel, ...rest] = carQueue;

      if (expectedLevel === undefined) {
        break;
      }

      try {
        await upgradeCarMutation({ variables: { expectedLevel } });
      } catch {
        break;
      }

      carQueue = rest;
      writeJson(CAR_QUEUE_KEY, carQueue);
      setPending(queue.length + carQueue.length);
      flushed = true;
    }

    const patch = readJson<ProfileInput>(PATCH_KEY);

    if (patch) {
      try {
        await updateProfileMutation({ variables: { input: patch } });
        writeJson(PATCH_KEY, null);
        flushed = true;
      } catch {
        // Keep the patch for the next online window.
      }
    }

    if (flushed) {
      await refetch();
    }
  }, [recordAttemptMutation, upgradeCarMutation, updateProfileMutation, refetch]);

  useEffect(() => {
    if (canSync) {
      void flushQueue();
    }
  }, [canSync, flushQueue]);

  const value = useMemo<LearnerContextValue>(
    () => ({
      profile,
      loading: loading && !profile,
      error,
      mode,
      online,
      pending,
      recordAttempt,
      updateProfile,
      upgradeCar,
      refetch: () => {
        void refetch();
      },
    }),
    [
      profile,
      loading,
      error,
      mode,
      online,
      pending,
      recordAttempt,
      updateProfile,
      upgradeCar,
      refetch,
    ],
  );

  return (
    <LearnerContext.Provider value={value}>{children}</LearnerContext.Provider>
  );
};

export const useLearner = () => {
  const context = useContext(LearnerContext);

  if (!context) {
    throw new Error("useLearner must be used inside LearnerProvider");
  }

  return context;
};
