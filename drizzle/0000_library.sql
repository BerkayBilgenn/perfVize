CREATE TABLE lessons (id TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1, last_op TEXT NOT NULL DEFAULT 'seed');
--> statement-breakpoint
CREATE TABLE operations (id TEXT PRIMARY KEY NOT NULL, result TEXT NOT NULL);
--> statement-breakpoint
CREATE TABLE settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
