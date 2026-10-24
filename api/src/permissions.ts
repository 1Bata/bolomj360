import type { IPermissionConfig } from "erxes-api-shared/core-types";
import { manifest } from "./config.ts";

// Action names are global across the platform, not local to this plugin.
export const LEARNING_READ = "bolomj360LearningRead";
export const LEARNING_WRITE = "bolomj360LearningWrite";
export const INBOX_WRITE = "bolomj360InboxWrite";
export const INBOX_READ = "bolomj360InboxRead";

export const permissions: IPermissionConfig = {
  plugin: manifest.name,
  modules: [
    {
      name: "bolomj360Learning",
      description: `${manifest.title} learner profiles, progress and games`,
      scopeField: "userId",
      ownerFields: ["userId"],
      scopes: [
        { name: "own", description: "The signed-in learner's own progress" },
        { name: "all", description: "Every learner in this tenant" },
      ],
      actions: [
        {
          name: LEARNING_READ,
          title: "View learning progress",
          description: `View ${manifest.title} profiles, progress and leaderboard`,
          // The learner app is the product: every signed-in user needs it.
          always: true,
        },
        {
          name: LEARNING_WRITE,
          title: "Record learning progress",
          description: `Save ${manifest.title} answers, coins, XP and streaks`,
          always: true,
        },
      ],
      always: true,
    },
    {
      name: "bolomj360Inbox",
      description: `${manifest.title} contact and volunteering requests`,
      scopeField: "userId",
      ownerFields: ["userId"],
      scopes: [
        { name: "own", description: "Requests sent by the signed-in user" },
        { name: "all", description: "All requests in this tenant" },
      ],
      actions: [
        {
          name: INBOX_WRITE,
          title: "Send a message",
          description: `Send a contact or volunteering request to ${manifest.title}`,
          always: true,
        },
        {
          name: INBOX_READ,
          title: "Read messages",
          description: `Read ${manifest.title} contact requests`,
        },
      ],
    },
  ],
  defaultGroups: [
    {
      id: "bolomj360Learners",
      name: "Bolomj360 learners",
      description: "Learn lessons, play games and keep progress",
      permissions: [
        {
          plugin: manifest.name,
          module: "bolomj360Learning",
          actions: [LEARNING_READ, LEARNING_WRITE],
          scope: "own",
        },
        {
          plugin: manifest.name,
          module: "bolomj360Inbox",
          actions: [INBOX_WRITE],
          scope: "own",
        },
      ],
    },
  ],
};
