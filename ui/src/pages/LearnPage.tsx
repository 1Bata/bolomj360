import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconChevronRight,
  IconSchool,
  IconTargetArrow,
} from "@tabler/icons-react";
import { Button, Card, Input, cn } from "erxes-ui";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import manifest from "../../../erxes.json" with { type: "json" };
import {
  GRADE_BANDS,
  TOPIC_TARGET,
  isAnswerCorrect,
  isSubject,
  subjectsForGrade,
  topicsFor,
  topicsForGrade,
  type Subject,
  type Topic,
} from "~/modules/curriculum/curriculum";
import { useLearner } from "~/modules/learner/LearnerProvider";
import {
  AppPage,
  LoadingState,
  ProgressBar,
  SyncBanner,
} from "~/modules/ui/AppPage";

const { path } = manifest.ui;

const gradeHref = (grade: number) => `/${path}/learn/${grade}`;
const subjectHref = (grade: number, subject: Subject) =>
  `/${path}/learn/${grade}/${encodeURIComponent(subject)}`;

const topicProgress = (
  topicId: string,
  profileTopics: { topicId: string; correct: number }[],
) => {
  const record = profileTopics.find((topic) => topic.topicId === topicId);

  return record?.correct ?? 0;
};

const GradePicker = ({
  grade,
  onSelect,
}: {
  grade: number;
  onSelect: (grade: number) => void;
}) => (
  <div className="bolomj:flex bolomj:flex-col bolomj:gap-2">
    <div className="bolomj:flex bolomj:gap-1 bolomj:overflow-x-auto bolomj:pb-1">
      {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onSelect(value)}
          aria-pressed={value === grade}
          className={cn(
            "bolomj:shrink-0 bolomj:rounded-full bolomj:px-3 bolomj:py-1.5 bolomj:text-sm bolomj:font-medium bolomj:transition-colors",
            value === grade
              ? "bolomj:bg-primary bolomj:text-primary-foreground"
              : "bolomj:bg-muted bolomj:text-muted-foreground hover:bolomj:text-foreground",
          )}
        >
          {value}
        </button>
      ))}
    </div>
    <div className="bolomj:flex bolomj:flex-wrap bolomj:gap-2 bolomj:text-xs bolomj:text-muted-foreground">
      {GRADE_BANDS.map((band) => (
        <span key={band.id}>
          {band.icon} {band.label} ({band.short})
        </span>
      ))}
    </div>
  </div>
);

const PracticePanel = ({
  topic,
  onClose,
}: {
  topic: Topic;
  onClose: () => void;
}) => {
  const { profile, recordAttempt } = useLearner();
  const [question, setQuestion] = useState(() => topic.generate());
  const [value, setValue] = useState("");
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [earned, setEarned] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState({ attempts: 0, correct: 0 });
  const [solved, setSolved] = useState(0);

  const previousCorrect =
    profile?.topics.find((item) => item.topicId === topic.id)?.correct ?? 0;
  const progress = Math.min(100, (previousCorrect / TOPIC_TARGET) * 100);

  useEffect(() => {
    setQuestion(topic.generate());
    setValue("");
    setAnswered(false);
    setError(null);
  }, [topic]);

  const next = () => {
    setQuestion(topic.generate());
    setValue("");
    setAnswered(false);
    setError(null);
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
    setSession((current) => ({
      attempts: current.attempts + 1,
      correct: current.correct + (ok ? 1 : 0),
    }));

    try {
      const result = await recordAttempt({
        grade: topic.grade,
        subject: topic.subject,
        topicId: topic.id,
        topicTitle: topic.title,
        correct: ok,
      });
      setEarned(result.coinsEarned);
      setSolved((current) => current + (ok ? 1 : 0));
    } catch {
      setError("Хариултыг хадгалж чадсангүй. Дахин оролдоно уу.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bolomj:overflow-hidden">
      <Card.Header>
        <div className="bolomj:flex bolomj:items-start bolomj:justify-between bolomj:gap-3">
          <div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <IconArrowLeft />
              Сэдвүүд
            </Button>
            <Card.Title className="bolomj:mt-2">{topic.title}</Card.Title>
            <Card.Description>
              {topic.subject} · {topic.grade}-р анги · {TOPIC_TARGET} зөв
              хариулбал дуусна
            </Card.Description>
          </div>
          <span className="bolomj:shrink-0 bolomj:rounded-full bolomj:bg-muted bolomj:px-3 bolomj:py-1 bolomj:text-sm bolomj:font-medium">
            ✅ {session.correct}/{session.attempts}
          </span>
        </div>
      </Card.Header>
      <Card.Content className="bolomj:flex bolomj:flex-col bolomj:gap-4">
        <div className="bolomj:flex bolomj:flex-col bolomj:gap-1">
          <div className="bolomj:flex bolomj:justify-between bolomj:text-xs bolomj:text-muted-foreground">
            <span>Сэдвийн ахиц</span>
            <span>{Math.min(TOPIC_TARGET, previousCorrect)}/{TOPIC_TARGET}</span>
          </div>
          <ProgressBar value={progress} />
        </div>

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
            <Button onClick={next}>
              Дараагийн
              <IconArrowRight />
            </Button>
          ) : (
            <Button onClick={() => void check()} disabled={saving || !value}>
              {saving ? "Хадгалж байна…" : "Шалгах"}
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
              ? `✅ Зөв! +${earned} 🪙`
              : `❌ Буруу. Зөв хариу: ${question.answer}`}
          </div>
        ) : null}

        {error ? (
          <p className="bolomj:text-sm bolomj:text-destructive">{error}</p>
        ) : null}

        {solved > 0 ? (
          <p className="bolomj:text-sm bolomj:text-muted-foreground">
            Энэ дасгалд {solved} зөв хариулт цуглууллаа.
          </p>
        ) : null}
      </Card.Content>
    </Card>
  );
};

