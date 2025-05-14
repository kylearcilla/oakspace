ALTER TABLE "general"."last_login" RENAME TO "last_logins";--> statement-breakpoint
ALTER TABLE "general"."last_logins" DROP CONSTRAINT "last_login_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "general"."last_logins" ADD CONSTRAINT "last_logins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "general"."users"("id") ON DELETE cascade ON UPDATE no action;