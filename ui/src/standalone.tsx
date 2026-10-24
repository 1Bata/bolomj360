import { createRoot } from "react-dom/client";
import { useState } from "react";
import {
  isAnswerCorrect,
  questionForDifficulty,
  type GameDifficulty,
  type Question,
} from "~/modules/curriculum/curriculum";
import "./standalone.css";

const STORAGE_KEY = "treasure_fund_mn:standalone:v1";
const RACE_QUESTIONS = 10;
const CARS = ["🚗", "🚙", "🏎️", "🚀"] as const;
const UPGRADE_COSTS = [15, 30, 60] as const;

const LEVELS: {
  id: GameDifficulty;
  label: string;
  grades: string;
  reward: number;
}[] = [
  { id: "easy", label: "Хялбар", grades: "1–5-р анги", reward: 1 },
  { id: "hard", label: "Хэцүү", grades: "6–9-р анги", reward: 2 },
  { id: "impossible", label: "Боломжгүй", grades: "10–12-р анги", reward: 3 },
];

type GameMode = "race" | "streak";

interface SaveData {
  coins: number;
  carLevel: number;
  bestRace: number;
}

interface GameState {
  mode: GameMode;
  difficulty: GameDifficulty;
  question: Question & { grade: number };
  asked: number;
  correct: number;
  earned: number;
  answer: string;
  feedback: string;
  answered: boolean;
  finished: boolean;
}

const readSave = (): SaveData => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { coins: 0, carLevel: 0, bestRace: 0 };

    const value: unknown = JSON.parse(raw);
    if (
      typeof value === "object" &&
      value !== null &&
      "coins" in value &&
      typeof value.coins === "number" &&
      Number.isFinite(value.coins) &&
      "carLevel" in value &&
      typeof value.carLevel === "number" &&
      Number.isInteger(value.carLevel) &&
      "bestRace" in value &&
      typeof value.bestRace === "number" &&
      Number.isFinite(value.bestRace)
    ) {
      return {
        coins: Math.max(0, value.coins),
        carLevel: Math.min(3, Math.max(0, value.carLevel)),
        bestRace: Math.max(0, value.bestRace),
      };
    }
  } catch {
    return { coins: 0, carLevel: 0, bestRace: 0 };
  }

  return { coins: 0, carLevel: 0, bestRace: 0 };
};

