ALTER TABLE "general"."home_view" ALTER COLUMN "header_view" SET DEFAULT 'top';--> statement-breakpoint
ALTER TABLE "general"."home_view" ALTER COLUMN "left_margin" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "general"."home_view" ADD COLUMN "left_margin_view" varchar(100) DEFAULT 'month' NOT NULL;