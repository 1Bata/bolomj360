import {
  IconArrowLeft,
  IconArrowRight,
  IconDeviceGamepad2,
  IconFlame,
  IconFlag,
  IconRefresh,
} from "@tabler/icons-react";
import { Button, Card, Input, cn } from "erxes-ui";
import { useState } from "react";
import {
  isAnswerCorrect,
  questionForDifficulty,
  type GameDifficulty,
} from "~/modules/curriculum/curriculum";
import { useLearner } from "~/modules/learner/LearnerProvider";
import {
  AppPage,
  LoadingState,
  ProgressBar,
  SyncBanner,
} from "~/modules/ui/AppPage";

type GameMode = "race" | "streak";

const RACE_QUESTIONS = 10;
const CAR_MODELS = ["🚗", "🚙", "🏎️", "🚀"] as const;
const CAR_UPGRADE_COSTS = [15, 30, 60] as const;
const DIFFICULTIES: {
  id: GameDifficulty;
  title: string;
  reward: number;
  description: string;
}[] = [
  {
    id: "easy",
    title: "Хялбар",
    reward: 1,
    description: "1–5-р ангийн бодлого",
  },
  {
    id: "hard",
    title: "Хэцүү",
    reward: 2,
    description: "6–9-р ангийн бодлого",
  },
  {
    id: "impossible",
    title: "Боломжгүй",
    reward: 3,
    description: "10–12-р ангийн бодлого",
  },
];

