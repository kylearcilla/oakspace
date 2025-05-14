ALTER TABLE "general"."note" RENAME TO "notes";--> statement-breakpoint
ALTER TABLE "general"."notes" DROP CONSTRAINT "note_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "general"."notes" ADD CONSTRAINT "notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "general"."users"("id") ON DELETE cascade ON UPDATE no action;