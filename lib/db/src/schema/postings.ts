import { pgTable, serial, text, real, integer, pgEnum, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const postingStatusEnum = pgEnum("posting_status", ["pending", "approved", "rejected", "closed"]);

export const postingsTable = pgTable("postings", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => usersTable.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  eligibility: text("eligibility"),
  minCgpa: real("min_cgpa"),
  branches: text("branches"),
  ctc: text("ctc"),
  location: text("location"),
  slots: integer("slots"),
  status: postingStatusEnum("status").notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  deadline: timestamp("deadline").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPostingSchema = createInsertSchema(postingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPosting = z.infer<typeof insertPostingSchema>;
export type Posting = typeof postingsTable.$inferSelect;
