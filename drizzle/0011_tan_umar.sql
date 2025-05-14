CREATE TABLE "general"."quote_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	"quote_id" uuid NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "general"."quote_likes" ADD CONSTRAINT "quote_likes_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "general"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "general"."quote_likes" ADD CONSTRAINT "quote_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "general"."users"("id") ON DELETE cascade ON UPDATE no action;