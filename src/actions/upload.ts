"use server";

import { db } from "@/db";
import { assignments } from "@/db/schema";
import yaml from "js-yaml";
import { revalidatePath } from "next/cache";

interface YamlAssignment {
  name: string;
  description: string;
  due_date: string;
  due_time: string;
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

    for (const assignment of data.assignments) {
      // Combine date and time
      const dateTimeString = `${assignment.due_date}T${assignment.due_time}`;
      const dueDateTime = new Date(dateTimeString);

      if (isNaN(dueDateTime.getTime())) {
        console.error(`Invalid date for assignment: ${assignment.name}`);
        continue; // Skip invalid dates
      }

      await db
        .insert(assignments)
        .values({
          courseName,
          assignmentName: assignment.name,
          description: assignment.description,
          dueDateTime,
          notificationSent: false,
        })
        .onConflictDoUpdate({
          target: [assignments.courseName, assignments.assignmentName],
          set: {
            description: assignment.description,
            dueDateTime,
            notificationSent: false, // Reset notification if updated? Maybe.
          },
        });
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error processing YAML:", error);
    return { success: false, error: "Failed to process file" };
  }
}

