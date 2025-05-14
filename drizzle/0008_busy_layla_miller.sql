CREATE TABLE "general"."quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"text" varchar(100) NOT NULL,
	"bg_img_src" varchar(100) NOT NULL,
	"art_credit" varchar(100) NOT NULL,
	"quote_credit" varchar(100) NOT NULL
);