export const LearnPage = () => {
  const params = useParams<{ grade?: string; subject?: string }>();
  const navigate = useNavigate();
  const { profile, loading, updateProfile } = useLearner();
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);

  if (loading) {
    return (
      <AppPage icon={IconSchool} title="Хичээл">
        <LoadingState rows={4} />
      </AppPage>
    );
  }

  if (!profile) {
    return (
      <AppPage icon={IconSchool} title="Хичээл">
        <Card className="bolomj:p-6">
          <p className="bolomj:font-medium">Профайл олдсонгүй</p>
          <p className="bolomj:mt-1 bolomj:text-sm bolomj:text-muted-foreground">
            Нэвтэрч, дахин оролдоно уу.
          </p>
        </Card>
      </AppPage>
    );
  }

  const requested = Number(params.grade);
  const grade =
    Number.isInteger(requested) && requested >= 1 && requested <= 12
      ? requested
      : profile.grade;
  const subject = isSubject(params.subject) ? params.subject : null;
  const gradeTopics = topicsForGrade(grade);
  const completed = profile.topics.filter(
    (topic) => topic.grade === grade && topic.correct >= TOPIC_TARGET,
  ).length;

  const selectGrade = (value: number) => {
    setActiveTopic(null);
    navigate(gradeHref(value));
  };

  const selectSubject = (value: Subject) => {
    setActiveTopic(null);
    navigate(subjectHref(grade, value));
  };

  return (
    <AppPage
      icon={IconSchool}
      title="Хичээл"
      subtitle="Ангиа сонгоод сэдвээр дасгал хий. Хариулт бүр зоос, XP болж хуримтлагдана."
      breadcrumb={[
        `${grade}-р анги`,
        ...(subject ? [subject] : []),
        ...(activeTopic ? [activeTopic.title] : []),
      ]}
      actions={
        <Button
          variant="outline"
          disabled={grade === profile.grade}
          onClick={() => {
            void updateProfile({ grade });
          }}
        >
          <IconCheck />
          {grade === profile.grade ? "Миний анги" : "Миний анги болгох"}
        </Button>
      }
    >
      <SyncBanner />

      <Card>
        <Card.Content className="bolomj:flex bolomj:flex-col bolomj:gap-4">
          <div className="bolomj:flex bolomj:flex-wrap bolomj:items-center bolomj:justify-between bolomj:gap-2 bolomj:text-sm">
            <span className="bolomj:font-medium">
              {grade}-р анги · {completed}/{gradeTopics.length} сэдэв дууссан
            </span>
            <Link
              to={gradeHref(grade)}
              className="bolomj:text-primary hover:bolomj:underline"
            >
              Сэдвүүд
            </Link>
          </div>
          <ProgressBar
            value={
              gradeTopics.length > 0
                ? (completed / gradeTopics.length) * 100
                : 0
            }
          />
          <GradePicker grade={grade} onSelect={selectGrade} />
        </Card.Content>
      </Card>

      {activeTopic ? (
        <PracticePanel
          topic={activeTopic}
          onClose={() => setActiveTopic(null)}
        />
      ) : subject ? (
        <div className="bolomj:flex bolomj:flex-col bolomj:gap-4">
          <div className="bolomj:flex bolomj:flex-wrap bolomj:items-center bolomj:gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to={gradeHref(grade)}>
                <IconArrowLeft />
                Хичээлүүд
              </Link>
            </Button>
            <h2 className="bolomj:text-lg bolomj:font-semibold">{subject}</h2>
          </div>
          <div className="bolomj:grid bolomj:gap-3 bolomj:md:grid-cols-2">
            {topicsFor(grade, subject).map((topic) => {
              const correct = topicProgress(topic.id, profile.topics);
              const pct = Math.min(100, (correct / TOPIC_TARGET) * 100);

              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => setActiveTopic(topic)}
                  className="bolomj:flex bolomj:flex-col bolomj:gap-3 bolomj:rounded-xl bolomj:border bolomj:border-border bolomj:bg-background bolomj:p-4 bolomj:text-left bolomj:transition-colors hover:bolomj:bg-accent/40"
                >
                  <div className="bolomj:flex bolomj:items-start bolomj:justify-between bolomj:gap-3">
                    <div>
                      <p className="bolomj:font-medium">{topic.title}</p>
                      <p className="bolomj:text-xs bolomj:text-muted-foreground">
                        {topic.grade}-р анги · {TOPIC_TARGET} зөв = дууссан
                      </p>
                    </div>
                    <IconChevronRight className="bolomj:size-5 bolomj:shrink-0 bolomj:text-muted-foreground" />
                  </div>
                  <ProgressBar value={pct} />
                  <span className="bolomj:text-xs bolomj:text-muted-foreground">
                    {Math.min(TOPIC_TARGET, correct)}/{TOPIC_TARGET} зөв
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bolomj:grid bolomj:gap-3 bolomj:sm:grid-cols-2 bolomj:lg:grid-cols-3">
          {subjectsForGrade(grade).map((item) => {
            const topics = topicsFor(grade, item.subject);
            const done = topics.filter(
              (topic) =>
                (profile.topics.find((entry) => entry.topicId === topic.id)
                  ?.correct ?? 0) >= TOPIC_TARGET,
            ).length;
            const pct = topics.length > 0 ? (done / topics.length) * 100 : 0;

            return (
              <button
                key={item.subject}
                type="button"
                onClick={() => selectSubject(item.subject)}
                className="bolomj:flex bolomj:flex-col bolomj:gap-3 bolomj:rounded-xl bolomj:border bolomj:border-border bolomj:bg-background bolomj:p-4 bolomj:text-left bolomj:transition-colors hover:bolomj:bg-accent/40"
              >
                <div className="bolomj:flex bolomj:items-center bolomj:justify-between">
                  <span
                    aria-hidden
                    className={cn(
                      "bolomj:grid bolomj:size-11 bolomj:place-items-center bolomj:rounded-xl bolomj:text-2xl",
                      item.tint,
                    )}
                  >
                    {item.icon}
                  </span>
                  <IconChevronRight className="bolomj:size-5 bolomj:text-muted-foreground" />
                </div>
                <div>
                  <p className="bolomj:text-base bolomj:font-semibold">
                    {item.subject}
                  </p>
                  <p className="bolomj:text-xs bolomj:text-muted-foreground">
                    {item.count} сэдэв · {done} дууссан
                  </p>
                </div>
                <ProgressBar value={pct} />
              </button>
            );
          })}
        </div>
      )}

      {!subject && !activeTopic ? (
        <Card className="bolomj:bg-accent/20">
          <Card.Content className="bolomj:flex bolomj:items-start bolomj:gap-3">
            <IconTargetArrow className="bolomj:mt-0.5 bolomj:size-5 bolomj:text-primary" />
            <p className="bolomj:text-sm bolomj:text-muted-foreground">
              Зөвлөмж: өдөрт 10–15 бодлого бодоход цуваа тасрахгүй, зоос
              хурдан өснө. Сэдэв бүрт {TOPIC_TARGET} зөв хариулт хангалттай.
            </p>
          </Card.Content>
        </Card>
      ) : null}
    </AppPage>
  );
};
