import {
  IconDeviceGamepad2,
  IconHeartHandshake,
  IconHome,
  IconSchool,
  IconSettings,
} from "@tabler/icons-react";
import { cn } from "erxes-ui";
import { NavLink } from "react-router";
import manifest from "../../../erxes.json" with { type: "json" };
import { useLearner } from "~/modules/learner/LearnerProvider";

const { path } = manifest.ui;
const base = `/${path}`;

const TABS = [
  { to: base, label: "Нүүр", icon: IconHome, end: true },
  { to: `${base}/learn`, label: "Хичээл", icon: IconSchool },
  { to: `${base}/play`, label: "Тоглоом", icon: IconDeviceGamepad2 },
  { to: `${base}/community`, label: "Хамтдаа", icon: IconHeartHandshake },
  { to: `${base}/settings`, label: "Тохиргоо", icon: IconSettings },
];

// Mobile-first navigation: erxes owns the desktop sidebar, this bar gives the
// plugin the same thumb-reachable layout as a native learning app.
export const MobileTabBar = () => {
  const { pending } = useLearner();

  return (
    <nav
      aria-label="Аппын цэс"
      className="bolomj:fixed bolomj:inset-x-0 bolomj:bottom-0 bolomj:z-30 bolomj:border-t bolomj:border-border bolomj:bg-background/95 bolomj:backdrop-blur bolomj:md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="bolomj:mx-auto bolomj:grid bolomj:max-w-lg bolomj:grid-cols-5">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "bolomj:relative bolomj:flex bolomj:min-h-14 bolomj:flex-col bolomj:items-center bolomj:justify-center bolomj:gap-1 bolomj:px-1 bolomj:py-2 bolomj:text-[11px] bolomj:font-medium",
                isActive
                  ? "bolomj:text-primary"
                  : "bolomj:text-muted-foreground",
              )
            }
          >
            <Icon className="bolomj:size-5" />
            <span>{label}</span>
            {pending > 0 && to === `${base}/settings` ? (
              <span className="bolomj:absolute bolomj:right-3 bolomj:top-1.5 bolomj:size-2 bolomj:rounded-full bolomj:bg-warning" />
            ) : null}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
