import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { z } from "zod";
import { NextRequest } from "next/server";

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
 * Sends a progress update via SSE
 */
function sendProgress(controller: ReadableStreamDefaultController, stage: string, message?: string) {
  const data = JSON.stringify({ stage, message, timestamp: Date.now() });
  controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
}

/**
 * Attempts to extract and validate syllabus data from AI response
 */
async function extractSyllabusData(
  base64: string,
  mimeType: string,
  sendProgressUpdate: (stage: string, message?: string) => void,
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
    sendProgressUpdate("analyzing", retryCount === 0 ? "Sending PDF to AI for analysis..." : "Retrying extraction...");

    const { text, finishReason } = await generateText({
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

    sendProgressUpdate("extracting", "Processing AI response...");

    let jsonText = text.trim();
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim();
    }

    sendProgressUpdate("validating", "Validating extracted data...");

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      if (retryCount === 0) {
        return extractSyllabusData(
          base64,
          mimeType,
          sendProgressUpdate,
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
            sendProgressUpdate,
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
        sendProgressUpdate,
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

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        sendProgress(controller, "uploading", "Receiving PDF file...");

        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
          const error = JSON.stringify({ 
            stage: "error", 
            error: "No file provided",
            timestamp: Date.now()
          });
          controller.enqueue(encoder.encode(`data: ${error}\n\n`));
          controller.close();
          return;
        }

        sendProgress(controller, "uploading", `Processing ${file.name}...`);

        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        const mimeType = file.type || "application/pdf";

        const result = await extractSyllabusData(
          base64,
          mimeType,
          (stage, message) => sendProgress(controller, stage, message)
        );

        if (!result.success) {
          const error = JSON.stringify({
            stage: "error",
            error: result.error,
            timestamp: Date.now(),
          });
          controller.enqueue(encoder.encode(`data: ${error}\n\n`));
          controller.close();
          return;
        }

        sendProgress(controller, "complete", `Extracted ${result.data.assignments.length} assignment(s)`);

        const complete = JSON.stringify({
          stage: "complete",
          data: result.data,
          timestamp: Date.now(),
        });
        controller.enqueue(encoder.encode(`data: ${complete}\n\n`));
        controller.close();
      } catch (error) {
        const errorData = JSON.stringify({
          stage: "error",
          error: error instanceof Error ? error.message : "Unknown error occurred",
          timestamp: Date.now(),
        });
        controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
