import { useQuery } from "@apollo/client";
import {
  IconArrowLeft,
  IconTrophy,
} from "@tabler/icons-react";
import { Button, Card } from "erxes-ui";
import { Link } from "react-router";
import manifest from "../../../erxes.json" with { type: "json" };
import { LEADERBOARD_QUERY } from "~/modules/learner/operations";
import {
  AppPage,
  AvatarBadge,
  ErrorState,
  LoadingState,
} from "~/modules/ui/AppPage";

const { path } = manifest.ui;

const MEDALS = ["🥇", "🥈", "🥉"];

export const LeaderboardPage = () => {
  const { data, loading, error, refetch } = useQuery(LEADERBOARD_QUERY, {
    variables: { limit: 20 },
  });
  const leaders = data?.bolomj360Leaderboard ?? [];
  const podium = leaders.slice(0, 3);
  const rest = leaders.slice(3);

  return (
    <AppPage
      icon={IconTrophy}
      title="Тэргүүлэгчид"
      subtitle="XP ихтэй сурагчид. Зөв хариулт бүр таныг дээшлүүлнэ."
      actions={
        <Button variant="outline" asChild>
          <Link to={`/${path}/play`}>
            <IconArrowLeft />
            Тоглох
          </Link>
        </Button>
      }
    >
      {loading ? (
        <LoadingState rows={4} />
      ) : error ? (
        <ErrorState
          message="Тэргүүлэгчдийн самбарыг ачаалж чадсангүй."
          onRetry={() => refetch()}
        />
      ) : leaders.length === 0 ? (
        <Card className="bolomj:p-6">
          <p className="bolomj:font-medium">Одоогоор хэн ч бүртгэгдээгүй.</p>
          <p className="bolomj:mt-1 bolomj:text-sm bolomj:text-muted-foreground">
            Эхний бодлогоо бодож тэргүүлэгч болоорой.
          </p>
          <Button className="bolomj:mt-4" asChild>
            <Link to={`/${path}/learn`}>Хичээл эхлэх</Link>
          </Button>
        </Card>
      ) : (
        <>
          <div className="bolomj:grid bolomj:gap-3 bolomj:sm:grid-cols-3">
            {podium.map((leader, index) => (
              <Card
                key={`${leader.rank}-${leader.displayName}`}
                className={
                  index === 0
                    ? "bolomj:border-warning/50 bolomj:bg-warning/10"
                    : undefined
                }
              >
                <Card.Content className="bolomj:flex bolomj:flex-col bolomj:items-center bolomj:gap-2 bolomj:py-5 bolomj:text-center">
                  <span aria-hidden className="bolomj:text-3xl">
                    {MEDALS[index]}
                  </span>
                  <AvatarBadge avatar={leader.avatar} size="lg" />
                  <p className="bolomj:font-semibold">{leader.displayName}</p>
                  <p className="bolomj:text-xs bolomj:text-muted-foreground">
                    {leader.grade}-р анги · 🔥 {leader.streak}
                  </p>
                  <p className="bolomj:text-lg bolomj:font-semibold">
                    {leader.xp} XP
                  </p>
                </Card.Content>
              </Card>
            ))}
          </div>

          {rest.length > 0 ? (
            <Card>
              <Card.Header>
                <Card.Title>Бусад сурагчид</Card.Title>
              </Card.Header>
              <Card.Content>
                <ol className="bolomj:flex bolomj:flex-col bolomj:divide-y bolomj:divide-border">
                  {rest.map((leader) => (
                    <li
                      key={`${leader.rank}-${leader.displayName}`}
                      className="bolomj:flex bolomj:items-center bolomj:gap-3 bolomj:py-3"
                    >
                      <span className="bolomj:w-6 bolomj:text-sm bolomj:font-semibold bolomj:text-muted-foreground">
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
              </Card.Content>
            </Card>
          ) : null}
        </>
      )}
    </AppPage>
  );
};
