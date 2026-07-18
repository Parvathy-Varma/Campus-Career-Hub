import { Router } from "express";
import { db } from "@workspace/db";
import { applicationsTable, postingsTable, usersTable, notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "./middleware";

const router = Router();

// List applications for a posting (admin or company)
router.get("/postings/:id/applications", requireAuth, async (req, res) => {
  const user = (req as any).currentUser;
  const postingId = Number(req.params.id);

  const [posting] = await db.select().from(postingsTable).where(eq(postingsTable.id, postingId)).limit(1);
  if (!posting) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  if (user.role === "company" && posting.companyId !== user.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  if (user.role === "student") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const applications = await db
    .select({
      id: applicationsTable.id,
      postingId: applicationsTable.postingId,
      studentId: applicationsTable.studentId,
      studentName: usersTable.name,
      studentEmail: usersTable.email,
      studentDepartment: usersTable.department,
      studentCgpa: usersTable.cgpa,
      coverLetter: applicationsTable.coverLetter,
      status: applicationsTable.status,
      appliedAt: applicationsTable.appliedAt,
      updatedAt: applicationsTable.updatedAt,
    })
    .from(applicationsTable)
    .innerJoin(usersTable, eq(applicationsTable.studentId, usersTable.id))
    .where(eq(applicationsTable.postingId, postingId))
    .orderBy(desc(applicationsTable.appliedAt));

  res.json(
    applications.map((a) => ({
      ...a,
      postingTitle: posting.title,
      companyName: null,
    }))
  );
});

// Apply to a posting — student only
router.post("/postings/:id/applications", requireAuth, requireRole("student"), async (req, res) => {
  const user = (req as any).currentUser;
  const postingId = Number(req.params.id);

  const [posting] = await db
    .select()
    .from(postingsTable)
    .where(and(eq(postingsTable.id, postingId), eq(postingsTable.status, "approved")))
    .limit(1);

  if (!posting) {
    res.status(404).json({ error: "Posting not found or not approved" });
    return;
  }

  // Check deadline
  if (new Date() > posting.deadline) {
    res.status(400).json({ error: "Application deadline has passed" });
    return;
  }

  // Check already applied
  const [existing] = await db
    .select()
    .from(applicationsTable)
    .where(and(eq(applicationsTable.postingId, postingId), eq(applicationsTable.studentId, user.id)))
    .limit(1);

  if (existing) {
    res.status(409).json({ error: "Already applied" });
    return;
  }

  const { coverLetter } = req.body;

  const [application] = await db
    .insert(applicationsTable)
    .values({
      postingId,
      studentId: user.id,
      coverLetter: coverLetter || null,
      status: "applied",
    })
    .returning();

  // Notify company
  await db.insert(notificationsTable).values({
    userId: posting.companyId,
    message: `${user.name} applied to your posting "${posting.title}".`,
    type: "new_application",
  });

  const companyRow = await db.select().from(usersTable).where(eq(usersTable.id, posting.companyId)).limit(1);

  res.status(201).json({
    ...application,
    postingTitle: posting.title,
    companyName: companyRow[0]?.companyName ?? null,
    studentName: user.name,
    studentEmail: user.email,
    studentDepartment: user.department,
    studentCgpa: user.cgpa,
  });
});

// List applications — student sees own, admin sees all
router.get("/applications", requireAuth, async (req, res) => {
  const user = (req as any).currentUser;

  if (user.role === "company") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const rows = await db
    .select({
      id: applicationsTable.id,
      postingId: applicationsTable.postingId,
      postingTitle: postingsTable.title,
      studentId: applicationsTable.studentId,
      studentName: usersTable.name,
      studentEmail: usersTable.email,
      studentDepartment: usersTable.department,
      studentCgpa: usersTable.cgpa,
      coverLetter: applicationsTable.coverLetter,
      status: applicationsTable.status,
      appliedAt: applicationsTable.appliedAt,
      updatedAt: applicationsTable.updatedAt,
      companyId: postingsTable.companyId,
    })
    .from(applicationsTable)
    .innerJoin(postingsTable, eq(applicationsTable.postingId, postingsTable.id))
    .innerJoin(usersTable, eq(applicationsTable.studentId, usersTable.id))
    .where(user.role === "student" ? eq(applicationsTable.studentId, user.id) : undefined as any)
    .orderBy(desc(applicationsTable.appliedAt));

  // Get company names
  const companyIds = [...new Set(rows.map((r: any) => r.companyId))];
  let companyMap: Record<number, string> = {};
  if (companyIds.length > 0) {
    const companies = await db
      .select({ id: usersTable.id, companyName: usersTable.companyName })
      .from(usersTable)
      .where(
        companyIds.length === 1
          ? eq(usersTable.id, companyIds[0]!)
          : (() => {
              const { inArray } = require("drizzle-orm");
              return inArray(usersTable.id, companyIds);
            })()
      );
    companyMap = Object.fromEntries(companies.map((c) => [c.id, c.companyName ?? ""]));
  }

  res.json(
    rows.map((r: any) => ({
      ...r,
      companyName: companyMap[r.companyId] ?? null,
    }))
  );
});

// Update application status — company or admin
router.patch("/applications/:id/status", requireAuth, async (req, res) => {
  const user = (req as any).currentUser;
  const id = Number(req.params.id);
  const { status } = req.body;

  if (!["applied", "shortlisted", "selected", "rejected"].includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  if (user.role === "student") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [application] = await db
    .select({
      id: applicationsTable.id,
      postingId: applicationsTable.postingId,
      studentId: applicationsTable.studentId,
      coverLetter: applicationsTable.coverLetter,
      status: applicationsTable.status,
      appliedAt: applicationsTable.appliedAt,
      postingCompanyId: postingsTable.companyId,
      postingTitle: postingsTable.title,
    })
    .from(applicationsTable)
    .innerJoin(postingsTable, eq(applicationsTable.postingId, postingsTable.id))
    .where(eq(applicationsTable.id, id))
    .limit(1);

  if (!application) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  if (user.role === "company" && application.postingCompanyId !== user.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [updated] = await db
    .update(applicationsTable)
    .set({ status: status as any, updatedAt: new Date() })
    .where(eq(applicationsTable.id, id))
    .returning();

  // Notify student
  const statusMessages: Record<string, string> = {
    shortlisted: `You have been shortlisted for "${application.postingTitle}".`,
    selected: `Congratulations! You have been selected for "${application.postingTitle}".`,
    rejected: `Your application for "${application.postingTitle}" was not successful.`,
  };
  if (statusMessages[status]) {
    await db.insert(notificationsTable).values({
      userId: application.studentId,
      message: statusMessages[status]!,
      type: `application_${status}`,
    });
  }

  const student = await db.select().from(usersTable).where(eq(usersTable.id, application.studentId)).limit(1);

  res.json({
    ...updated,
    postingTitle: application.postingTitle,
    companyName: null,
    studentName: student[0]?.name ?? null,
    studentEmail: student[0]?.email ?? null,
    studentDepartment: student[0]?.department ?? null,
    studentCgpa: student[0]?.cgpa ?? null,
  });
});

export default router;
