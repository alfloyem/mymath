ALTER TABLE "Student" ADD COLUMN "username" TEXT;
-- Backfill existing accounts without changing their IDs or passwords.
DO $$
DECLARE student_row RECORD; candidate TEXT;
BEGIN
  FOR student_row IN SELECT "id" FROM "Student" LOOP
    candidate := 'student-' || student_row."id";
    WHILE EXISTS (SELECT 1 FROM "Admin" WHERE lower("username") = candidate)
       OR EXISTS (SELECT 1 FROM "Student" WHERE "username" = candidate) LOOP
      candidate := candidate || '-s';
    END LOOP;
    UPDATE "Student" SET "username" = candidate WHERE "id" = student_row."id";
  END LOOP;
END $$;
ALTER TABLE "Student" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "Student_username_key" ON "Student"("username");
