"use server";

import { db } from "@/db";
import { assignments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function toggleAssignmentSubmitted(assignmentId: string) {
  try {
    // First, get the current submission status
    const [assignment] = await db
      .select({ submitted: assignments.submitted })
      .from(assignments)
      .where(eq(assignments.id, assignmentId))
      .limit(1);

    if (!assignment) {
      return { success: false, error: "Assignment not found" };
    }

    // Toggle the submitted status
    const newStatus = !assignment.submitted;
    
    await db
      .update(assignments)
      .set({ submitted: newStatus })
      .where(eq(assignments.id, assignmentId));

    revalidatePath("/");
    return { success: true, submitted: newStatus };
  } catch (error) {
    console.error("Error toggling assignment submission:", error);
    return { success: false, error: "Failed to update assignment" };
  }
}