const GameRunner = ({
  mode,
  difficulty,
  onExit,
}: {
  mode: GameMode;
  difficulty: GameDifficulty;
  onExit: () => void;
}) => {
  const { profile, recordAttempt } = useLearner();
  const [question, setQuestion] = useState(() =>
    questionForDifficulty(difficulty),
  );
  const [value, setValue] = useState("");
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [stats, setStats] = useState({ asked: 0, correct: 0, coins: 0 });

  const askNext = () => {
    setQuestion(questionForDifficulty(difficulty));
    setValue("");
    setAnswered(false);
    setError(null);
  };

  const restart = () => {
    setStats({ asked: 0, correct: 0, coins: 0 });
    setFinished(false);
    askNext();
  };

  const check = async () => {
    const parsed = Number.parseFloat(value.replace(",", "."));

    if (Number.isNaN(parsed)) {
      setError("Хариугаа тоогоор бичнэ үү.");
      return;
    }

    const ok = isAnswerCorrect(parsed, question.answer);
    setCorrect(ok);
    setAnswered(true);
    setError(null);
    setSaving(true);
    setStats((current) => ({
      asked: current.asked + 1,
      correct: current.correct + (ok ? 1 : 0),
      coins: current.coins,
    }));

    try {
      const result = await recordAttempt({
        grade: question.grade,
        subject: "Тоглоом",
        topicId: `game-${mode}-${difficulty}`,
        topicTitle:
          `${mode === "race" ? "Хурдны уралдаан" : "Зөв хариултын цуваа"} · ${difficulty}`,
        correct: ok,
        difficulty,
      });
      setStats((current) => ({
        ...current,
        coins: current.coins + result.coinsEarned,
      }));
    } catch {
      setError("Хариултыг серверт хадгалж чадсангүй.");
    } finally {
      setSaving(false);
    }
  };

  const advance = () => {
    if (mode === "streak" && !correct) {
      setFinished(true);
      return;
    }

    if (mode === "race" && stats.asked >= RACE_QUESTIONS) {
      setFinished(true);
      return;
    }

    askNext();
  };

  const progress =
    mode === "race"
      ? Math.min(100, (stats.correct / RACE_QUESTIONS) * 100)
      : Math.min(100, (stats.correct / 10) * 100);

  if (finished) {
    const accuracy =
      stats.asked > 0 ? Math.round((stats.correct / stats.asked) * 100) : 0;

    return (
      <Card className="bolomj:overflow-hidden">
        <Card.Content className="bolomj:flex bolomj:flex-col bolomj:items-center bolomj:gap-4 bolomj:p-6 bolomj:text-center">
          <span aria-hidden className="bolomj:text-5xl">
            {accuracy >= 80 ? "🏆" : accuracy >= 50 ? "🎉" : "💪"}
          </span>
          <div>
            <h2 className="bolomj:text-xl bolomj:font-semibold">
              {mode === "race" ? "Уралдаан дууслаа" : "Цуваа дууслаа"}
            </h2>
            <p className="bolomj:mt-1 bolomj:text-sm bolomj:text-muted-foreground">
              {stats.correct}/{stats.asked} зөв · {accuracy}% нарийвчлал
            </p>
          </div>
          <p className="bolomj:text-lg bolomj:font-semibold">
            🪙 +{stats.coins} зоос
          </p>
          <div className="bolomj:flex bolomj:w-full bolomj:flex-col bolomj:gap-2 bolomj:sm:flex-row bolomj:sm:justify-center">
            <Button onClick={restart}>
              <IconRefresh />
              Дахин тоглох
            </Button>
            <Button variant="outline" onClick={onExit}>
              <IconArrowLeft />
              Тоглоомууд
            </Button>
          </div>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card className="bolomj:overflow-hidden">
      <Card.Header>
        <div className="bolomj:flex bolomj:flex-wrap bolomj:items-center bolomj:justify-between bolomj:gap-3">
          <div>
            <Button variant="ghost" size="sm" onClick={onExit}>
              <IconArrowLeft />
              Гарах
            </Button>
            <Card.Title className="bolomj:mt-2">
              {mode === "race" ? "🏁 Хурдны уралдаан" : "🔥 Зөв хариултын цуваа"}
            </Card.Title>
            <Card.Description>
              {DIFFICULTIES.find((item) => item.id === difficulty)?.title} түвшин
              · зөв хариулт бүр{" "}
              {DIFFICULTIES.find((item) => item.id === difficulty)?.reward} 🪙
              {mode === "race"
                ? ` · ${RACE_QUESTIONS} асуулт`
                : " · алдвал тоглоом дуусна"}
            </Card.Description>
          </div>
          <div className="bolomj:flex bolomj:gap-2 bolomj:text-sm">
            <span className="bolomj:rounded-full bolomj:bg-muted bolomj:px-3 bolomj:py-1 bolomj:font-medium">
              ✅ {stats.correct}
            </span>
            <span className="bolomj:rounded-full bolomj:bg-muted bolomj:px-3 bolomj:py-1 bolomj:font-medium">
              🪙 +{stats.coins}
            </span>
          </div>
        </div>
      </Card.Header>
      <Card.Content className="bolomj:flex bolomj:flex-col bolomj:gap-4">
        <div
          className="bolomj:relative bolomj:h-16 bolomj:overflow-hidden bolomj:rounded-xl bolomj:bg-slate-500"
          role="img"
          aria-label={`Замын ахиц ${Math.round(progress)}%`}
        >
          <div className="bolomj:absolute bolomj:inset-x-0 bolomj:top-1/2 bolomj:border-t-2 bolomj:border-dashed bolomj:border-amber-300" />
          <span
            className="bolomj:absolute bolomj:top-3 bolomj:text-3xl bolomj:transition-all bolomj:duration-500"
            style={{ left: `calc(${Math.min(92, progress)}% - 12px)` }}
          >
            {CAR_MODELS[Math.min(profile?.carLevel ?? 0, CAR_MODELS.length - 1)]}
          </span>
          <span className="bolomj:absolute bolomj:right-3 bolomj:top-3 bolomj:text-2xl">
            🏁
          </span>
        </div>
        <ProgressBar value={progress} />

        <p className="bolomj:text-xl bolomj:font-medium">{question.prompt}</p>

        <div className="bolomj:flex bolomj:flex-col bolomj:gap-2 bolomj:sm:flex-row">
          <Input
            autoFocus
            type="number"
            inputMode="decimal"
            placeholder="Хариугаа бич"
            value={value}
            disabled={answered}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !answered) {
                void check();
              }
            }}
            className="bolomj:sm:max-w-56"
          />
          {answered ? (
            <Button onClick={advance} disabled={saving}>
              {mode === "streak" && !correct
                ? "Дүнг харах"
                : mode === "race" && stats.asked >= RACE_QUESTIONS
                  ? "Дуусгах"
                  : "Дараагийн"}
              <IconArrowRight />
            </Button>
          ) : (
            <Button onClick={() => void check()} disabled={saving || !value}>
              {saving ? "Хадгалж байна…" : "Хариулах"}
            </Button>
          )}
        </div>

        {answered ? (
          <div
            role="status"
            className={cn(
              "bolomj:rounded-lg bolomj:px-4 bolomj:py-3 bolomj:text-sm",
              correct
                ? "bolomj:bg-success/15 bolomj:text-success"
                : "bolomj:bg-destructive/10 bolomj:text-destructive",
            )}
          >
            {correct
              ? `✅ Зөв! +${DIFFICULTIES.find((item) => item.id === difficulty)?.reward} 🪙`
              : `❌ Буруу. Зөв хариу: ${question.answer}`}
          </div>
        ) : null}

        {error ? (
          <p className="bolomj:text-sm bolomj:text-destructive">{error}</p>
        ) : null}
      </Card.Content>
    </Card>
  );
};

