import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "./middleware";

const router = Router();

// Update current user profile
router.patch("/users/me", requireAuth, async (req, res) => {
  const user = (req as any).currentUser;
  const { name, department, cgpa, graduationYear } = req.body;

  const updates: Record<string, any> = {};
  if (name !== undefined) updates.name = name;
  if (department !== undefined) updates.department = department;
  if (cgpa !== undefined) updates.cgpa = cgpa;
  if (graduationYear !== undefined) updates.graduationYear = graduationYear;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, user.id))
    .returning();

  res.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    companyName: updated.companyName,
    department: updated.department,
    cgpa: updated.cgpa,
    graduationYear: updated.graduationYear,
  });
});

export default router;
