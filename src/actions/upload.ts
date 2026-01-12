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
 * Attempts to extract and validate syllabus data from AI response
 */
async function extractSyllabusData(
  base64: string,
  mimeType: string,
  retryCount: number = 0,
  previousError?: string
): Promise<{ success: true; data: SyllabusStructure } | { success: false; error: string }> {
  const prompt = retryCount === 0
    ? `You are a syllabus parser. Extract course information and all assignments from this PDF document.

Extract:
1. The course name/code
2. All assignments with their:
   - Name/title (required)
   - Description (optional)
   - Due date (required, in YYYY-MM-DD format)
   - Due time (optional, in HH:MM 24-hour format, or null if not specified)

Be thorough and extract ALL assignments mentioned in the syllabus, including those in schedules, calendars, or assignment sections.
If an assignment is not mentioned in the syllabus, do not include it in the output.
If there are assignments that are grouped together but have seperate dates, include them as seperate assignments.
Include exams, quizzes, in tutorial assesments, etc.

CRITICAL: Return ONLY valid JSON, no markdown, no code blocks, no explanations. The JSON must match this exact structure:
{
  "course": "string (required)",
  "assignments": [
    {
      "name": "string (required)",
      "description": "string (optional, can be omitted)",
      "due_date": "YYYY-MM-DD (required)",
      "due_time": "HH:MM or null (optional)"
    }
  ]
}`
    : `The previous extraction failed with this error: ${previousError}

Please try again. Return ONLY valid JSON matching this exact structure:
{
  "course": "string (required)",
  "assignments": [
    {
      "name": "string (required)",
      "description": "string (optional, can be omitted)",
      "due_date": "YYYY-MM-DD (required)",
      "due_time": "HH:MM or null (optional)"
    }
  ]
}

Ensure all required fields are present and dates are in YYYY-MM-DD format.`;

  try {
    const { text } = await generateText({
      model: google("gemini-3-flash-preview"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image",
              image: `data:${mimeType};base64,${base64}`,
            },
          ],
        },
      ],
    });

    let jsonText = text.trim();
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim();
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      if (retryCount === 0) {
        return extractSyllabusData(
          base64,
          mimeType,
          1,
          `Invalid JSON format. The response was not valid JSON.`
        );
      }
      return {
        success: false,
        error: `The syllabus could not be parsed. The AI returned invalid JSON format.\n\nResponse received: ${text.substring(0, 200)}...`,
      };
    }

    try {
      const data = SyllabusSchema.parse(parsed) as SyllabusStructure;
      return { success: true, data };
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const errorMessage = formatValidationErrors(validationError);
        if (retryCount === 0) {
          return extractSyllabusData(
            base64,
            mimeType,
            1,
            `Validation failed:\n${errorMessage}`
          );
        }
        return {
          success: false,
          error: `The syllabus format is incorrect. Please ensure your syllabus contains:\n\n${errorMessage}\n\nRequired fields:\n- course: The course name or code\n- assignments: An array of assignments, each with:\n  - name: Assignment title (required)\n  - due_date: Due date in YYYY-MM-DD format (required)\n  - description: Assignment description (optional)\n  - due_time: Due time in HH:MM format or null (optional)`,
        };
      }
      throw validationError;
    }
  } catch (error) {
    if (retryCount === 0) {
      return extractSyllabusData(
        base64,
        mimeType,
        1,
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    }
    return {
      success: false,
      error: `Failed to process the syllabus: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
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

