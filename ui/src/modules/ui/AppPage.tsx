import type { ComponentType, ReactNode } from "react";
import { Link } from "react-router";
import { Breadcrumb, Button, Card, Skeleton, cn } from "erxes-ui";
import { PageHeader } from "ui-modules";
import manifest from "../../../../erxes.json" with { type: "json" };
import { useLearner } from "~/modules/learner/LearnerProvider";

const { path } = manifest.ui;

export const AppPage = ({
  icon: Icon,
  title,
  subtitle,
  breadcrumb,
  actions,
  children,
  wide,
  className,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  breadcrumb?: string[];
  actions?: ReactNode;
  children: ReactNode;
  wide?: boolean;
  className?: string;
}) => (
  <div
    className={cn("bolomj:flex bolomj:h-full bolomj:flex-col", className)}
  >
    <PageHeader>
      <PageHeader.Start>
        <Breadcrumb>
          <Breadcrumb.List className="bolomj:gap-1">
            <Breadcrumb.Item>
              <Button variant="ghost" asChild>
                <Link to={`/${path}`}>
                  <Icon />
                  {title}
                </Link>
              </Button>
            </Breadcrumb.Item>
            {(breadcrumb ?? []).map((item, index) => (
              <Breadcrumb.Item key={`${item}-${index}`}>
                <span className="bolomj:text-sm bolomj:text-muted-foreground">
                  {item}
                </span>
              </Breadcrumb.Item>
            ))}
          </Breadcrumb.List>
        </Breadcrumb>
      </PageHeader.Start>
      {actions ? <PageHeader.End>{actions}</PageHeader.End> : null}
    </PageHeader>
    <div className="bolomj:flex-1 bolomj:overflow-auto">
      <div
        className={cn(
          "bolomj:mx-auto bolomj:flex bolomj:w-full bolomj:flex-col bolomj:gap-5 bolomj:p-4 bolomj:sm:p-6",
          wide ? "bolomj:max-w-7xl" : "bolomj:max-w-6xl",
        )}
      >
        {subtitle ? (
          <p className="bolomj:text-sm bolomj:text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
        {children}
      </div>
    </div>
  </div>
);

export const ProgressBar = ({
  value,
  className,
}: {
  value: number;
  className?: string;
}) => (
  <div
    role="progressbar"
    aria-valuenow={Math.round(value)}
    aria-valuemin={0}
    aria-valuemax={100}
    className={cn(
      "bolomj:h-2 bolomj:w-full bolomj:overflow-hidden bolomj:rounded-full bolomj:bg-muted",
      className,
    )}
  >
    <div
      className="bolomj:h-full bolomj:rounded-full bolomj:bg-primary bolomj:transition-all"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

export const StatTile = ({
  icon,
  label,
  value,
  hint,
}: {
  icon: string;
  label: string;
  value: string | number;
  hint?: string;
}) => (
  <Card className="bolomj:p-4">
    <div className="bolomj:flex bolomj:items-start bolomj:justify-between bolomj:gap-2">
      <div>
        <p className="bolomj:text-xs bolomj:font-medium bolomj:uppercase bolomj:tracking-wide bolomj:text-muted-foreground">
          {label}
        </p>
        <p className="bolomj:mt-1 bolomj:text-2xl bolomj:font-semibold">
          {value}
        </p>
        {hint ? (
          <p className="bolomj:mt-1 bolomj:text-xs bolomj:text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
      <span aria-hidden className="bolomj:text-2xl">
        {icon}
      </span>
    </div>
  </Card>
);

export const SyncBanner = () => {
  const { mode, pending, online } = useLearner();

  if (mode === "live" && online) {
    return null;
  }

  const message =
    mode === "offline"
      ? "Сүлжээгүй байна. Хариултууд төхөөрөмж дээр хадгалагдаж, сүлжээ ормогц серверт синк хийнэ."
      : "Серверийн эрх эсвэл нэвтрэлт байхгүй байна. Ахиц зөвхөн энэ төхөөрөмж дээр хадгалагдана.";

  return (
    <div className="bolomj:flex bolomj:flex-wrap bolomj:items-center bolomj:justify-between bolomj:gap-2 bolomj:rounded-lg bolomj:border bolomj:border-warning/40 bolomj:bg-warning/10 bolomj:px-4 bolomj:py-3 bolomj:text-sm">
      <span>{message}</span>
      {pending > 0 ? (
        <span className="bolomj:font-medium">
          {pending} хариулт хүлээгдэж байна
        </span>
      ) : null}
    </div>
  );
};

export const LoadingState = ({ rows = 3 }: { rows?: number }) => (
  <div className="bolomj:flex bolomj:flex-col bolomj:gap-3" role="status">
    <span className="bolomj:sr-only">Уншиж байна…</span>
    {Array.from({ length: rows }, (_, index) => (
      <Skeleton key={index} className="bolomj:h-20 bolomj:w-full" />
    ))}
  </div>
);

export const ErrorState = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) => (
  <Card role="alert" className="bolomj:p-5">
    <p className="bolomj:font-medium">Алдаа гарлаа</p>
    <p className="bolomj:mt-1 bolomj:text-sm bolomj:text-muted-foreground">
      {message}
    </p>
    {onRetry ? (
      <Button className="bolomj:mt-4" variant="outline" onClick={onRetry}>
        Дахин оролдох
      </Button>
    ) : null}
  </Card>
);

export const SectionHeading = ({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) => (
  <div className="bolomj:flex bolomj:items-end bolomj:justify-between bolomj:gap-4">
    <div>
      <h2 className="bolomj:text-lg bolomj:font-semibold">{title}</h2>
      {description ? (
        <p className="bolomj:mt-1 bolomj:text-sm bolomj:text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
    {action}
  </div>
);

export const AvatarBadge = ({
  avatar,
  size = "default",
}: {
  avatar: string;
  size?: "sm" | "default" | "lg";
}) => (
  <span
    aria-hidden
    className={cn(
      "bolomj:grid bolomj:shrink-0 bolomj:place-items-center bolomj:rounded-full bolomj:bg-accent",
      size === "sm"
        ? "bolomj:size-8 bolomj:text-lg"
        : size === "lg"
          ? "bolomj:size-16 bolomj:text-4xl"
          : "bolomj:size-11 bolomj:text-2xl",
    )}
  >
    {avatar}
  </span>
);
