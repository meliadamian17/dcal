"use server";

import { db } from "@/db";
import { assignments } from "@/db/schema";
import yaml from "js-yaml";
import { revalidatePath } from "next/cache";

interface YamlAssignment {
  name: string;
  description?: string;
  due_date: string;
  due_time?: string | null;
}

interface YamlStructure {
  course: string;
  assignments: YamlAssignment[];
}

export async function processYamlUpload(fileContent: string) {
  try {
    const data = yaml.load(fileContent) as YamlStructure;

    if (!data.course || !Array.isArray(data.assignments)) {
      return { success: false, error: "Invalid YAML structure" };
    }

    const courseName = data.course;
    let successCount = 0;

    for (const assignment of data.assignments) {
      // Handle null/undefined due_time by defaulting to 23:59 (end of day)
      const time = assignment.due_time || "23:59";
      const dateTimeString = `${assignment.due_date}T${time}`;
      const dueDateTime = new Date(dateTimeString);

      if (isNaN(dueDateTime.getTime())) {
        console.error(`Invalid date for assignment: ${assignment.name} (${dateTimeString})`);
        continue; // Skip invalid dates
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
    }

    revalidatePath("/");
    return { success: true, count: successCount };
  } catch (error) {
    console.error("Error processing YAML:", error);
    return { success: false, error: "Failed to process file" };
  }
}
