import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "./middleware";

const router = Router();

router.get("/notifications", requireAuth, async (req, res) => {
  const user = (req as any).currentUser;

  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, user.id))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);

  res.json(notifications);
});

router.patch("/notifications/:id/read", requireAuth, async (req, res) => {
  const user = (req as any).currentUser;
  const id = Number(req.params.id);

  const [updated] = await db
    .update(notificationsTable)
    .set({ read: true })
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, user.id)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json(updated);
});

router.patch("/notifications/read-all", requireAuth, async (req, res) => {
  const user = (req as any).currentUser;

  await db
    .update(notificationsTable)
    .set({ read: true })
    .where(eq(notificationsTable.userId, user.id));

  res.json({ ok: true });
});

export default router;