const MODES: {
  id: GameMode;
  title: string;
  description: string;
  icon: typeof IconFlag;
  tint: string;
}[] = [
  {
    id: "race",
    title: "Хурдны уралдаан",
    description: "10 асуултад хариулж машинаа барианд хүргэ. Зөв бүр зоос.",
    icon: IconFlag,
    tint: "bolomj:bg-blue-500/15 bolomj:text-blue-600",
  },
  {
    id: "streak",
    title: "Зөв хариултын цуваа",
    description: "Алдаагүй хэр хол явах вэ? Цуваа урт байх тусам сонирхолтой.",
    icon: IconFlame,
    tint: "bolomj:bg-orange-500/15 bolomj:text-orange-600",
  },
];

export const PlayPage = () => {
  const { profile, loading, upgradeCar } = useLearner();
  const [mode, setMode] = useState<GameMode | null>(null);
  const [difficulty, setDifficulty] = useState<GameDifficulty>("easy");
  const [upgrading, setUpgrading] = useState(false);
  const [garageMessage, setGarageMessage] = useState<string | null>(null);

  if (loading) {
    return (
      <AppPage icon={IconDeviceGamepad2} title="Тоглоом">
        <LoadingState rows={3} />
      </AppPage>
    );
  }

  if (!profile) {
    return (
      <AppPage icon={IconDeviceGamepad2} title="Тоглоом">
        <Card className="bolomj:p-6">
          <p className="bolomj:font-medium">Профайл олдсонгүй</p>
          <p className="bolomj:mt-1 bolomj:text-sm bolomj:text-muted-foreground">
            Нэвтэрч, дахин оролдоно уу.
          </p>
        </Card>
      </AppPage>
    );
  }

  return (
    <AppPage
      icon={IconDeviceGamepad2}
      title="treasure_fund_mn"
      subtitle="Машинаа уралдуулж, бодлого бодон зоос цуглуул. Утас болон компьютерт тохируулсан."
      breadcrumb={mode ? [mode === "race" ? "Уралдаан" : "Цуваа"] : []}
      className="bolomj-game-surface"
      actions={
        <div className="bolomj:flex bolomj:items-center bolomj:gap-2 bolomj:text-sm">
          <span className="bolomj:rounded-full bolomj:bg-muted bolomj:px-3 bolomj:py-1 bolomj:font-medium">
            🪙 {profile.coins}
          </span>
        </div>
      }
    >
      <SyncBanner />

      {mode ? (
        <GameRunner
          mode={mode}
          difficulty={difficulty}
          onExit={() => setMode(null)}
        />
      ) : (
        <>
          <Card>
            <Card.Header>
              <Card.Title>Түвшнээ сонго</Card.Title>
              <Card.Description>
                Зөв хариулсан бодлого бүрээр зоос авна.
              </Card.Description>
            </Card.Header>
            <Card.Content className="bolomj:grid bolomj:gap-3 bolomj:sm:grid-cols-3">
              {DIFFICULTIES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={difficulty === item.id}
                  onClick={() => setDifficulty(item.id)}
                  className={cn(
                    "bolomj:flex bolomj:flex-col bolomj:gap-1 bolomj:rounded-xl bolomj:border bolomj:p-4 bolomj:text-left bolomj:transition-colors",
                    difficulty === item.id
                      ? "bolomj:border-primary bolomj:bg-primary/10"
                      : "bolomj:border-border bolomj:bg-background hover:bolomj:bg-accent/40",
                  )}
                >
                  <span className="bolomj:font-semibold">
                    {item.title} · {item.reward} 🪙
                  </span>
                  <span className="bolomj:text-sm bolomj:text-muted-foreground">
                    {item.description}
                  </span>
                </button>
              ))}
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>Тоглоомоо сонго</Card.Title>
              <Card.Description>
                Хялбар түвшин 1, хэцүү 2, боломжгүй 3 зоос өгнө.
              </Card.Description>
            </Card.Header>
            <Card.Content className="bolomj:grid bolomj:gap-3 bolomj:md:grid-cols-2">
              {MODES.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMode(item.id)}
                    className="bolomj:flex bolomj:flex-col bolomj:gap-4 bolomj:rounded-xl bolomj:border bolomj:border-border bolomj:bg-background bolomj:p-5 bolomj:text-left bolomj:transition-colors hover:bolomj:bg-accent/40"
                  >
                    <span
                      className={cn(
                        "bolomj:grid bolomj:size-12 bolomj:place-items-center bolomj:rounded-xl",
                        item.tint,
                      )}
                    >
                      <Icon className="bolomj:size-6" />
                    </span>
                    <span>
                      <span className="bolomj:block bolomj:text-lg bolomj:font-semibold">
                        {item.title}
                      </span>
                      <span className="bolomj:mt-1 bolomj:block bolomj:text-sm bolomj:text-muted-foreground">
                        {item.description}
                      </span>
                    </span>
                    <span className="bolomj:flex bolomj:items-center bolomj:gap-1 bolomj:text-sm bolomj:font-medium bolomj:text-primary">
                      Эхлэх
                      <IconArrowRight className="bolomj:size-4" />
                    </span>
                  </button>
                );
              })}
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>Машины гарааш</Card.Title>
              <Card.Description>
                Зоосоор машинаа шинэчил. Шинэ машин уралдаанд харагдана.
              </Card.Description>
            </Card.Header>
            <Card.Content className="bolomj:flex bolomj:flex-wrap bolomj:items-center bolomj:gap-4">
              <span
                aria-label={`Машины ${profile.carLevel ?? 0}-р түвшин`}
                className="bolomj:text-5xl"
              >
                {CAR_MODELS[Math.min(profile.carLevel ?? 0, CAR_MODELS.length - 1)]}
              </span>
              <div className="bolomj:min-w-48 bolomj:flex-1">
                <p className="bolomj:font-medium">
                  Машины түвшин {profile.carLevel ?? 0}/3
                </p>
                <p className="bolomj:text-sm bolomj:text-muted-foreground">
                  {profile.carLevel === 3
                    ? "Дээд түвшинд хүрлээ!"
                    : `Дараагийн шинэчлэл · ${CAR_UPGRADE_COSTS[Math.min(profile.carLevel ?? 0, 2)]} 🪙`}
                </p>
              </div>
              <Button
                disabled={upgrading || (profile.carLevel ?? 0) >= 3}
                onClick={() => {
                  setUpgrading(true);
                  setGarageMessage(null);
                  void upgradeCar()
                    .then((coinsSpent) => {
                      setGarageMessage(`Машин шинэчлэгдлээ! −${coinsSpent} 🪙`);
                    })
                    .catch((error: unknown) => {
                      setGarageMessage(
                        error instanceof Error
                          ? error.message
                          : "Машин шинэчилж чадсангүй.",
                      );
                    })
                    .finally(() => setUpgrading(false));
                }}
              >
                {upgrading ? "Шинэчилж байна…" : "Машинаа сайжруулах"}
              </Button>
              {garageMessage ? (
                <p role="status" className="bolomj:w-full bolomj:text-sm">
                  {garageMessage}
                </p>
              ) : null}
            </Card.Content>
          </Card>
        </>
      )}
    </AppPage>
  );
};
