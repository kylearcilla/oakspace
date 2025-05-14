CREATE SCHEMA "general";
--> statement-breakpoint
CREATE TABLE "general"."appearance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"theme" varchar(100) DEFAULT 'dark',
	"font_style" varchar(100) DEFAULT 'system' NOT NULL,
	"bar_banner" varchar(100),
	"bar_banner_center" integer,
	"bar_banner_show" boolean,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "general"."note" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idx" integer NOT NULL,
	"text" text NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "general"."sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"mode" varchar(100) NOT NULL,
	"focus_time" integer NOT NULL,
	"break_time" integer NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"focus_count" integer NOT NULL,
	"break_count" integer NOT NULL,
	"pause_count" integer NOT NULL,
	"elapsed_secs" integer NOT NULL,
	"total_focus_time" integer NOT NULL,
	"total_break_time" integer NOT NULL,
	"periods" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "general"."spaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(100) NOT NULL,
	"subtitle" varchar(100) NOT NULL,
	"thumbnail" varchar(100) NOT NULL,
	"source_id" varchar(100) NOT NULL,
	"type" varchar(100) NOT NULL,
	"group" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "general"."tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"idx" integer NOT NULL,
	"emoji" varchar(10) NOT NULL,
	"color_id" varchar(100) NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "general"."text_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry" text NOT NULL,
	"styling" varchar(100) DEFAULT 'default' NOT NULL,
	"truncate" boolean DEFAULT false,
	"icon_type" varchar(100),
	"icon_src" varchar(100),
	"icon_size" varchar(100),
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "general"."todos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idx" integer NOT NULL,
	"title" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"is_checked" boolean DEFAULT false,
	"parent_id" varchar(100),
	"user_id" uuid NOT NULL,
	"session_id" uuid
);
--> statement-breakpoint
CREATE TABLE "general"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"profile_img" varchar(100) NOT NULL,
	"email" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	"pro" boolean DEFAULT false,
	"goals_reached" integer DEFAULT 0 NOT NULL,
	"habits_done" integer DEFAULT 0 NOT NULL,
	"sessions" integer DEFAULT 0 NOT NULL,
	"focus_time" varchar(100) DEFAULT '0' NOT NULL,
	"routines_made" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "general"."appearance" ADD CONSTRAINT "appearance_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "general"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "general"."note" ADD CONSTRAINT "note_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "general"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "general"."tags" ADD CONSTRAINT "tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "general"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "general"."text_entries" ADD CONSTRAINT "text_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "general"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "general"."todos" ADD CONSTRAINT "todos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "general"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "general"."todos" ADD CONSTRAINT "todos_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "general"."sessions"("id") ON DELETE cascade ON UPDATE no action;