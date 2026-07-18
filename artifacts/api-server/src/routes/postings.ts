import { Router } from "express";
import { db } from "@workspace/db";
import { postingsTable, usersTable, applicationsTable, notificationsTable } from "@workspace/db";
import { eq, and, count, sql, desc, inArray } from "drizzle-orm";
import { requireAuth, requireRole } from "./middleware";

const router = Router();

// List postings — filtered by role
router.get("/postings", requireAuth, async (req, res) => {
  const user = (req as any).currentUser;
  const { status, companyId } = req.query;

  let query = db
    .select({
      id: postingsTable.id,
      companyId: postingsTable.companyId,
      companyName: usersTable.companyName,
      title: postingsTable.title,
      description: postingsTable.description,
      eligibility: postingsTable.eligibility,
      minCgpa: postingsTable.minCgpa,
      branches: postingsTable.branches,
      ctc: postingsTable.ctc,
      location: postingsTable.location,
      slots: postingsTable.slots,
      status: postingsTable.status,
      rejectionReason: postingsTable.rejectionReason,
      deadline: postingsTable.deadline,
      createdAt: postingsTable.createdAt,
      updatedAt: postingsTable.updatedAt,
    })
    .from(postingsTable)
    .innerJoin(usersTable, eq(postingsTable.companyId, usersTable.id))
    .$dynamic();

  const conditions = [];

  if (user.role === "company") {
    conditions.push(eq(postingsTable.companyId, user.id));
  } else if (user.role === "student") {
    conditions.push(eq(postingsTable.status, "approved"));
  }

  if (status && typeof status === "string") {
    conditions.push(eq(postingsTable.status, status as any));
  }
  if (companyId) {
    conditions.push(eq(postingsTable.companyId, Number(companyId)));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  const postings = await (query.orderBy(desc(postingsTable.createdAt)) as any);

  // Get application counts
  const ids = postings.map((p: any) => p.id);
  let appCounts: any[] = [];
  if (ids.length > 0) {
    appCounts = await db
      .select({ postingId: applicationsTable.postingId, cnt: count() })
      .from(applicationsTable)
      .where(inArray(applicationsTable.postingId, ids))
      .groupBy(applicationsTable.postingId);
  }

  const countMap = Object.fromEntries(appCounts.map((a: any) => [a.postingId, Number(a.cnt)]));

  // For students, check hasApplied
  let appliedSet = new Set<number>();
  if (user.role === "student" && ids.length > 0) {
    const myApps = await db
      .select({ postingId: applicationsTable.postingId })
      .from(applicationsTable)
      .where(and(eq(applicationsTable.studentId, user.id), inArray(applicationsTable.postingId, ids)));
    appliedSet = new Set(myApps.map((a: any) => a.postingId));
  }

  res.json(
    postings.map((p: any) => ({
      ...p,
      applicationCount: countMap[p.id] ?? 0,
      hasApplied: user.role === "student" ? appliedSet.has(p.id) : null,
    }))
  );
});

// Create posting — company only
router.post("/postings", requireAuth, requireRole("company"), async (req, res) => {
  const user = (req as any).currentUser;
  const { title, description, eligibility, minCgpa, branches, ctc, location, slots, deadline } = req.body;

  if (!title || !description || !deadline) {
    res.status(400).json({ error: "title, description, and deadline are required" });
    return;
  }

  const [posting] = await db
    .insert(postingsTable)
    .values({
      companyId: user.id,
      title,
      description,
      eligibility: eligibility || null,
      minCgpa: minCgpa ?? null,
      branches: branches || null,
      ctc: ctc || null,
      location: location || null,
      slots: slots ?? null,
      status: "pending",
      deadline: new Date(deadline),
    })
    .returning();

  // Notify all admins
  const admins = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.role, "admin"));
  if (admins.length > 0) {
    await db.insert(notificationsTable).values(
      admins.map((a) => ({
        userId: a.id,
        message: `New posting "${title}" from ${user.companyName || "a company"} is pending approval.`,
        type: "posting_pending",
      }))
    );
  }

  const company = await db.select().from(usersTable).where(eq(usersTable.id, user.id)).limit(1);

  res.status(201).json({
    ...posting,
    companyName: company[0]?.companyName ?? null,
    applicationCount: 0,
    hasApplied: null,
  });
});

