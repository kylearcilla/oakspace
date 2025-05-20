ALTER TABLE "general"."todos" DROP CONSTRAINT "todos_session_id_sessions_id_fk";
--> statement-breakpoint
ALTER TABLE "general"."todos" DROP COLUMN "session_id";