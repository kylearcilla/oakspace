CREATE TABLE "general"."current_quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "general"."current_quotes" ADD CONSTRAINT "current_quotes_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "general"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "general"."current_quotes" ADD CONSTRAINT "current_quotes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "general"."users"("id") ON DELETE cascade ON UPDATE no action;