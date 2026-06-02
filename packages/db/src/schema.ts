export const migrations = [
  {
    id: "0001_empty",
    path: "migrations/0001_empty.sql",
    description: "Scaffold migration with no schema changes.",
  },
] as const;

export type Migration = (typeof migrations)[number];
export type MigrationId = Migration["id"];
