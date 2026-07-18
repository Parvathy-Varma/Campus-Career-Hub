import { pgTable, serial, text, integer, pgEnum, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { postingsTable } from "./postings";

export const applicationStatusEnum = pgEnum("application_status", ["applied", "shortlisted", "selected", "rejected"]);

export const applicationsTable = pgTable("applications", {
  id: serial("id").primaryKey(),
  postingId: integer("posting_id").notNull().references(() => postingsTable.id),
  studentId: integer("student_id").notNull().references(() => usersTable.id),
  coverLetter: text("cover_letter"),
  status: applicationStatusEnum("status").notNull().default("applied"),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  unique("unique_application").on(t.postingId, t.studentId),
]);

export const insertApplicationSchema = createInsertSchema(applicationsTable).omit({ id: true, appliedAt: true, updatedAt: true });
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applicationsTable.$inferSelect;