const App = () => {
  const [save, setSave] = useState(readSave);
  const [difficulty, setDifficulty] = useState<GameDifficulty>("easy");
  const [game, setGame] = useState<GameState | null>(null);
  const [notice, setNotice] = useState("");

  const persist = (next: SaveData) => {
    setSave(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      setNotice("Хөтөч хадгалалтыг зөвшөөрсөнгүй. Энэ удаагийн тоглолт үргэлжилнэ.");
    }
  };

  const start = (mode: GameMode) => {
    setNotice("");
    setGame({
      mode,
      difficulty,
      question: questionForDifficulty(difficulty),
      asked: 0,
      correct: 0,
      earned: 0,
      answer: "",
      feedback: "",
      answered: false,
      finished: false,
    });
  };

  const checkAnswer = () => {
    if (!game || game.answered) return;
    const answer = Number.parseFloat(game.answer.trim().replace(",", "."));
    if (!Number.isFinite(answer)) {
      setGame({ ...game, feedback: "Хариугаа тоогоор бичнэ үү." });
      return;
    }

    const correct = isAnswerCorrect(answer, game.question.answer);
    const asked = game.asked + 1;
    const score = game.correct + (correct ? 1 : 0);
    const earned =
      game.earned +
      (correct ? (LEVELS.find((level) => level.id === game.difficulty)?.reward ?? 1) : 0);
    const finished =
      (game.mode === "race" && asked >= RACE_QUESTIONS) ||
      (game.mode === "streak" && !correct);

    setGame({
      ...game,
      asked,
      correct: score,
      earned,
      answered: true,
      finished,
      feedback: correct
        ? `Зөв! +${LEVELS.find((level) => level.id === game.difficulty)?.reward} 🪙`
        : `Зөв хариу: ${game.question.answer}`,
    });

    if (correct) {
      persist({ ...save, coins: save.coins + (earned - game.earned) });
    }
    if (finished && game.mode === "race") {
      setSave((current) => {
        const next = { ...current, bestRace: Math.max(current.bestRace, score) };
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          setNotice("Шилдэг оноог хадгалж чадсангүй.");
        }
        return next;
      });
    }
  };

  const nextQuestion = () => {
    if (!game) return;
    if (game.finished) {
      setGame(null);
      return;
    }
    setGame({
      ...game,
      question: questionForDifficulty(game.difficulty),
      answer: "",
      feedback: "",
      answered: false,
    });
  };

  const upgrade = () => {
    const cost = UPGRADE_COSTS[save.carLevel];
    if (cost === undefined) return;
    if (save.coins < cost) {
      setNotice(`Дараагийн машиныг авахад ${cost} зоос хэрэгтэй.`);
      return;
    }
    setNotice("Машин шинэчлэгдлээ! Уралдаанд шинэ машинаа туршаарай.");
    persist({ ...save, coins: save.coins - cost, carLevel: save.carLevel + 1 });
  };

  const progress = game ? Math.min(100, (game.correct / RACE_QUESTIONS) * 100) : 0;

  return (
    <main className="page">
      <header className="topbar">
        <a className="brand" href="/" aria-label="treasure_fund_mn нүүр">
          <span className="brand-icon">🏁</span>
          <span>treasure_fund_mn</span>
        </a>
        <div className="wallet" aria-live="polite">🪙 {save.coins} зоос</div>
      </header>

      <section className="hero">
        <p className="eyebrow">БОДЛОГО БОД · УРАЛДААНД ОР · ШАГНАЛ АВ</p>
        <h1>Мэдлэгээрээ машинаа түрүүлүүл!</h1>
        <p>Зөв хариулт бүр зоос болно. Зоосоороо машинаа шинэчлээд дахин уралдаарай.</p>
      </section>

      <section className="panel">
        <div className="section-title">
          <div><span className="step">01</span><h2>Түвшнээ сонго</h2></div>
          <span className="hint">Зөв хариулт бүрийн шагнал</span>
        </div>
        <div className="levels">
          {LEVELS.map((level) => (
            <button
              className={`level ${difficulty === level.id ? "selected" : ""}`}
              type="button"
              key={level.id}
              aria-pressed={difficulty === level.id}
              onClick={() => setDifficulty(level.id)}
            >
              <span className="level-top"><b>{level.label}</b><strong>+{level.reward} 🪙</strong></span>
              <span className="muted">{level.grades}</span>
            </button>
          ))}
        </div>
      </section>

      {!game ? (
        <>
          <section className="panel">
            <div className="section-title">
              <div><span className="step">02</span><h2>Уралдаанаа сонго</h2></div>
            </div>
            <div className="modes">
              <button className="mode-card race" type="button" onClick={() => start("race")}>
                <span className="mode-icon">🏎️</span>
                <span><b>Машины уралдаан</b><small>10 асуултад хариулж барианд ор.</small></span>
                <span className="arrow">→</span>
              </button>
              <button className="mode-card streak" type="button" onClick={() => start("streak")}>
                <span className="mode-icon">🔥</span>
                <span><b>Зөвийн цуваа</b><small>Алдах хүртлээ зөв хариулж үргэлжлүүл.</small></span>
                <span className="arrow">→</span>
              </button>
            </div>
          </section>

          <section className="panel garage">
            <div className="garage-car" aria-label={`Машины түвшин ${save.carLevel}`}>
              {CARS[save.carLevel]}
            </div>
            <div className="garage-copy">
              <span className="hint">ТАНЫ ГАРААШ</span>
              <h2>{save.carLevel === 3 ? "Дээд түвшний машин" : `Машины түвшин ${save.carLevel}/3`}</h2>
              <p className="muted">
                {save.carLevel === 3
                  ? `Шилдэг уралдаан: ${save.bestRace}/10 зөв`
                  : `Шинэчлэл: ${UPGRADE_COSTS[save.carLevel]} зоос · Шилдэг: ${save.bestRace}/10`}
              </p>
            </div>
            <button className="button upgrade" type="button" onClick={upgrade} disabled={save.carLevel >= 3}>
              {save.carLevel >= 3 ? "БҮРЭН ШИНЭЧИЛСЭН" : "МАШИНАА САЙЖРУУЛАХ"}
            </button>
          </section>
        </>
      ) : (
        <section className="panel game">
          <div className="game-heading">
            <div>
              <span className="hint">{game.mode === "race" ? "МАШИНЫ УРАЛДААН" : "ЗӨВИЙН ЦУВАА"} · {LEVELS.find((level) => level.id === game.difficulty)?.label}</span>
              <h2>{game.finished ? "Барианд орлоо!" : `Асуулт ${game.asked + (game.answered ? 0 : 1)}${game.mode === "race" ? ` / ${RACE_QUESTIONS}` : ""}`}</h2>
            </div>
            <button className="text-button" type="button" onClick={() => setGame(null)}>Гарах</button>
          </div>
          <div className="track" aria-label={`Замын ахиц ${Math.round(progress)}%`}>
            <div className="track-lines" />
            <span className="track-car" style={{ left: `calc(${Math.min(progress, 92)}% - 1rem)` }}>{CARS[save.carLevel]}</span>
            <span className="finish">🏁</span>
          </div>
          <div className="game-stats">
            <span>✅ {game.correct} зөв</span><span>🪙 +{game.earned}</span>
          </div>
          {!game.finished ? (
            <>
              <div className="question">{game.question.prompt}</div>
              <form
                className="answer-form"
                onSubmit={(event) => { event.preventDefault(); if (game.answered) nextQuestion(); else checkAnswer(); }}
              >
                <input
                  autoFocus
                  inputMode="decimal"
                  aria-label="Хариу"
                  placeholder="Хариугаа бич"
                  value={game.answer}
                  disabled={game.answered}
                  onChange={(event) => setGame({ ...game, answer: event.target.value, feedback: "" })}
                />
                <button className="button" type="submit" disabled={!game.answered && !game.answer.trim()}>
                  {game.answered ? "Дараагийн →" : "Шалгах"}
                </button>
              </form>
              {game.feedback ? <p className={`feedback ${game.feedback.startsWith("Зөв!") ? "good" : "bad"}`} role="status">{game.feedback}</p> : null}
            </>
          ) : (
            <div className="finished">
              <p>{game.correct}/{game.asked} зөв хариуллаа</p>
              <strong>+{game.earned} 🪙</strong>
              <button className="button" type="button" onClick={() => setGame(null)}>Тоглоом сонгох</button>
            </div>
          )}
        </section>
      )}

      {notice ? <p className="notice" role="status">{notice}</p> : null}
      <footer>treasure_fund_mn · Мэдлэгээ сорьж, машинаа шинэчил</footer>
    </main>
  );
};

const root = document.getElementById("root");
if (!root) throw new Error("Апп эхлүүлэх root элемент олдсонгүй.");
createRoot(root).render(<App />);
