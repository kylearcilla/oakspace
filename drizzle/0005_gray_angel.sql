CREATE TABLE "general"."homeView" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"header_view" varchar(100) NOT NULL,
	"left_margin" boolean,
	"banner_src" varchar(100),
	"banner_center" integer,
	"icon_src" varchar(100),
	"icon_type" varchar(100),
	"show_banner" boolean,
	"show_entry" boolean,
	"show_icon" boolean,
	"bulletin_img_src" varchar(100),
	"bulletin_height" integer,
	"bulletin_has_notes" boolean,
	"bulletin_contents_on_hover" boolean,
	"bulletin_note_idx" integer,
	"user_id" uuid NOT NULL
);
ALTER TABLE "general"."homeView" ADD CONSTRAINT "homeView_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "general"."users"("id") ON DELETE cascade ON UPDATE no action;