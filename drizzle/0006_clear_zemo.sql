ALTER TABLE "general"."homeView" RENAME TO "home_view";--> statement-breakpoint
ALTER TABLE "general"."home_view" DROP CONSTRAINT "homeView_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "general"."home_view" ADD CONSTRAINT "home_view_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "general"."users"("id") ON DELETE cascade ON UPDATE no action;