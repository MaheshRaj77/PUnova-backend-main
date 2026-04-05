ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "gender" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "date_of_birth" varchar(10);--> statement-breakpoint
ALTER TABLE "forum_posts" ADD COLUMN IF NOT EXISTS "category" varchar(50) DEFAULT 'General';
