export interface Question {
  prompt: string;
  answer: number;
}

export type GameDifficulty = "easy" | "hard" | "impossible";

export type Subject = "Математик" | "Физик" | "Хими";

export interface Topic {
  id: string;
  grade: number;
  subject: Subject;
  title: string;
  generate: () => Question;
}

export interface GradeBand {
  id: string;
  label: string;
  short: string;
  icon: string;
  from: number;
  to: number;
}

export const TOPIC_TARGET = 5;

export const GRADE_BANDS: GradeBand[] = [
  { id: "primary", label: "Бага анги", short: "1–5", icon: "🌱", from: 1, to: 5 },
  { id: "middle", label: "Дунд анги", short: "6–9", icon: "📘", from: 6, to: 9 },
  { id: "high", label: "Ахлах анги", short: "10–12", icon: "🎓", from: 10, to: 12 },
];

export const SUBJECT_META: Record<Subject, { icon: string; tint: string }> = {
  Математик: { icon: "➗", tint: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  Физик: { icon: "⚛️", tint: "bg-violet-500/15 text-violet-700 dark:text-violet-300" },
  Хими: { icon: "🧪", tint: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
};

const R = (min: number, max: number) =>
  min + Math.floor(Math.random() * (max - min + 1));

const pick = <T,>(items: readonly T[]): T => items[R(0, items.length - 1)] as T;

const addition = (): Question => {
  const a = R(1, 9);
  const b = R(1, 10 - a);
  return { prompt: `${a} + ${b} = ?`, answer: a + b };
};

const subtraction = (): Question => {
  const a = R(2, 10);
  const b = R(1, a);
  return { prompt: `${a} − ${b} = ?`, answer: a - b };
};

const addToHundred = (): Question => {
  const a = R(10, 60);
  const b = R(10, 39);
  return { prompt: `${a} + ${b} = ?`, answer: a + b };
};

const subtractToHundred = (): Question => {
  const a = R(30, 99);
  const b = R(10, 29);
  return { prompt: `${a} − ${b} = ?`, answer: a - b };
};

const multiplication = (): Question => {
  const a = R(2, 9);
  const b = R(2, 9);
  return { prompt: `${a} × ${b} = ?`, answer: a * b };
};

const multiplicationStory = (): Question => {
  const a = R(2, 9);
  const b = R(2, 9);
  return {
    prompt: `Нэг хайрцагт ${a} харандаа байна. ${b} хайрцагт нийт хэдэн харандаа байх вэ?`,
    answer: a * b,
  };
};

const division = (): Question => {
  const b = R(3, 9);
  const q = R(11, 25);
  return { prompt: `${b * q} ÷ ${b} = ?`, answer: q };
};

const twoDigitMultiplication = (): Question => {
  const a = R(11, 30);
  const b = R(2, 9);
  return { prompt: `${a} × ${b} = ?`, answer: a * b };
};

const decimals = (): Question => {
  const x = R(11, 99);
  const y = R(11, 99);
  return { prompt: `${x / 10} + ${y / 10} = ?`, answer: (x + y) / 10 };
};

const percent = (): Question => {
  const p = pick([10, 20, 25, 50]);
  const n = R(2, 10) * 20;
  return { prompt: `${n}-ийн ${p}% хэд вэ?`, answer: (n * p) / 100 };
};

const linearEquation = (): Question => {
  const x = R(2, 9);
  const a = R(2, 6);
  const b = R(1, 15);
  return { prompt: `${a}x + ${b} = ${a * x + b} бол x = ?`, answer: x };
};

const pythagoras = (): Question => {
  const triples = [
    [3, 4, 5],
    [5, 12, 13],
    [8, 15, 17],
    [6, 8, 10],
  ] as const;
  const [a, b, c] = pick(triples);

  if (Math.random() < 0.5) {
    return {
      prompt: `Тэгш өнцөгт гурвалжны катетууд ${a}, ${b} бол гипотенуз хэд вэ?`,
      answer: c,
    };
  }

  return { prompt: `√${a * a} = ?`, answer: a };
};

const quadratic = (): Question => {
  const r = R(1, 6);
  const s = R(1, 6);
  return {
    prompt: `x² − ${r + s}x + ${r * s} = 0 тэгшитгэлийн их язгуур хэд вэ?`,
    answer: Math.max(r, s),
  };
};

const arithmeticProgression = (): Question => {
  const a = R(1, 9);
  const d = R(2, 5);
  const n = R(6, 15);
  return {
    prompt: `Арифметик прогрессийн эхний гишүүн ${a}, ялгавар ${d}. ${n}-р гишүүнийг ол.`,
    answer: a + (n - 1) * d,
  };
};

const derivative = (): Question => {
  const a = R(1, 5);
  const b = R(1, 9);
  const c = R(1, 6);
  return {
    prompt: `f(x) = ${a}x² + ${b}x бол f′(${c}) = ?`,
    answer: 2 * a * c + b,
  };
};

const combinatorics = (): Question => {
  const n = R(5, 15);

  if (Math.random() < 0.5) {
    return {
      prompt: `${n} хүнээс 2 хүн сонгох боломжийн тоо хэд вэ?`,
      answer: (n * (n - 1)) / 2,
    };
  }

  return {
    prompt: `2x функцийн 0-ээс ${n} хүртэлх интеграл = ?`,
    answer: n * n,
  };
};

const exponential = (): Question => {
  const a = R(2, 5);
  const n = R(2, 4);
  return { prompt: `${a}^${n} = ?`, answer: a ** n };
};

const probability = (): Question => {
  const total = pick([4, 5, 10, 20, 25]);
  const red = R(1, total - 1);
  return {
    prompt: `${red} улаан, ${total - red} цэнхэр бөмбөлөгтэй уутнаас 1 бөмбөлөг сугалахад улаан гарах магадлал хэдэн хувь вэ?`,
    answer: (red * 100) / total,
  };
};

const logarithms = (): Question => {
  const base = R(2, 5);
  const n = R(2, 4);
  return { prompt: `log_${base}(${base ** n}) = ?`, answer: n };
};

const perimeterArea = (): Question => {
  const a = R(2, 12);
  const b = R(2, 12);

  if (Math.random() < 0.5) {
    return {
      prompt: `Тэгш өнцөгтийн урт ${a} м, өргөн ${b} м бол талбай хэд м² вэ?`,
      answer: a * b,
    };
  }

  return {
    prompt: `Тэгш өнцөгтийн урт ${a} м, өргөн ${b} м бол периметр хэд м вэ?`,
    answer: 2 * (a + b),
  };
};

const negativeNumbers = (): Question => {
  const a = R(1, 9);
  const b = R(1, 9);
  return { prompt: `${a} − ${a + b} = ?`, answer: -b };
};

const expressionValue = (): Question => {
  const a = R(2, 6);
  const b = R(1, 9);
  const x = R(2, 8);
  return {
    prompt: `${a}x + ${b} илэрхийллийн утгыг x = ${x} үед ол.`,
    answer: a * x + b,
  };
};

const linearFunction = (): Question => {
  const k = R(2, 6);
  const b = R(1, 9);
  const x = R(2, 8);
  return { prompt: `f(x) = ${k}x + ${b} бол f(${x}) = ?`, answer: k * x + b };
};

const geometricProgression = (): Question => {
  const b = R(1, 4);
  const q = R(2, 3);
  const n = R(3, 6);
  return {
    prompt: `Геометр прогрессийн эхний гишүүн ${b}, хуваарь ${q}. ${n}-р гишүүнийг ол.`,
    answer: b * q ** (n - 1),
  };
};

const physicsSpeed = (): Question => {
  const v = R(2, 12) * 5;
  const t = R(2, 6);
  return {
    prompt: `Машин ${v} км/ц хурдтай ${t} цаг явбал хэдэн км зам туулах вэ?`,
    answer: v * t,
  };
};

const physicsForce = (): Question => {
  const m = R(2, 10);
  const a = R(2, 9);
  return {
    prompt: `${m} кг биед ${a} м/с² хурдатгал өгөх хүч хэд Н вэ?`,
    answer: m * a,
  };
};

const physicsDensity = (): Question => {
  const d = R(2, 9);
  const v = R(2, 10);
  return {
    prompt: `Нягт ${d} г/см³, эзлэхүүн ${v} см³ биеийн масс хэдэн грамм вэ?`,
    answer: d * v,
  };
};

const physicsWork = (): Question => {
  const f = R(2, 20);
  const s = R(2, 15);
  return { prompt: `${f} Н хүчээр ${s} м замд ажил хийвэл хэдэн Ж вэ?`, answer: f * s };
};

const ohmsLaw = (): Question => {
  const r = R(2, 10);
  const i = R(2, 6);
  return {
    prompt: `Эсэргүүцэл ${r} Ом, гүйдэл ${i} А бол хүчдэл хэд В вэ?`,
    answer: r * i,
  };
};

const molarMass = (): Question => {
  const compounds = [
    ["H₂O", 18],
    ["CO₂", 44],
    ["NH₃", 17],
    ["CH₄", 16],
    ["O₂", 32],
    ["NaOH", 40],
  ] as const;
  const [formula, mass] = pick(compounds);
  return {
    prompt: `${formula}-ийн молийн масс хэд г/моль вэ? (H=1, C=12, N=14, O=16, Na=23)`,
    answer: mass,
  };
};

const solutionPercent = (): Question => {
  const total = pick([20, 25, 50, 100]);
  const salt = R(1, total / 5);
  return {
    prompt: `${salt} г давсыг ${total - salt} г усанд уусгав. Уусмалын хувь концентраци хэд вэ?`,
    answer: (salt * 100) / total,
  };
};

const byGrade: Record<number, () => Question> = {
  1: addition,
  2: addToHundred,
  3: multiplication,
  4: division,
  5: decimals,
  6: percent,
  7: linearEquation,
  8: pythagoras,
  9: quadratic,
  10: arithmeticProgression,
  11: derivative,
  12: combinatorics,
};

export const questionForGrade = (grade: number): Question => {
  const generator = byGrade[grade] ?? byGrade[6];

  return generator ? generator() : percent();
};

const GAME_DIFFICULTY_GRADES: Record<GameDifficulty, readonly number[]> = {
  easy: [1, 2, 3, 4, 5],
  hard: [6, 7, 8, 9],
  impossible: [10, 11, 12],
};

export const questionForDifficulty = (
  difficulty: GameDifficulty,
): Question & { grade: number } => {
  const grades = GAME_DIFFICULTY_GRADES[difficulty];
  const grade = grades[R(0, grades.length - 1)] ?? 5;

  return { ...questionForGrade(grade), grade };
};

export const TOPICS: Topic[] = [
  { id: "math-1-add", grade: 1, subject: "Математик", title: "Нэмэх (10 дотор)", generate: addition },
  { id: "math-1-sub", grade: 1, subject: "Математик", title: "Хасах (10 дотор)", generate: subtraction },
  { id: "math-2-add", grade: 2, subject: "Математик", title: "100 дотор нэмэх", generate: addToHundred },
  { id: "math-2-sub", grade: 2, subject: "Математик", title: "100 дотор хасах", generate: subtractToHundred },
  { id: "math-3-mul", grade: 3, subject: "Математик", title: "Үржвэрийн хүснэгт", generate: multiplication },
  { id: "math-3-story", grade: 3, subject: "Математик", title: "Үржих угтай бодлого", generate: multiplicationStory },
  { id: "math-4-div", grade: 4, subject: "Математик", title: "Хуваах", generate: division },
  { id: "math-4-mul", grade: 4, subject: "Математик", title: "Хоёр оронтой тоо үржих", generate: twoDigitMultiplication },
  { id: "math-5-dec", grade: 5, subject: "Математик", title: "Аравны бутархай", generate: decimals },
  { id: "math-5-geo", grade: 5, subject: "Математик", title: "Периметр, талбай", generate: perimeterArea },
  { id: "math-6-pct", grade: 6, subject: "Математик", title: "Хувь", generate: percent },
  { id: "math-6-neg", grade: 6, subject: "Математик", title: "Сөрөг тоо", generate: negativeNumbers },
  { id: "math-7-eq", grade: 7, subject: "Математик", title: "Тэгшитгэл", generate: linearEquation },
  { id: "math-7-expr", grade: 7, subject: "Математик", title: "Илэрхийллийн утга", generate: expressionValue },
  { id: "math-8-pyth", grade: 8, subject: "Математик", title: "Пифагор, язгуур", generate: pythagoras },
  { id: "math-8-exp", grade: 8, subject: "Математик", title: "Зэрэг", generate: exponential },
  { id: "math-9-quad", grade: 9, subject: "Математик", title: "Квадрат тэгшитгэл", generate: quadratic },
  { id: "math-9-fn", grade: 9, subject: "Математик", title: "Шугаман функц", generate: linearFunction },
  { id: "math-10-prog", grade: 10, subject: "Математик", title: "Арифметик прогресс", generate: arithmeticProgression },
  { id: "math-10-log", grade: 10, subject: "Математик", title: "Логарифм", generate: logarithms },
  { id: "math-11-deriv", grade: 11, subject: "Математик", title: "Уламжлал", generate: derivative },
  { id: "math-11-geo", grade: 11, subject: "Математик", title: "Геометр прогресс", generate: geometricProgression },
  { id: "math-12-comb", grade: 12, subject: "Математик", title: "Комбинаторик, интеграл", generate: combinatorics },
  { id: "math-12-prob", grade: 12, subject: "Математик", title: "Магадлал", generate: probability },
  { id: "phys-6-speed", grade: 6, subject: "Физик", title: "Хурд, зам, цаг", generate: physicsSpeed },
  { id: "phys-7-force", grade: 7, subject: "Физик", title: "Хүч (F = m·a)", generate: physicsForce },
  { id: "phys-8-density", grade: 8, subject: "Физик", title: "Нягт (m = ρ·V)", generate: physicsDensity },
  { id: "phys-9-work", grade: 9, subject: "Физик", title: "Ажил (A = F·s)", generate: physicsWork },
  { id: "phys-10-ohm", grade: 10, subject: "Физик", title: "Ом-ын хууль (U = I·R)", generate: ohmsLaw },
  { id: "chem-8-molar", grade: 8, subject: "Хими", title: "Молийн масс", generate: molarMass },
  { id: "chem-9-solution", grade: 9, subject: "Хими", title: "Уусмалын хувь", generate: solutionPercent },
];

export const topicsForGrade = (grade: number) =>
  TOPICS.filter((topic) => topic.grade === grade);

export const topicsFor = (grade: number, subject: Subject) =>
  TOPICS.filter((topic) => topic.grade === grade && topic.subject === subject);

export const subjectsForGrade = (grade: number) => {
  const subjects = new Map<Subject, number>();

  topicsForGrade(grade).forEach((topic) => {
    subjects.set(topic.subject, (subjects.get(topic.subject) ?? 0) + 1);
  });

  return Array.from(subjects.entries()).map(([subject, count]) => ({
    subject,
    count,
    ...SUBJECT_META[subject],
  }));
};

export const gradeBand = (grade: number) =>
  GRADE_BANDS.find((band) => grade >= band.from && grade <= band.to) ??
  GRADE_BANDS[0]!;

export const isSubject = (value: string | undefined): value is Subject =>
  value === "Математик" || value === "Физик" || value === "Хими";

export const isAnswerCorrect = (given: number, expected: number) =>
  Math.abs(given - expected) < 1e-6;
