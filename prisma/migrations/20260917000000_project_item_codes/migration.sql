-- Prevent duplicate user-facing codes within a project.
CREATE UNIQUE INDEX "Requirement_projectId_reqCode_key" ON "Requirement"("projectId", "reqCode");
CREATE UNIQUE INDEX "UATCase_projectId_uatCode_key" ON "UATCase"("projectId", "uatCode");
CREATE UNIQUE INDEX "Issue_projectId_issueCode_key" ON "Issue"("projectId", "issueCode");
