import { useQuery } from "@apollo/client";
import {
  IconCheck,
  IconCloudOff,
  IconDeviceFloppy,
  IconSettings,
  IconSparkles,
} from "@tabler/icons-react";
import { Badge, Button, Card, Input, cn } from "erxes-ui";
import { useEffect, useState } from "react";
import manifest from "../../../erxes.json" with { type: "json" };
import { GRADE_BANDS, gradeBand } from "~/modules/curriculum/curriculum";
import { useLearner } from "~/modules/learner/LearnerProvider";
import { STATUS_QUERY } from "~/modules/learner/operations";
import {
  AppPage,
  AvatarBadge,
  LoadingState,
  SyncBanner,
} from "~/modules/ui/AppPage";

const AVATARS = ["🦊", "🐻", "🦄", "🚀", "🐼", "🦁", "🐯", "🐨", "🌟", "🎓"];

const MODE_LABEL = {
  live: "Серверт холбогдсон",
  offline: "Офлайн",
  local: "Локал горим",
} as const;

export const SettingsPage = () => {
  const { profile, mode, pending, loading, updateProfile, refetch } =
    useLearner();
  const { data: status } = useQuery(STATUS_QUERY);
  const [displayName, setDisplayName] = useState("");
  const [grade, setGrade] = useState(5);
  const [avatar, setAvatar] = useState("🦊");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setDisplayName(profile.displayName);
    setGrade(profile.grade);
    setAvatar(profile.avatar);
  }, [profile?._id, profile?.displayName, profile?.grade, profile?.avatar]);

  if (loading || !profile) {
    return (
      <AppPage icon={IconSettings} title="Тохиргоо">
        <LoadingState rows={3} />
      </AppPage>
    );
  }

  const dirty =
    displayName.trim() !== profile.displayName ||
    grade !== profile.grade ||
    avatar !== profile.avatar;

  const save = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      await updateProfile({ displayName: displayName.trim(), grade, avatar });
      setMessage(
        mode === "live"
          ? "Профайл хадгалагдлаа."
          : "Профайл төхөөрөмж дээр хадгалагдлаа.",
      );
    } catch {
      setError("Профайлыг хадгалж чадсангүй. Дахин оролдоно уу.");
    } finally {
      setSaving(false);
    }
  };

  const band = gradeBand(grade);

  return (
    <AppPage
      icon={IconSettings}
      title="Тохиргоо"
      subtitle="Профайл, анги, дүр төрхөө тохируул. Ахиц автоматаар хадгалагдана."
    >
      <SyncBanner />

      <div className="bolomj:grid bolomj:gap-5 bolomj:lg:grid-cols-3">
        <Card className="bolomj:lg:col-span-2">
          <Card.Header>
            <Card.Title className="bolomj:flex bolomj:items-center bolomj:gap-2">
              <IconSparkles className="bolomj:size-4" />
              Миний профайл
            </Card.Title>
            <Card.Description>
              Нэр, анги, дүр төрх нь тэргүүлэгчдийн самбарт харагдана.
            </Card.Description>
          </Card.Header>
          <Card.Content className="bolomj:flex bolomj:flex-col bolomj:gap-5">
            <div className="bolomj:flex bolomj:items-center bolomj:gap-4">
              <AvatarBadge avatar={avatar} size="lg" />
              <div>
                <p className="bolomj:text-sm bolomj:font-medium">
                  {band.icon} {band.label}
                </p>
                <p className="bolomj:text-xs bolomj:text-muted-foreground">
                  {grade}-р анги · {profile.xp} XP · 🪙 {profile.coins}
                </p>
              </div>
            </div>

            <label className="bolomj:flex bolomj:flex-col bolomj:gap-1.5">
              <span className="bolomj:text-sm bolomj:font-medium">Нэр</span>
              <Input
                value={displayName}
                maxLength={40}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </label>

            <div className="bolomj:flex bolomj:flex-col bolomj:gap-2">
              <span className="bolomj:text-sm bolomj:font-medium">Анги</span>
              <div className="bolomj:flex bolomj:flex-wrap bolomj:gap-1.5">
                {Array.from({ length: 12 }, (_, index) => index + 1).map(
                  (value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setGrade(value)}
                      aria-pressed={grade === value}
                      className={cn(
                        "bolomj:size-9 bolomj:rounded-full bolomj:text-sm bolomj:font-medium",
                        grade === value
                          ? "bolomj:bg-primary bolomj:text-primary-foreground"
                          : "bolomj:bg-muted bolomj:text-muted-foreground hover:bolomj:text-foreground",
                      )}
                    >
                      {value}
                    </button>
                  ),
                )}
              </div>
              <div className="bolomj:flex bolomj:flex-wrap bolomj:gap-2 bolomj:text-xs bolomj:text-muted-foreground">
                {GRADE_BANDS.map((item) => (
                  <span key={item.id}>
                    {item.icon} {item.label} ({item.short})
                  </span>
                ))}
              </div>
            </div>

            <div className="bolomj:flex bolomj:flex-col bolomj:gap-2">
              <span className="bolomj:text-sm bolomj:font-medium">Дүр төрх</span>
              <div className="bolomj:flex bolomj:flex-wrap bolomj:gap-2">
                {AVATARS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-label={`Дүр ${item}`}
                    aria-pressed={avatar === item}
                    onClick={() => setAvatar(item)}
                    className={cn(
                      "bolomj:grid bolomj:size-11 bolomj:place-items-center bolomj:rounded-full bolomj:text-2xl",
                      avatar === item
                        ? "bolomj:bg-primary/20 bolomj:ring-2 bolomj:ring-primary"
                        : "bolomj:bg-muted hover:bolomj:bg-accent",
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="bolomj:flex bolomj:flex-wrap bolomj:items-center bolomj:gap-3">
              <Button onClick={() => void save()} disabled={saving || !dirty}>
                <IconDeviceFloppy />
                {saving ? "Хадгалж байна…" : "Хадгалах"}
              </Button>
              {message ? (
                <p
                  role="status"
                  className="bolomj:flex bolomj:items-center bolomj:gap-1 bolomj:text-sm bolomj:text-success"
                >
                  <IconCheck className="bolomj:size-4" />
                  {message}
                </p>
              ) : null}
              {error ? (
                <p role="alert" className="bolomj:text-sm bolomj:text-destructive">
                  {error}
                </p>
              ) : null}
            </div>
          </Card.Content>
        </Card>

        <div className="bolomj:flex bolomj:flex-col bolomj:gap-5">
          <Card>
            <Card.Header>
              <Card.Title className="bolomj:flex bolomj:items-center bolomj:gap-2">
                {mode === "live" ? (
                  <IconCheck className="bolomj:size-4 bolomj:text-success" />
                ) : (
                  <IconCloudOff className="bolomj:size-4 bolomj:text-warning" />
                )}
                Холболт
              </Card.Title>
            </Card.Header>
            <Card.Content className="bolomj:flex bolomj:flex-col bolomj:gap-3 bolomj:text-sm">
              <div className="bolomj:flex bolomj:items-center bolomj:justify-between bolomj:gap-2">
                <span className="bolomj:text-muted-foreground">Төлөв</span>
                <Badge variant={mode === "live" ? "success" : "warning"}>
                  {MODE_LABEL[mode]}
                </Badge>
              </div>
              <div className="bolomj:flex bolomj:items-center bolomj:justify-between bolomj:gap-2">
                <span className="bolomj:text-muted-foreground">
                  Хүлээгдэж буй
                </span>
                <span className="bolomj:font-medium">{pending}</span>
              </div>
              <div className="bolomj:flex bolomj:items-center bolomj:justify-between bolomj:gap-2">
                <span className="bolomj:text-muted-foreground">Хэрэглэгч</span>
                <span className="bolomj:max-w-40 bolomj:truncate bolomj:font-medium">
                  {status?.bolomj360Status.userEmail ??
                    status?.bolomj360Status.userId ??
                    "—"}
                </span>
              </div>
              <div className="bolomj:flex bolomj:items-center bolomj:justify-between bolomj:gap-2">
                <span className="bolomj:text-muted-foreground">Сургууль</span>
                <span className="bolomj:max-w-40 bolomj:truncate bolomj:font-medium">
                  {status?.bolomj360Status.subdomain ?? "—"}
                </span>
              </div>
              <div className="bolomj:flex bolomj:items-center bolomj:justify-between bolomj:gap-2">
                <span className="bolomj:text-muted-foreground">Хувилбар</span>
                <span className="bolomj:font-medium">
                  v{manifest.version}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={refetch}>
                Шинэчлэх
              </Button>
            </Card.Content>
          </Card>

          <Card className="bolomj:bg-accent/20">
            <Card.Header>
              <Card.Title>Офлайн хадгалалт</Card.Title>
            </Card.Header>
            <Card.Content>
              <p className="bolomj:text-sm bolomj:text-muted-foreground">
                Сүлжээгүй үед хариулт, зоос, цуваа энэ төхөөрөмж дээр
                хадгалагдаж, сүлжээ ормогц серверт автоматаар синк хийнэ.
                Нэг төхөөрөмжөөр тогтмол суралцахыг зөвлөж байна.
              </p>
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>Плагин</Card.Title>
            </Card.Header>
            <Card.Content className="bolomj:flex bolomj:flex-col bolomj:gap-1 bolomj:text-xs bolomj:text-muted-foreground">
              <span>Нэр: {manifest.name}</span>
              <span>Замын зам: /{manifest.ui.path}</span>
              <span>
                API: :{manifest.api.port}
                {manifest.api.graphql}
              </span>
            </Card.Content>
          </Card>
        </div>
      </div>
    </AppPage>
  );
};
