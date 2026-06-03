export const migrations = [
  {
    id: "0001_empty",
    path: "migrations/0001_empty.sql",
    description: "Scaffold migration with no schema changes.",
  },
  {
    id: "0002_auth_registration",
    path: "migrations/0002_auth_registration.sql",
    description: "Create users and email verification tokens.",
  },
  {
    id: "0003_auth_sessions",
    path: "migrations/0003_auth_sessions.sql",
    description: "Create refresh sessions and login attempt records.",
  },
  {
    id: "0004_posts",
    path: "migrations/0004_posts.sql",
    description: "Create member posts.",
  },
] as const;

export type Migration = (typeof migrations)[number];
export type MigrationId = Migration["id"];
