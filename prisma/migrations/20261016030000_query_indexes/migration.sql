CREATE INDEX "Student_groupId_firstName_lastName_idx" ON "Student"("groupId", "firstName", "lastName");
CREATE INDEX "Invitation_studentId_idx" ON "Invitation"("studentId");
CREATE INDEX "Result_studentId_idx" ON "Result"("studentId");
