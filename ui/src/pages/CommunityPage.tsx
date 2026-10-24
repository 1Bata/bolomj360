import { useMutation, useQuery } from "@apollo/client";
import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconCheck,
  IconCoin,
  IconCopy,
  IconHeartHandshake,
  IconMapPin,
  IconPhone,
  IconSend,
  IconUsers,
} from "@tabler/icons-react";
import { Button, Card, Input, Textarea, cn } from "erxes-ui";
import { useEffect, useState } from "react";
import { useLearner } from "~/modules/learner/LearnerProvider";
import {
  STATS_QUERY,
  SUBMIT_MESSAGE_MUTATION,
} from "~/modules/learner/operations";
import {
  AppPage,
  LoadingState,
  SectionHeading,
  StatTile,
  SyncBanner,
} from "~/modules/ui/AppPage";

const ACCOUNT = "MN86 0050 0991 0648 0994";

const PROGRAMS = [
  {
    icon: "📻",
    title: "Сүлжээгүй хичээл",
    description:
      "Татаж аваад офлайн үзэх хичээл, радио болон бичлэгт суурилсан материал.",
  },
  {
    icon: "📚",
    title: "Номын сан, хэрэгсэл",
    description:
      "Сум, багийн төвд зөөврийн номын сан, цахим хэрэгсэл, сурах бичиг хүргэнэ.",
  },
  {
    icon: "🧑‍🏫",
    title: "Сайн дурын багш нар",
    description:
      "Хотод ажиллаж буй мэргэжилтнүүд сурагчидтай холбогдож, нэмэлт давтлага өгнө.",
  },
  {
    icon: "🎨",
    title: "Авьяас хөгжүүлэх дугуйлан",
    description:
      "Урлаг, шинжлэх ухаан, технологийн богино хугацааны зун, өвлийн хөтөлбөр.",
  },
];

const ContactForm = () => {
  const { profile } = useLearner();
  const [submit, { loading }] = useMutation(SUBMIT_MESSAGE_MUTATION);
  const [name, setName] = useState(profile?.displayName ?? "");
  const [contact, setContact] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.displayName) {
      setName((current) => current || profile.displayName);
    }
  }, [profile?.displayName]);

  const send = async () => {
    setMessage(null);

    if (name.trim().length < 2) {
      setStatus("error");
      setMessage("Нэрээ бүтэн бичнэ үү.");
      return;
    }

    if (contact.trim().length < 3) {
      setStatus("error");
      setMessage("Утас эсвэл имэйл хаягаа бичнэ үү.");
      return;
    }

    if (body.trim().length < 5) {
      setStatus("error");
      setMessage("Мессежээ жаахан дэлгэрэнгүй бичнэ үү.");
      return;
    }

    try {
      const result = await submit({
        variables: { input: { name, contact, body } },
      });

      if (result.data?.bolomj360SubmitMessage) {
        setStatus("sent");
        setMessage("Баярлалаа! Бид тантай удахгүй холбогдоно.");
        setBody("");
      } else {
        setStatus("error");
        setMessage("Мессежийг илгээж чадсангүй.");
      }
    } catch {
      setStatus("error");
      setMessage(
        "Мессежийг илгээж чадсангүй. Сүлжээгээ шалгаад дахин оролдоно уу.",
      );
    }
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title className="bolomj:flex bolomj:items-center bolomj:gap-2">
          <IconSend className="bolomj:size-4" />
          Санал, хамтын ажиллагаа
        </Card.Title>
        <Card.Description>
          Асуулт, сайн дурын санал, байгууллагын хамтын ажиллагаагаа бичээрэй.
        </Card.Description>
      </Card.Header>
      <Card.Content className="bolomj:flex bolomj:flex-col bolomj:gap-3">
        <div className="bolomj:grid bolomj:gap-3 bolomj:sm:grid-cols-2">
          <Input
            placeholder="Таны нэр"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Input
            placeholder="Утас эсвэл имэйл"
            value={contact}
            onChange={(event) => setContact(event.target.value)}
          />
        </div>
        <Textarea
          rows={4}
          placeholder="Мессеж…"
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
        <div className="bolomj:flex bolomj:flex-wrap bolomj:items-center bolomj:gap-3">
          <Button onClick={() => void send()} disabled={loading}>
            <IconSend />
            {loading ? "Илгээж байна…" : "Илгээх"}
          </Button>
          {message ? (
            <p
              role="status"
              className={cn(
                "bolomj:text-sm",
                status === "sent"
                  ? "bolomj:text-success"
                  : "bolomj:text-destructive",
              )}
            >
              {message}
            </p>
          ) : null}
        </div>
      </Card.Content>
    </Card>
  );
};

