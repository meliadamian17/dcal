"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, AlertCircle, FileCode2, X } from "lucide-react";
import { ReviewAssignmentsModal } from "./ReviewAssignmentsModal";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExtractedData {
  course: string;
  assignments: Array<{
    name: string;
    description?: string;
    due_date: string;
    due_time?: string | null;
  }>;
}

type ProgressStage = "idle" | "uploading" | "analyzing" | "extracting" | "validating" | "complete" | "error";

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStage, setProgressStage] = useState<ProgressStage>("idle");
  const [progressMessage, setProgressMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const processFileWithStreaming = useCallback(async (file: File) => {
    setIsProcessing(true);
    setProgressStage("uploading");
    setProgressMessage("Preparing file...");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/extract", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.stage === "error") {
                setProgressStage("error");
                setError(data.error || "An error occurred during extraction");
                setIsProcessing(false);
                return;
              }

              if (data.stage === "complete") {
                setProgressStage("complete");
                setProgressMessage(data.message || "Extraction complete!");
                setExtractedData(data.data);
                setIsProcessing(false);
                // Open review modal
                setShowReviewModal(true);
                return;
              }

              setProgressStage(data.stage);
              setProgressMessage(data.message || "");
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }
    } catch (err) {
      setProgressStage("error");
      setError(err instanceof Error ? err.message : "Failed to process file");
      setIsProcessing(false);
    }
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      // Process first file only for now
      await processFileWithStreaming(acceptedFiles[0]);
    },
    [processFileWithStreaming]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    disabled: isProcessing,
  });

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
      setTimeout(() => {
        setProgressStage("idle");
        setProgressMessage("");
        setError(null);
        setExtractedData(null);
      }, 200);
    }
  };

  const handleReviewClose = () => {
    setShowReviewModal(false);
    handleClose();
  };

  const getProgressLabel = () => {
    switch (progressStage) {
      case "uploading":
        return "Uploading PDF...";
      case "analyzing":
        return "Analyzing syllabus...";
      case "extracting":
        return "Extracting assignments...";
      case "validating":
        return "Validating data...";
      case "complete":
        return "Complete!";
      case "error":
        return "Error";
      default:
        return "Processing...";
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
              background: "rgba(0,0,0,0.85)",
              backdropFilter: "blur(20px)",
            }}
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                background: "rgba(15, 15, 20, 0.98)",
                borderRadius: "20px",
                width: "100%",
                maxWidth: "520px",
                position: "relative",
                border: "1px solid rgba(255,255,255,0.1)",
                overflow: "hidden",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Gradient top border */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "3px",
                  background:
                    "linear-gradient(to right, #22d3ee, transparent, #a855f7)",
                }}
              />

              <div style={{ padding: "24px" }}>
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: "24px",
                  }}
                >
                  <div>
                    <h2
                      style={{
                        fontSize: "20px",
                        fontWeight: "bold",
                        color: "#fff",
                        margin: 0,
                      }}
                    >
                      Import Course Data
                    </h2>
                    <p
                      style={{
                        color: "#71717a",
                        fontSize: "14px",
                        marginTop: "4px",
                      }}
                    >
                      Upload your syllabus PDF to extract assignments
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={isProcessing}
                    style={{
                      padding: "8px",
                      borderRadius: "8px",
                      background: "transparent",
                      border: "none",
                      color: "#a1a1aa",
                      cursor: isProcessing ? "not-allowed" : "pointer",
                      opacity: isProcessing ? 0.5 : 1,
                    }}
                  >
                    <X style={{ width: "20px", height: "20px" }} />
                  </button>
                </div>

                {/* Dropzone */}
                {!isProcessing && (
                  <div
                    {...getRootProps()}
                    style={{
                      border: `2px dashed ${
                        isDragActive ? "#22d3ee" : "rgba(255,255,255,0.1)"
                      }`,
                      borderRadius: "16px",
                      padding: "40px",
                      textAlign: "center",
                      cursor: isProcessing ? "not-allowed" : "pointer",
                      background: isDragActive
                        ? "rgba(34,211,238,0.05)"
                        : "transparent",
                      transition: "all 0.2s",
                      opacity: isProcessing ? 0.5 : 1,
                    }}
                  >
                    <input {...getInputProps()} />

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "16px",
                      }}
                    >
                      <div
                        style={{
                          padding: "16px",
                          borderRadius: "16px",
                          background: isDragActive
                            ? "rgba(34,211,238,0.2)"
                            : "rgba(255,255,255,0.05)",
                        }}
                      >
                        <Upload
                          style={{
                            width: "32px",
                            height: "32px",
                            color: isDragActive ? "#22d3ee" : "#a1a1aa",
                          }}
                        />
                      </div>

                      {isDragActive ? (
                        <p
                          style={{
                            color: "#22d3ee",
                            fontWeight: 600,
                            margin: 0,
                          }}
                        >
                          Drop files here...
                        </p>
                      ) : (
                        <div>
                          <p
                            style={{
                              fontSize: "18px",
                              fontWeight: 600,
                              color: "#fff",
                              margin: 0,
                            }}
                          >
                            Drag & drop PDF files
                          </p>
                          <p
                            style={{
                              fontSize: "14px",
                              color: "#71717a",
                              marginTop: "4px",
                            }}
                          >
                            or click to browse your files
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Progress Display */}
                <AnimatePresence mode="wait">
                  {isProcessing && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      style={{
                        marginTop: "16px",
                        padding: "20px",
                        background: "rgba(34,211,238,0.1)",
                        border: "1px solid rgba(34,211,238,0.2)",
                        borderRadius: "12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          marginBottom: "12px",
                        }}
                      >
                        <div
                          style={{
                            width: "20px",
                            height: "20px",
                            border: "2px solid #22d3ee",
                            borderTopColor: "transparent",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                          }}
                        />
                        <span
                          style={{
                            fontWeight: 600,
                            color: "#22d3ee",
                            fontSize: "16px",
                          }}
                        >
                          {getProgressLabel()}
                        </span>
                      </div>
                      {progressMessage && (
                        <p
                          style={{
                            color: "#a1a1aa",
                            fontSize: "14px",
                            margin: 0,
                            paddingLeft: "32px",
                          }}
                        >
                          {progressMessage}
                        </p>
                      )}
                    </motion.div>
                  )}

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      style={{
                        marginTop: "16px",
                        padding: "16px",
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                        background: "rgba(239,68,68,0.1)",
                        color: "#ef4444",
                        border: "1px solid rgba(239,68,68,0.2)",
                      }}
                    >
                      <AlertCircle
                        style={{
                          width: "20px",
                          height: "20px",
                          flexShrink: 0,
                          marginTop: "2px",
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            fontWeight: 600,
                            margin: "0 0 4px 0",
                            fontSize: "14px",
                          }}
                        >
                          Extraction Failed
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "13px",
                            whiteSpace: "pre-wrap",
                            lineHeight: 1.5,
                          }}
                        >
                          {error}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Format Guide */}
                {!isProcessing && !error && (
                  <div style={{ marginTop: "24px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "#71717a",
                        marginBottom: "12px",
                      }}
                    >
                      <FileCode2
                        style={{ width: "16px", height: "16px" }}
                      />
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Expected Format
                      </span>
                    </div>
                    <div
                      style={{
                        background: "rgba(0,0,0,0.4)",
                        borderRadius: "12px",
                        padding: "16px",
                        border: "1px solid rgba(255,255,255,0.06)",
                        overflowX: "auto",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#a1a1aa",
                          lineHeight: 1.6,
                          margin: 0,
                        }}
                      >
                        <p style={{ margin: "0 0 8px 0" }}>
                          Upload a syllabus PDF and our AI will automatically
                          extract:
                        </p>
                        <ul
                          style={{
                            margin: 0,
                            paddingLeft: "20px",
                            listStyle: "disc",
                          }}
                        >
                          <li>Course name</li>
                          <li>All assignments with due dates</li>
                          <li>Assignment descriptions</li>
                        </ul>
                        <p
                          style={{
                            margin: "12px 0 0 0",
                            fontSize: "11px",
                            color: "#71717a",
                          }}
                        >
                          Powered by Gemini 2.5 Flash
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Close Button */}
                {!isProcessing && (
                  <button
                    onClick={handleClose}
                    style={{
                      marginTop: "24px",
                      width: "100%",
                      padding: "14px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      color: "#fff",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      {extractedData && (
        <ReviewAssignmentsModal
          isOpen={showReviewModal}
          onClose={handleReviewClose}
          courseName={extractedData.course}
          assignments={extractedData.assignments}
          onSuccess={() => {
            setShowReviewModal(false);
            handleClose();
          }}
        />
      )}
    </>
  );
}
