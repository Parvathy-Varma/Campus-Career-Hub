import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, postingsTable, applicationsTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "./middleware";

const router = Router();

// Analytics overview — admin only
router.get("/analytics/overview", requireAuth, requireRole("admin"), async (req, res) => {
  const [studentCount] = await db
    .select({ cnt: count() })
    .from(usersTable)
    .where(eq(usersTable.role, "student"));

  const [companyCount] = await db
    .select({ cnt: count() })
    .from(usersTable)
    .where(eq(usersTable.role, "company"));

  const [postingCount] = await db.select({ cnt: count() }).from(postingsTable);

  const [approvedCount] = await db
    .select({ cnt: count() })
    .from(postingsTable)
    .where(eq(postingsTable.status, "approved"));

  const [pendingCount] = await db
    .select({ cnt: count() })
    .from(postingsTable)
    .where(eq(postingsTable.status, "pending"));

  const [appCount] = await db.select({ cnt: count() }).from(applicationsTable);

  const [placedCount] = await db
    .select({ cnt: count() })
    .from(applicationsTable)
    .where(eq(applicationsTable.status, "selected"));

  const totalStudents = Number(studentCount?.cnt ?? 0);
  const placedStudents = Number(placedCount?.cnt ?? 0);
  const placementRate = totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 100) : 0;

  res.json({
    totalStudents,
    totalCompanies: Number(companyCount?.cnt ?? 0),
    totalPostings: Number(postingCount?.cnt ?? 0),
    approvedPostings: Number(approvedCount?.cnt ?? 0),
    totalApplications: Number(appCount?.cnt ?? 0),
    placedStudents,
    placementRate,
    pendingApprovals: Number(pendingCount?.cnt ?? 0),
  });
});

// Per-company analytics — admin only
router.get("/analytics/companies", requireAuth, requireRole("admin"), async (req, res) => {
  const companies = await db
    .select({ id: usersTable.id, companyName: usersTable.companyName })
    .from(usersTable)
    .where(eq(usersTable.role, "company"));

  const results = await Promise.all(
    companies.map(async (company) => {
      const [postingCount] = await db
        .select({ cnt: count() })
        .from(postingsTable)
        .where(eq(postingsTable.companyId, company.id));

      // Get all posting ids for this company
      const companyPostings = await db
        .select({ id: postingsTable.id })
        .from(postingsTable)
        .where(eq(postingsTable.companyId, company.id));

      if (companyPostings.length === 0) {
        return {
          companyId: company.id,
          companyName: company.companyName ?? "Unknown",
          postingCount: 0,
          applicationCount: 0,
          selectedCount: 0,
        };
      }

      const postingIds = companyPostings.map((p) => p.id);
      const { inArray } = await import("drizzle-orm");

      const [appCount] = await db
        .select({ cnt: count() })
        .from(applicationsTable)
        .where(inArray(applicationsTable.postingId, postingIds));

      const [selCount] = await db
        .select({ cnt: count() })
        .from(applicationsTable)
        .where(
          sql`${applicationsTable.postingId} = ANY(${sql.raw(`ARRAY[${postingIds.join(",")}]`)}) AND ${applicationsTable.status} = 'selected'`
        );

      return {
        companyId: company.id,
        companyName: company.companyName ?? "Unknown",
        postingCount: Number(postingCount?.cnt ?? 0),
        applicationCount: Number(appCount?.cnt ?? 0),
        selectedCount: Number(selCount?.cnt ?? 0),
      };
    })
  );

  res.json(results);
});

// Timeline analytics — monthly applications and placements
router.get("/analytics/timeline", requireAuth, requireRole("admin"), async (req, res) => {
  const raw = await db.execute(
    sql`
      SELECT
        TO_CHAR(DATE_TRUNC('month', applied_at), 'Mon YYYY') AS month,
        DATE_TRUNC('month', applied_at) AS month_start,
        COUNT(*) AS applications,
        COUNT(*) FILTER (WHERE status = 'selected') AS placements
      FROM applications
      GROUP BY DATE_TRUNC('month', applied_at)
      ORDER BY DATE_TRUNC('month', applied_at)
      LIMIT 12
    `
  );

  res.json(
    (raw.rows as any[]).map((r) => ({
      month: r.month,
      applications: Number(r.applications),
      placements: Number(r.placements),
    }))
  );
});

// Postings summary
router.get("/analytics/postings-summary", requireAuth, requireRole("admin"), async (req, res) => {
  const raw = await db.execute(
    sql`
      SELECT status, COUNT(*) AS cnt FROM postings GROUP BY status
    `
  );

  const map: Record<string, number> = {};
  for (const row of raw.rows as any[]) {
    map[row.status] = Number(row.cnt);
  }

  res.json({
    pending: map["pending"] ?? 0,
    approved: map["approved"] ?? 0,
    rejected: map["rejected"] ?? 0,
    closed: map["closed"] ?? 0,
  });
});

export default router;
