import { pgTable, uuid, text, timestamp, boolean, unique } from "drizzle-orm/pg-core";

export const assignments = pgTable(
  "assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    courseName: text("course_name").notNull(),
    assignmentName: text("assignment_name").notNull(),
    description: text("description"),
    dueDateTime: timestamp("due_date_time").notNull(),
    notificationSent: boolean("notification_sent").default(false).notNull(),
    submitted: boolean("submitted").default(false).notNull(),
  },
  (t) => [
    // Create a unique constraint on courseName and assignmentName to handle deduplication/upserts
    unique("course_assignment_unique").on(t.courseName, t.assignmentName),
  ]
);

export type Assignment = typeof assignments.$inferSelect;
export type NewAssignment = typeof assignments.$inferInsert;

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  dateTime: timestamp("date_time").notNull(),
  tags: text("tags").array().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