// Get single posting
router.get("/postings/:id", requireAuth, async (req, res) => {
  const user = (req as any).currentUser;
  const id = Number(req.params.id);

  const [posting] = await db
    .select({
      id: postingsTable.id,
      companyId: postingsTable.companyId,
      companyName: usersTable.companyName,
      title: postingsTable.title,
      description: postingsTable.description,
      eligibility: postingsTable.eligibility,
      minCgpa: postingsTable.minCgpa,
      branches: postingsTable.branches,
      ctc: postingsTable.ctc,
      location: postingsTable.location,
      slots: postingsTable.slots,
      status: postingsTable.status,
      rejectionReason: postingsTable.rejectionReason,
      deadline: postingsTable.deadline,
      createdAt: postingsTable.createdAt,
      updatedAt: postingsTable.updatedAt,
    })
    .from(postingsTable)
    .innerJoin(usersTable, eq(postingsTable.companyId, usersTable.id))
    .where(eq(postingsTable.id, id))
    .limit(1);

  if (!posting) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  // Students can only see approved postings
  if (user.role === "student" && posting.status !== "approved") {
    res.status(404).json({ error: "Not found" });
    return;
  }

  // Company can only see their own
  if (user.role === "company" && posting.companyId !== user.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  // Get applications for this posting
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
    .where(eq(applicationsTable.postingId, id))
    .orderBy(desc(applicationsTable.appliedAt));

  res.json({
    ...posting,
    applications: applications.map((a) => ({
      ...a,
      postingTitle: posting.title,
      companyName: posting.companyName,
    })),
  });
});

// Update posting — company only, pending only
router.patch("/postings/:id", requireAuth, requireRole("company"), async (req, res) => {
  const user = (req as any).currentUser;
  const id = Number(req.params.id);

  const [existing] = await db.select().from(postingsTable).where(eq(postingsTable.id, id)).limit(1);
  if (!existing || existing.companyId !== user.id) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (existing.status !== "pending") {
    res.status(400).json({ error: "Can only update pending postings" });
    return;
  }

  const { title, description, eligibility, minCgpa, branches, ctc, location, slots, deadline } = req.body;
  const [updated] = await db
    .update(postingsTable)
    .set({
      ...(title && { title }),
      ...(description && { description }),
      ...(eligibility !== undefined && { eligibility }),
      ...(minCgpa !== undefined && { minCgpa }),
      ...(branches !== undefined && { branches }),
      ...(ctc !== undefined && { ctc }),
      ...(location !== undefined && { location }),
      ...(slots !== undefined && { slots }),
      ...(deadline && { deadline: new Date(deadline) }),
      updatedAt: new Date(),
    })
    .where(eq(postingsTable.id, id))
    .returning();

  const company = await db.select().from(usersTable).where(eq(usersTable.id, user.id)).limit(1);

  res.json({ ...updated, companyName: company[0]?.companyName ?? null, applicationCount: 0, hasApplied: null });
});

// Approve posting — admin only
router.patch("/postings/:id/approve", requireAuth, requireRole("admin"), async (req, res) => {
  const id = Number(req.params.id);

  const [posting] = await db.select().from(postingsTable).where(eq(postingsTable.id, id)).limit(1);
  if (!posting) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [updated] = await db
    .update(postingsTable)
    .set({ status: "approved", updatedAt: new Date() })
    .where(eq(postingsTable.id, id))
    .returning();

  // Notify the company
  await db.insert(notificationsTable).values({
    userId: posting.companyId,
    message: `Your posting "${posting.title}" has been approved and is now live.`,
    type: "posting_approved",
  });

  const company = await db.select().from(usersTable).where(eq(usersTable.id, posting.companyId)).limit(1);

  res.json({ ...updated, companyName: company[0]?.companyName ?? null, applicationCount: 0, hasApplied: null });
});

// Reject posting — admin only
router.patch("/postings/:id/reject", requireAuth, requireRole("admin"), async (req, res) => {
  const id = Number(req.params.id);
  const { reason } = req.body;

  if (!reason) {
    res.status(400).json({ error: "reason is required" });
    return;
  }

  const [posting] = await db.select().from(postingsTable).where(eq(postingsTable.id, id)).limit(1);
  if (!posting) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [updated] = await db
    .update(postingsTable)
    .set({ status: "rejected", rejectionReason: reason, updatedAt: new Date() })
    .where(eq(postingsTable.id, id))
    .returning();

  // Notify the company
  await db.insert(notificationsTable).values({
    userId: posting.companyId,
    message: `Your posting "${posting.title}" was rejected. Reason: ${reason}`,
    type: "posting_rejected",
  });

  const company = await db.select().from(usersTable).where(eq(usersTable.id, posting.companyId)).limit(1);

  res.json({ ...updated, companyName: company[0]?.companyName ?? null, applicationCount: 0, hasApplied: null });
});

// Close posting
router.patch("/postings/:id/close", requireAuth, async (req, res) => {
  const user = (req as any).currentUser;
  const id = Number(req.params.id);

  const [posting] = await db.select().from(postingsTable).where(eq(postingsTable.id, id)).limit(1);
  if (!posting) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  if (user.role === "company" && posting.companyId !== user.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [updated] = await db
    .update(postingsTable)
    .set({ status: "closed", updatedAt: new Date() })
    .where(eq(postingsTable.id, id))
    .returning();

  const company = await db.select().from(usersTable).where(eq(usersTable.id, posting.companyId)).limit(1);

  res.json({ ...updated, companyName: company[0]?.companyName ?? null, applicationCount: 0, hasApplied: null });
});

export default router;
