-- First, update empty strings to NULL
UPDATE "general"."text_entries"
SET "iso_date" = NULL
WHERE "iso_date" = '';

-- Then, alter the column to change its type
ALTER TABLE "general"."text_entries" 
ALTER COLUMN "iso_date" 
SET DATA TYPE date 
USING "iso_date"::date;

-- Finally, drop the NOT NULL constraint if needed
ALTER TABLE "general"."text_entries" 
ALTER COLUMN "iso_date" 
DROP NOT NULL;