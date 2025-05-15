ALTER TABLE "general"."ui_options" ADD COLUMN "bar_view" varchar(100) DEFAULT 'cal' NOT NULL;--> statement-breakpoint
ALTER TABLE "general"."ui_options" ADD COLUMN "routine_colors" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "general"."ui_options" ADD COLUMN "routine_boxes" boolean DEFAULT true;