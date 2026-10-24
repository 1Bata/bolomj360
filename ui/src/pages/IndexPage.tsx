import { useQuery } from "@apollo/client";
import {
  IconArrowRight,
  IconBolt,
  IconBook,
  IconHeartHandshake,
  IconHome,
  IconSchool,
  IconTargetArrow,
} from "@tabler/icons-react";
import { Button, Card, Input, cn } from "erxes-ui";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import manifest from "../../../erxes.json" with { type: "json" };
import {
  GRADE_BANDS,
  TOPIC_TARGET,
  gradeBand,
  isAnswerCorrect,
  questionForGrade,
  topicsForGrade,
} from "~/modules/curriculum/curriculum";
import {
  type LearnerProfile,
  useLearner,
} from "~/modules/learner/LearnerProvider";
import { LEADERBOARD_QUERY } from "~/modules/learner/operations";
import {
  AppPage,
  AvatarBadge,
  LoadingState,
  ProgressBar,
  StatTile,
  SyncBanner,
} from "~/modules/ui/AppPage";

const { path } = manifest.ui;

const clampGrade = (grade: number) => Math.min(12, Math.max(1, grade));

const DailyChallenge = ({ profile }: { profile: LearnerProfile }) => {
  const { recordAttempt } = useLearner();
  const [question, setQuestion] = useState(() =>
    questionForGrade(profile.grade),
  );
  const [value, setValue] = useState("");
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [earned, setEarned] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQuestion(questionForGrade(profile.grade));
    setValue("");
    setAnswered(false);
    setError(null);
  }, [profile.grade]);

  const next = () => {
    setQuestion(questionForGrade(profile.grade));
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
    setSaving(true);
    setError(null);

    try {
      const result = await recordAttempt({
        grade: profile.grade,
        subject: "Математик",
        topicId: "daily",
        topicTitle: "Өдрийн бодлого",
        correct: ok,
      });
      setEarned(result.coinsEarned);
    } catch {
      setError("Хариултыг хадгалж чадсангүй. Дахин оролдоно уу.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bolomj:overflow-hidden">
      <Card.Header>
        <div className="bolomj:flex bolomj:items-center bolomj:justify-between bolomj:gap-3">
          <div>
            <Card.Title className="bolomj:flex bolomj:items-center bolomj:gap-2">
              <IconBolt className="bolomj:size-4 bolomj:text-warning" />
              Өдрийн бодлого
            </Card.Title>
            <Card.Description>
              {profile.grade}-р анги · зөв хариулт бүр зоос, XP нэмнэ
            </Card.Description>
          </div>
          <span className="bolomj:rounded-full bolomj:bg-muted bolomj:px-2.5 bolomj:py-1 bolomj:text-xs bolomj:font-medium">
            {gradeBand(profile.grade).icon} {gradeBand(profile.grade).label}
          </span>
        </div>
      </Card.Header>
      <Card.Content className="bolomj:flex bolomj:flex-col bolomj:gap-4">
        <p className="bolomj:text-lg bolomj:font-medium">{question.prompt}</p>
        <div className="bolomj:flex bolomj:flex-col bolomj:gap-2 bolomj:sm:flex-row">
          <Input
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
            className="bolomj:sm:max-w-48"
          />
          {answered ? (
            <Button onClick={next}>
              Дараагийн бодлого
              <IconArrowRight className="bolomj:size-4" />
            </Button>
          ) : (
            <Button onClick={() => void check()} disabled={saving || !value}>
              {saving ? "Хадгалж байна…" : "Шалгах"}
            </Button>
          )}
        </div>
        {answered ? (
          <div
            className={cn(
              "bolomj:rounded-lg bolomj:px-4 bolomj:py-3 bolomj:text-sm",
              correct
                ? "bolomj:bg-success/15 bolomj:text-success"
                : "bolomj:bg-destructive/10 bolomj:text-destructive",
            )}
            role="status"
          >
            {correct
              ? `✅ Зөв! +${earned} 🪙`
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

const LeaderboardPreview = () => {
  const { data, loading, error } = useQuery(LEADERBOARD_QUERY, {
    variables: { limit: 5 },
  });
  const leaders = data?.bolomj360Leaderboard ?? [];

  return (
    <Card>
      <Card.Header>
        <div className="bolomj:flex bolomj:items-center bolomj:justify-between bolomj:gap-2">
          <Card.Title className="bolomj:flex bolomj:items-center bolomj:gap-2">
            <IconTargetArrow className="bolomj:size-4 bolomj:text-primary" />
            Тэргүүлэгчид
          </Card.Title>
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/${path}/leaderboard`}>Бүгд</Link>
          </Button>
        </div>
      </Card.Header>
      <Card.Content>
        {loading ? (
          <LoadingState rows={2} />
        ) : error ? (
          <p className="bolomj:text-sm bolomj:text-muted-foreground">
            Тэргүүлэгчдийг ачаалж чадсангүй.
          </p>
        ) : leaders.length === 0 ? (
          <p className="bolomj:text-sm bolomj:text-muted-foreground">
            Эхний од болох боломж нээлттэй байна.
          </p>
        ) : (
          <ol className="bolomj:flex bolomj:flex-col bolomj:gap-3">
            {leaders.map((leader) => (
              <li
                key={`${leader.rank}-${leader.displayName}`}
                className="bolomj:flex bolomj:items-center bolomj:gap-3"
              >
                <span className="bolomj:w-5 bolomj:text-sm bolomj:font-semibold bolomj:text-muted-foreground">
                  {leader.rank}
                </span>
                <AvatarBadge avatar={leader.avatar} size="sm" />
                <span className="bolomj:min-w-0 bolomj:flex-1 bolomj:truncate bolomj:text-sm bolomj:font-medium">
                  {leader.displayName}
                </span>
                <span className="bolomj:text-xs bolomj:text-muted-foreground">
                  {leader.grade}-р анги
                </span>
                <span className="bolomj:text-sm bolomj:font-semibold">
                  {leader.xp} XP
                </span>
              </li>
            ))}
          </ol>
        )}
      </Card.Content>
    </Card>
  );
};

const RecentAttempts = ({ profile }: { profile: LearnerProfile }) => (
  <Card>
    <Card.Header>
      <Card.Title className="bolomj:flex bolomj:items-center bolomj:gap-2">
        <IconBook className="bolomj:size-4" />
        Сүүлийн хариултууд
      </Card.Title>
    </Card.Header>
    <Card.Content>
      {profile.recentAttempts.length === 0 ? (
        <p className="bolomj:text-sm bolomj:text-muted-foreground">
          Эхний бодлогоо бодож эхлээрэй.
        </p>
      ) : (
        <ul className="bolomj:flex bolomj:flex-col bolomj:gap-3">
          {profile.recentAttempts.map((attempt) => (
            <li
              key={attempt._id}
              className="bolomj:flex bolomj:items-center bolomj:gap-3 bolomj:text-sm"
            >
              <span aria-hidden>{attempt.correct ? "✅" : "❌"}</span>
              <span className="bolomj:min-w-0 bolomj:flex-1">
                <span className="bolomj:block bolomj:truncate bolomj:font-medium">
                  {attempt.topicTitle}
                </span>
                <span className="bolomj:block bolomj:text-xs bolomj:text-muted-foreground">
                  {attempt.subject} · {attempt.grade}-р анги
                </span>
              </span>
              <time
                className="bolomj:text-xs bolomj:text-muted-foreground"
                dateTime={attempt.createdAt}
              >
                {new Date(attempt.createdAt).toLocaleDateString()}
              </time>
            </li>
          ))}
        </ul>
      )}
    </Card.Content>
  </Card>
);

export const IndexPage = () => {
  const { profile, loading, error, refetch } = useLearner();

  if (loading) {
    return (
      <AppPage icon={IconHome} title={manifest.title}>
        <LoadingState rows={4} />
      </AppPage>
    );
  }

  if (!profile) {
    return (
      <AppPage icon={IconHome} title={manifest.title}>
        <Card className="bolomj:p-6" role="alert">
          <p className="bolomj:font-medium">Профайл ачаалж чадсангүй</p>
          <p className="bolomj:mt-1 bolomj:text-sm bolomj:text-muted-foreground">
            {error?.message ?? "Дахин оролдоно уу."}
          </p>
          <Button className="bolomj:mt-4" onClick={refetch}>
            Дахин оролдох
          </Button>
        </Card>
      </AppPage>
    );
  }

  const grade = clampGrade(profile.grade);
  const band = gradeBand(grade);
  const gradeTopics = topicsForGrade(grade);
  const completed = profile.topics.filter(
    (topic) => topic.grade === grade && topic.correct >= TOPIC_TARGET,
  ).length;
  const progress =
    gradeTopics.length > 0 ? (completed / gradeTopics.length) * 100 : 0;

  return (
    <AppPage
      icon={IconHome}
      title={manifest.title}
      subtitle="Мэдлэг бол хүүхэд бүрийн далавч."
      actions={
        <Button variant="outline" asChild>
          <Link to={`/${path}/learn`}>
            <IconSchool />
            Хичээлүүд
          </Link>
        </Button>
      }
    >
      <SyncBanner />

      <Card className="bolomj:relative bolomj:overflow-hidden bolomj:border-0 bolomj:bg-gradient-to-br bolomj:from-primary/15 bolomj:via-background bolomj:to-accent/40">
        <div className="bolomj:flex bolomj:flex-col bolomj:gap-6 bolomj:p-5 bolomj:sm:p-7 bolomj:md:flex-row bolomj:md:items-center bolomj:md:justify-between">
          <div className="bolomj:flex bolomj:items-start bolomj:gap-4">
            <AvatarBadge avatar={profile.avatar} size="lg" />
            <div className="bolomj:flex bolomj:flex-col bolomj:gap-1">
              <p className="bolomj:text-sm bolomj:text-muted-foreground">
                Сайн уу,
              </p>
              <h1 className="bolomj:text-2xl bolomj:font-semibold bolomj:tracking-tight">
                {profile.displayName}
              </h1>
              <p className="bolomj:text-sm bolomj:text-muted-foreground">
                {band.icon} {band.label} · {grade}-р анги
              </p>
              <div className="bolomj:mt-2 bolomj:flex bolomj:flex-wrap bolomj:gap-2 bolomj:text-xs">
                <span className="bolomj:rounded-full bolomj:bg-background bolomj:px-2.5 bolomj:py-1 bolomj:font-medium bolomj:shadow-xs">
                  🔥 {profile.streak} өдөр
                </span>
                <span className="bolomj:rounded-full bolomj:bg-background bolomj:px-2.5 bolomj:py-1 bolomj:font-medium bolomj:shadow-xs">
                  🪙 {profile.coins}
                </span>
                <span className="bolomj:rounded-full bolomj:bg-background bolomj:px-2.5 bolomj:py-1 bolomj:font-medium bolomj:shadow-xs">
                  ⭐ {profile.xp} XP
                </span>
              </div>
            </div>
          </div>
          <div className="bolomj:flex bolomj:w-full bolomj:flex-col bolomj:gap-2 bolomj:sm:flex-row bolomj:md:w-auto">
            <Button asChild>
              <Link to={`/${path}/learn/${grade}`}>
                Үргэлжлүүлэх
                <IconArrowRight />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/${path}/play`}>
                <IconBolt />
                Тоглох
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      <div className="bolomj:grid bolomj:grid-cols-2 bolomj:gap-3 bolomj:lg:grid-cols-4">
        <StatTile
          icon="🔥"
          label="Цуваа"
          value={`${profile.streak} өдөр`}
          hint="Өдөр бүр нэг бодлого"
        />
        <StatTile
          icon="🪙"
          label="Зоос"
          value={profile.coins}
          hint={`${profile.totals.attempts} хариулт`}
        />
        <StatTile
          icon="⭐"
          label="XP"
          value={profile.xp}
          hint={`${profile.totals.topicsCompleted} сэдэв дууссан`}
        />
        <StatTile
          icon="🎯"
          label="Нарийвчлал"
          value={`${profile.totals.accuracy}%`}
          hint={`${profile.totals.correct} зөв`}
        />
      </div>

      <div className="bolomj:grid bolomj:gap-5 bolomj:lg:grid-cols-3">
        <div className="bolomj:flex bolomj:flex-col bolomj:gap-5 bolomj:lg:col-span-2">
          <Card>
            <Card.Header>
              <div className="bolomj:flex bolomj:items-center bolomj:justify-between bolomj:gap-3">
                <div>
                  <Card.Title className="bolomj:flex bolomj:items-center bolomj:gap-2">
                    <IconSchool className="bolomj:size-4 bolomj:text-primary" />
                    {grade}-р ангийн ахиц
                  </Card.Title>
                  <Card.Description>
                    {completed}/{gradeTopics.length} сэдэв дууссан ·{" "}
                    {band.short}
                  </Card.Description>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/${path}/learn/${grade}`}>Нээх</Link>
                </Button>
              </div>
            </Card.Header>
            <Card.Content className="bolomj:flex bolomj:flex-col bolomj:gap-4">
              <ProgressBar value={progress} />
              <div className="bolomj:flex bolomj:flex-wrap bolomj:gap-2">
                {GRADE_BANDS.map((item) => (
                  <span
                    key={item.id}
                    className={cn(
                      "bolomj:rounded-full bolomj:px-2.5 bolomj:py-1 bolomj:text-xs",
                      item.id === band.id
                        ? "bolomj:bg-primary bolomj:text-primary-foreground"
                        : "bolomj:bg-muted bolomj:text-muted-foreground",
                    )}
                  >
                    {item.icon} {item.label}
                  </span>
                ))}
              </div>
            </Card.Content>
          </Card>

          <DailyChallenge profile={profile} />
          <RecentAttempts profile={profile} />
        </div>

        <div className="bolomj:flex bolomj:flex-col bolomj:gap-5">
          <LeaderboardPreview />
          <Card className="bolomj:bg-accent/30">
            <Card.Header>
              <Card.Title className="bolomj:flex bolomj:items-center bolomj:gap-2">
                <IconHeartHandshake className="bolomj:size-4" />
                Бидний тухай
              </Card.Title>
            </Card.Header>
            <Card.Content className="bolomj:flex bolomj:flex-col bolomj:gap-3">
              <p className="bolomj:text-sm bolomj:text-muted-foreground">
                Орон нутагт сүлжээ муутай, сурах боломж хомс хүүхдүүдэд
                мэдлэгийг хүргэж, ирээдүйн хаалгыг нээх хөтөлбөр.
              </p>
              <p className="bolomj:text-sm bolomj:italic bolomj:text-muted-foreground">
                “Мэдлэг хуваалцах тусам багасдаггүй, харин өснө.”
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/${path}/community`}>
                  <IconHeartHandshake />
                  Хамтдаа хийцгээе
                </Link>
              </Button>
            </Card.Content>
          </Card>
        </div>
      </div>
    </AppPage>
  );
};
