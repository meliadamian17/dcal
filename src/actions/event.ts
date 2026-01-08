"use server";

import { db } from "@/db";
import { events, type NewEvent } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createEvent(data: Omit<NewEvent, "id" | "createdAt">) {
  try {
    const [newEvent] = await db
      .insert(events)
      .values({
        title: data.title,
        description: data.description,
        dateTime: data.dateTime,
        tags: data.tags || [],
      })
      .returning();

    revalidatePath("/");
    return { success: true, event: newEvent };
  } catch (error) {
    console.error("Error creating event:", error);
    return { success: false, error: "Failed to create event" };
  }
}

export async function updateEvent(
  id: string,
  data: Partial<Omit<NewEvent, "id" | "createdAt">>
) {
  try {
    const [updatedEvent] = await db
      .update(events)
      .set(data)
      .where(eq(events.id, id))
      .returning();

    revalidatePath("/");
    return { success: true, event: updatedEvent };
  } catch (error) {
    console.error("Error updating event:", error);
    return { success: false, error: "Failed to update event" };
  }
}

export async function deleteEvent(id: string) {
  try {
    await db.delete(events).where(eq(events.id, id));

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting event:", error);
    return { success: false, error: "Failed to delete event" };
  }
}


