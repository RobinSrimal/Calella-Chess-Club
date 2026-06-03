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
] as const;

export type Migration = (typeof migrations)[number];
export type MigrationId = Migration["id"];