export const CommunityPage = () => {
  const { data, loading } = useQuery(STATS_QUERY);
  const stats = data?.bolomj360Stats;
  const [copied, setCopied] = useState(false);

  const copyAccount = async () => {
    try {
      await navigator.clipboard.writeText(ACCOUNT);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <AppPage
      icon={IconHeartHandshake}
      title="Нөлөө ба холбоо"
      subtitle="Бид үр дүнгээ нээлттэй хэмжиж, хандивлагч бүртээ мэдээлнэ."
      actions={
        <Button variant="outline" asChild>
          <a href="tel:99013073">
            <IconPhone />
            99013073
          </a>
        </Button>
      }
    >
      <SyncBanner />

      <div className="bolomj:grid bolomj:grid-cols-1 bolomj:gap-3 bolomj:sm:grid-cols-3">
        <StatTile
          icon="🧑‍🎓"
          label="Сурагчид"
          value={loading ? "…" : (stats?.learners ?? 0)}
          hint="Энэ сургуулийн бүртгэл"
        />
        <StatTile
          icon="✅"
          label="Хариулт"
          value={loading ? "…" : (stats?.attempts ?? 0)}
          hint="Нийт бодсон бодлого"
        />
        <StatTile
          icon="🎯"
          label="Нарийвчлал"
          value={loading ? "…" : `${stats?.accuracy ?? 0}%`}
          hint={`${stats?.correct ?? 0} зөв хариулт`}
        />
      </div>

      <Card className="bolomj:border-0 bolomj:bg-gradient-to-br bolomj:from-primary/15 bolomj:via-background bolomj:to-accent/40">
        <Card.Content className="bolomj:flex bolomj:flex-col bolomj:gap-2 bolomj:p-6">
          <p className="bolomj:text-sm bolomj:text-muted-foreground">
            Бидний тухай
          </p>
          <h2 className="bolomj:text-xl bolomj:font-semibold">
            Мэдлэг бол хүүхэд бүрийн далавч
          </h2>
          <p className="bolomj:max-w-3xl bolomj:text-sm bolomj:leading-relaxed bolomj:text-muted-foreground">
            Монголын өргөн уудам нутагт хүүхэд бүр адилхан авьяастай ч адилхан
            боломжгүй байдаг. Алслагдсан суманд интернэт тасалддаг, ном сурах
            бичиг хомс, нэмэлт хичээл орох хүн олдохгүй байх нь элбэг. Бид энэ
            ялгааг багасгахын тулд мэдлэгийг хүүхэд рүү нь, тэдний нөхцөлд
            нийцүүлэн хүргэнэ.
          </p>
          <p className="bolomj:text-sm bolomj:italic bolomj:text-muted-foreground">
            “Мэдлэг хуваалцах тусам багасдаггүй, харин өснө.”
          </p>
        </Card.Content>
      </Card>

      <SectionHeading
        title="Хөтөлбөр"
        description="Интернэтгүй ч, сүлжээ муутай ч сурах боломжийг бүрдүүлэх чиглэлүүд."
      />
      <div className="bolomj:grid bolomj:gap-3 bolomj:sm:grid-cols-2">
        {PROGRAMS.map((program) => (
          <Card key={program.title}>
            <Card.Content className="bolomj:flex bolomj:gap-3">
              <span aria-hidden className="bolomj:text-2xl">
                {program.icon}
              </span>
              <div>
                <p className="bolomj:font-medium">{program.title}</p>
                <p className="bolomj:mt-1 bolomj:text-sm bolomj:text-muted-foreground">
                  {program.description}
                </p>
              </div>
            </Card.Content>
          </Card>
        ))}
      </div>

      <div className="bolomj:grid bolomj:gap-5 bolomj:lg:grid-cols-2">
        <div className="bolomj:flex bolomj:flex-col bolomj:gap-5">
          <Card>
            <Card.Header>
              <Card.Title className="bolomj:flex bolomj:items-center bolomj:gap-2">
                <IconCoin className="bolomj:size-4" />
                Хандив
              </Card.Title>
              <Card.Description>
                Таны нэг удаагийн болон сар бүрийн хандив шаардлагатай
                сурагчдад хичээлийн хэрэгсэл хүргэхэд зориулагдана.
              </Card.Description>
            </Card.Header>
            <Card.Content className="bolomj:flex bolomj:flex-col bolomj:gap-3">
              <div className="bolomj:flex bolomj:flex-wrap bolomj:items-center bolomj:gap-2 bolomj:rounded-lg bolomj:bg-muted bolomj:p-3">
                <code className="bolomj:flex-1 bolomj:break-all bolomj:text-sm bolomj:font-semibold">
                  {ACCOUNT}
                </code>
                <Button variant="outline" size="sm" onClick={() => void copyAccount()}>
                  {copied ? <IconCheck /> : <IconCopy />}
                  {copied ? "Хуулагдлаа" : "Хуулах"}
                </Button>
              </div>
              <p className="bolomj:text-sm bolomj:text-muted-foreground">
                Банк: Monpay · Эзэмшигч: Nomt Khashbold · Утас: 85813060
              </p>
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title className="bolomj:flex bolomj:items-center bolomj:gap-2">
                <IconUsers className="bolomj:size-4" />
                Сайн дурын оролцоо
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <p className="bolomj:text-sm bolomj:text-muted-foreground">
                Хичээл заах, материал орчуулах, дизайн, зураг авалт, тээвэрлэлтээр
                тусалж болно. Байгууллагын нийгмийн хариуцлагын хөтөлбөрөөр ч
                хамтран ажиллана.
              </p>
            </Card.Content>
          </Card>
        </div>

        <div className="bolomj:flex bolomj:flex-col bolomj:gap-5">
          <ContactForm />
          <Card>
            <Card.Header>
              <Card.Title>Холбоо барих</Card.Title>
            </Card.Header>
            <Card.Content className="bolomj:grid bolomj:gap-2 bolomj:text-sm">
              <a
                className="bolomj:flex bolomj:items-center bolomj:gap-2 bolomj:text-primary hover:bolomj:underline"
                href="https://www.facebook.com/share/1D71x5t8Vr/?mibextid=wwXIfr"
                target="_blank"
                rel="noreferrer"
              >
                <IconBrandFacebook className="bolomj:size-4" />
                BOLOMJ_360 · Facebook
              </a>
              <a
                className="bolomj:flex bolomj:items-center bolomj:gap-2 bolomj:text-primary hover:bolomj:underline"
                href="https://www.instagram.com/bolomj_360/"
                target="_blank"
                rel="noreferrer"
              >
                <IconBrandInstagram className="bolomj:size-4" />
                BOLOMJ_360 · Instagram
              </a>
              <a
                className="bolomj:flex bolomj:items-center bolomj:gap-2 bolomj:text-primary hover:bolomj:underline"
                href="tel:99013073"
              >
                <IconPhone className="bolomj:size-4" />
                99013073
              </a>
              <span className="bolomj:flex bolomj:items-center bolomj:gap-2 bolomj:text-muted-foreground">
                <IconMapPin className="bolomj:size-4" />
                Улаанбаатар, Монгол
              </span>
            </Card.Content>
          </Card>
        </div>
      </div>

      {loading ? <LoadingState rows={1} /> : null}
    </AppPage>
  );
};
