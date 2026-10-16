CREATE TABLE "ExamBundle" (
  "examId" TEXT PRIMARY KEY,
  "document" JSONB NOT NULL,
  "questions" JSONB NOT NULL,
  "pattern" JSONB NOT NULL,
  "paperPdf" BYTEA NOT NULL,
  "answerPdf" BYTEA NOT NULL,
  "keyPdf" BYTEA NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExamBundle_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
ALTER TABLE "Result" ADD COLUMN "manualScores" JSONB, ADD COLUMN "scanAnalysis" JSONB;
