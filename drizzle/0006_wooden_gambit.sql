CREATE TABLE "general"."session_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idx" integer NOT NULL,
	"title" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"is_checked" boolean DEFAULT false,
	"parent_id" varchar(100),
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "general"."session_tasks" ADD CONSTRAINT "session_tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "general"."users"("id") ON DELETE cascade ON UPDATE no action;