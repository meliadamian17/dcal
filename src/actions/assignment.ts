"use server";

import { db } from "@/db";
import { assignments, type NewAssignment } from "@/db/schema";
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

export async function createAssignment(data: Omit<NewAssignment, "id" | "notificationSent" | "submitted">) {
  try {
    const [newAssignment] = await db
      .insert(assignments)
      .values({
        courseName: data.courseName,
        assignmentName: data.assignmentName,
        description: data.description,
        dueDateTime: data.dueDateTime,
        notificationSent: false,
        submitted: false,
      })
      .onConflictDoUpdate({
        target: [assignments.courseName, assignments.assignmentName],
        set: {
          description: data.description,
          dueDateTime: data.dueDateTime,
        },
      })
      .returning();

    revalidatePath("/");
    return { success: true, assignment: newAssignment };
  } catch (error) {
    console.error("Error creating assignment:", error);
    return { success: false, error: "Failed to create assignment" };
  }
}

export async function deleteAssignment(id: string) {
  try {
    await db.delete(assignments).where(eq(assignments.id, id));

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting assignment:", error);
    return { success: false, error: "Failed to delete assignment" };
  }
}

export async function getUniqueCourses(): Promise<string[]> {
  try {
    const results = await db
      .selectDistinct({ courseName: assignments.courseName })
      .from(assignments);
    
    return results.map(r => r.courseName).sort();
  } catch (error) {
    console.error("Error fetching courses:", error);
    return [];
  }
}

