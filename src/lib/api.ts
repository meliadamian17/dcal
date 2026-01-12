/**
 * Type definitions for the upload/extract API
 */

export interface SSEProgressEvent {
  stage: "uploading" | "analyzing" | "extracting" | "validating" | "complete" | "error";
  message?: string;
  error?: string;
  data?: ExtractedSyllabusData;
  partialData?: Partial<ExtractedSyllabusData>;
  timestamp: number;
}

export interface ExtractedSyllabusData {
  course: string;
  assignments: Array<{
    name: string;
    description?: string;
    due_date: string;
    due_time?: string | null;
  }>;
}

export interface UploadExtractParams {
  file: File;
  onProgress?: (event: SSEProgressEvent) => void;
}

export interface UploadExtractResult {
  success: true;
  data: ExtractedSyllabusData;
}

export interface UploadExtractError {
  success: false;
  error: string;
}

export type UploadExtractResponse = UploadExtractResult | UploadExtractError;

/**
 * Uploads and extracts syllabus data from a PDF file
 * Returns a promise that resolves when the extraction is complete
 */
export async function uploadExtractSyllabus({
  file,
  onProgress,
}: UploadExtractParams): Promise<ExtractedSyllabusData> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload/extract", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body - server may have closed the connection");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let hasReceivedComplete = false;
  let extractedData: ExtractedSyllabusData | null = null;
  let error: string | null = null;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      // Process any remaining buffer
      if (buffer.trim()) {
        const lines = buffer.split("\n");
        for (const line of lines) {
          if (line.trim() && line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6)) as SSEProgressEvent;
              if (onProgress) {
                onProgress(data);
              }
              if (data.stage === "complete" && data.data) {
                extractedData = data.data;
                hasReceivedComplete = true;
              } else if (data.stage === "error") {
                error = data.error || "An error occurred during extraction";
              }
            } catch (e) {
              console.error("Error parsing final SSE data:", e, line);
            }
          }
        }
      }

      if (!hasReceivedComplete) {
        throw new Error(
          error ||
            "Stream ended unexpectedly. The extraction may have failed or timed out."
        );
      }

      if (extractedData) {
        return extractedData;
      }

      throw new Error("No data received from server");
    }

    const chunk = decoder.decode(value, { stream: true });
    buffer += chunk;

    // Split by double newline (SSE event separator) or single newline
    const events = buffer.split(/\n\n|\n/);
    buffer = events.pop() || "";

    for (const event of events) {
      const line = event.trim();
      if (line && line.startsWith("data: ")) {
        try {
          const jsonStr = line.slice(6);
          const data = JSON.parse(jsonStr) as SSEProgressEvent;

          if (onProgress) {
            onProgress(data);
          }

          if (data.stage === "error") {
            error = data.error || "An error occurred during extraction";
            throw new Error(error);
          }

          if (data.stage === "complete" && data.data) {
            extractedData = data.data;
            hasReceivedComplete = true;
            return extractedData;
          }
        } catch (e) {
          if (e instanceof Error && e.message !== error) {
            throw e;
          }
          console.error("Error parsing SSE data:", e, "Line:", line);
        }
      }
    }
  }
}
