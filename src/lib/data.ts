import { db } from "@/db";
import { assignments, events } from "@/db/schema";
import { asc, gte, lte, and } from "drizzle-orm";
import { unstable_cache } from "next/cache";

async function _getAssignments(startDate: Date, endDate: Date) {
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

export async function getAssignments(startDate: Date, endDate: Date) {
  const cacheKey = `assignments-${startDate.toISOString()}-${endDate.toISOString()}`;
  return unstable_cache(
    async () => _getAssignments(startDate, endDate),
    [cacheKey],
    {
      tags: ["assignments"],
      revalidate: 30, // 30 seconds
    }
  )();
}

async function _getAllAssignments() {
  return await db.select().from(assignments).orderBy(asc(assignments.dueDateTime));
}

export async function getAllAssignments() {
  return unstable_cache(
    async () => _getAllAssignments(),
    ["all-assignments"],
    {
      tags: ["assignments"],
      revalidate: 30, // 30 seconds
    }
  )();
}

async function _getAllEvents() {
  return await db.select().from(events).orderBy(asc(events.dateTime));
}

export async function getAllEvents() {
  return unstable_cache(
    async () => _getAllEvents(),
    ["all-events"],
    {
      tags: ["events"],
      revalidate: 30, // 30 seconds
    }
  )();
}

async function _getEvents(startDate: Date, endDate: Date) {
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

export async function getEvents(startDate: Date, endDate: Date) {
  const cacheKey = `events-${startDate.toISOString()}-${endDate.toISOString()}`;
  return unstable_cache(
    async () => _getEvents(startDate, endDate),
    [cacheKey],
    {
      tags: ["events"],
      revalidate: 30, // 30 seconds
    }
  )();
}
