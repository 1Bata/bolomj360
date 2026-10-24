import "./styles.css";
import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router";
import { AppLayout } from "erxes-ui";
import manifest from "../../erxes.json" with { type: "json" };
import { LearnerProvider } from "~/modules/learner/LearnerProvider";
import { Navigation } from "./modules/Navigation";

const PlayPage = lazy(() =>
  import("./pages/PlayPage").then((module) => ({
    default: module.PlayPage,
  })),
);

// core-ui mounts this component at `/<path>/*`; routes below are relative to
// it. It resolves the component by the PascalCase expose name.
export const Bolomj360 = () => (
  <LearnerProvider>
    <AppLayout
      id={manifest.name}
      title={manifest.title}
      sidebar={<Navigation />}
    >
      <Suspense
        fallback={
          <div
            role="status"
            className="bolomj:flex bolomj:h-full bolomj:items-center bolomj:justify-center bolomj:text-sm bolomj:text-muted-foreground"
          >
            Уншиж байна…
          </div>
        }
      >
        <Routes>
          <Route path="*" element={<PlayPage />} />
        </Routes>
      </Suspense>
    </AppLayout>
  </LearnerProvider>
);
