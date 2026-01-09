"use server";

import { db } from "@/db";
import { assignments } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { z } from "zod";

// Zod schema for structured output validation
const AssignmentSchema = z.object({
  name: z.string().describe("The name/title of the assignment"),
  description: z.string().optional().describe("A description of the assignment"),
  due_date: z.string().describe("Due date in YYYY-MM-DD format"),
  due_time: z.string().optional().nullable().describe("Due time in HH:MM format (24-hour), or null if not specified"),
});

const SyllabusSchema = z.object({
  course: z.string().describe("The course name or code (e.g., 'CS 405')"),
  assignments: z.array(AssignmentSchema).describe("List of all assignments found in the syllabus"),
});

type SyllabusStructure = z.infer<typeof SyllabusSchema>;

/**
 * Formats Zod validation errors into user-friendly messages
 */
function formatValidationErrors(error: z.ZodError): string {
  const issues = error.issues.map((issue) => {
    const path = issue.path.join(".");
    if (path) {
      return `- ${path}: ${issue.message}`;
    }
    return `- ${issue.message}`;
  });
  return issues.join("\n");
}

/**
 * Saves selected assignments to the database
 */
export async function saveSelectedAssignments(
  courseName: string,
  selectedAssignments: Array<{
    name: string;
    description?: string;
    due_date: string;
    due_time?: string | null;
  }>
) {
  try {
    let successCount = 0;
    const errors: string[] = [];

    for (const assignment of selectedAssignments) {
      try {
        const time = assignment.due_time || "23:59";
        const dateTimeString = `${assignment.due_date}T${time}`;
        const dueDateTime = new Date(dateTimeString);

        if (isNaN(dueDateTime.getTime())) {
          errors.push(`Invalid date for assignment: ${assignment.name} (${dateTimeString})`);
          continue;
        }

        await db
          .insert(assignments)
          .values({
            courseName,
            assignmentName: assignment.name,
            description: assignment.description || "",
            dueDateTime,
            notificationSent: false,
          })
          .onConflictDoUpdate({
            target: [assignments.courseName, assignments.assignmentName],
            set: {
              description: assignment.description || "",
              dueDateTime,
              notificationSent: false,
            },
          });

        successCount++;
      } catch (error) {
        errors.push(`Failed to save assignment: ${assignment.name}`);
        console.error(`Error saving assignment ${assignment.name}:`, error);
      }
    }

    revalidatePath("/");

    if (successCount === 0) {
      return {
        success: false,
        error: errors.length > 0 ? errors.join("; ") : "No valid assignments found",
      };
    }

    return {
      success: true,
      count: successCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error("Error saving assignments:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save assignments",
    };
  }
}

