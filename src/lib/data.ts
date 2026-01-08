import { db } from "@/db";
import { assignments, events } from "@/db/schema";
import { asc, gte, lte, and } from "drizzle-orm";

export async function getAssignments(startDate: Date, endDate: Date) {
  try {
    return await db
      .select()
      .from(assignments)
      .where(
        and(
          gte(assignments.dueDateTime, startDate),
          lte(assignments.dueDateTime, endDate)
        )
      )
      .orderBy(asc(assignments.dueDateTime));
  } catch (error) {
    console.error("Failed to fetch assignments:", error);
    throw new Error("Failed to fetch assignments.");
  }
}

export async function getAllAssignments() {
  return await db.select().from(assignments).orderBy(asc(assignments.dueDateTime));
}

export async function getAllEvents() {
  return await db.select().from(events).orderBy(asc(events.dateTime));
}

export async function getEvents(startDate: Date, endDate: Date) {
  try {
    return await db
      .select()
      .from(events)
      .where(
        and(
          gte(events.dateTime, startDate),
          lte(events.dateTime, endDate)
        )
      )
      .orderBy(asc(events.dateTime));
  } catch (error) {
    console.error("Failed to fetch events:", error);
    throw new Error("Failed to fetch events.");
  }
}
