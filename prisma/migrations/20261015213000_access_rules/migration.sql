ALTER TABLE "Invitation" RENAME COLUMN "usedAt" TO "revokedAt";
ALTER TABLE "Session" ADD CONSTRAINT "session_one_identity" CHECK (("adminId" IS NULL) <> ("studentId" IS NULL));
ALTER TABLE "Exam" ADD CONSTRAINT "exam_status" CHECK ("status" IN ('OPEN', 'CLOSED'));
ALTER TABLE "PasswordRequest" ADD CONSTRAINT "request_status" CHECK ("status" IN ('PENDING', 'APPROVED', 'REJECTED', 'SUPERSEDED'));
CREATE UNIQUE INDEX "admin_single_account" ON "Admin" ((true));
CREATE UNIQUE INDEX "request_single_pending" ON "PasswordRequest" ("studentId") WHERE "status" = 'PENDING';
