import { google } from "@ai-sdk/google";
import { streamText, Output } from "ai";
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
 * Sends a progress update via SSE
 */
function sendProgress(
  controller: ReadableStreamDefaultController,
  stage: string,
  message?: string,
  partialData?: Partial<SyllabusStructure>
) {
  const data: {
    stage: string;
    message?: string;
    partialData?: Partial<SyllabusStructure>;
    timestamp: number;
  } = { stage, timestamp: Date.now() };
  
  if (message) {
    data.message = message;
  }
  
  if (partialData) {
    data.partialData = partialData;
  }
  
  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
}

/**
 * Streams extraction of syllabus data from AI response
 */
async function streamExtractSyllabusData(
  base64: string,
  mimeType: string,
  sendProgressUpdate: (
    stage: string,
    message?: string,
    partialData?: Partial<SyllabusStructure>
  ) => void,
  controller: ReadableStreamDefaultController
): Promise<{ success: true; data: SyllabusStructure } | { success: false; error: string }> {
  const prompt = `You are a syllabus parser. Extract course information and all assignments from this PDF document.

Extract:
1. The course name/code
2. All assignments with their:
   - Name/title (required)
   - Description (optional)
   - Due date (required, in YYYY-MM-DD format)
   - Due time (optional, in HH:MM 24-hour format, or null if not specified)

Be thorough and extract ALL assignments mentioned in the syllabus, including those in schedules, calendars, or assignment sections.
If an assignment is not mentioned in the syllabus, do not include it in the output.
If there are assignments that are grouped together but have separate dates, include them as separate assignments.
Include exams, quizzes, in-tutorial assessments, etc.`;

  try {
    sendProgressUpdate("analyzing", "Sending PDF to AI for analysis...");

    const startTime = Date.now();
    console.log("Starting Gemini API streaming call...");

    const result = streamText({
      model: google("gemini-2.5-flash"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "file",
              data: Buffer.from(base64, "base64"),
              mediaType: mimeType as "application/pdf",
            },
          ],
        },
      ],
      output: Output.object({
        name: "Syllabus",
        description: "Extracted course information and assignments from a syllabus document",
        schema: SyllabusSchema,
      }),
      onError({ error }) {
        console.error("Stream error:", error);
        sendProgressUpdate("error", `Stream error: ${error instanceof Error ? error.message : "Unknown error"}`);
      },
    });

    sendProgressUpdate("extracting", "Extracting assignments from syllabus...");

    let finalData: SyllabusStructure | null = null;

    // Stream the partial structured output
    for await (const partialObject of result.partialOutputStream) {
      const partial = partialObject as Partial<SyllabusStructure>;
      
      // Send partial updates to client
      sendProgressUpdate("extracting", "Parsing syllabus data...", partial);
      
      // Keep track of the latest partial data
      if (partial.course) {
        finalData = {
          course: partial.course,
          assignments: partial.assignments || [],
        } as SyllabusStructure;
      }
      
      if (partial.assignments && partial.assignments.length > 0) {
        finalData = {
          course: partial.course || finalData?.course || "",
          assignments: partial.assignments,
        } as SyllabusStructure;
      }
    }

    // Get the final validated output
    const textResult = await result;
    const finalOutput = (await textResult.output) as SyllabusStructure;

    console.log(`Gemini API streaming completed in ${Date.now() - startTime}ms`);
    console.log(`Parsed ${finalOutput.assignments.length} assignments for course: ${finalOutput.course}`);

    sendProgressUpdate("validating", "Validation complete");
    return { success: true, data: finalOutput };
  } catch (error) {
    console.error("Stream extraction error:", error);
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

        sendProgress(controller, "analyzing", "Sending to AI for analysis...");

        const result = await streamExtractSyllabusData(
          base64,
          mimeType,
          (stage, message, partialData) => {
            try {
              sendProgress(controller, stage, message, partialData);
            } catch (e) {
              console.error("Error sending progress:", e);
            }
          },
          controller
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

        // Send the final complete event with the data
        console.log("Sending complete event with", result.data.assignments.length, "assignments");
        const complete = JSON.stringify({
          stage: "complete",
          message: `Extracted ${result.data.assignments.length} assignment(s)`,
          data: result.data,
          timestamp: Date.now(),
        });
        controller.enqueue(encoder.encode(`data: ${complete}\n\n`));
        console.log("Complete event sent, closing stream");
        controller.close();
      } catch (error) {
        console.error("API route error:", error);
        const errorData = JSON.stringify({
          stage: "error",
          error: error instanceof Error ? error.message : "Unknown error occurred",
          timestamp: Date.now(),
        });
        try {
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        } catch (e) {
          console.error("Error sending error message:", e);
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
