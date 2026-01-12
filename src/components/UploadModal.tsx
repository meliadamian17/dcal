"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, AlertCircle, FileCode2, X, Check } from "lucide-react";
import { ReviewAssignmentsModal } from "./ReviewAssignmentsModal";
import { useMutation } from "@tanstack/react-query";
import {
  uploadExtractSyllabus,
  type ExtractedSyllabusData,
  type SSEProgressEvent,
} from "@/lib/api";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ProgressStage = "idle" | "uploading" | "analyzing" | "extracting" | "validating" | "complete" | "error";

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [progressStage, setProgressStage] = useState<ProgressStage>("idle");
  const [progressMessage, setProgressMessage] = useState("");
  const [extractedData, setExtractedData] = useState<ExtractedSyllabusData | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const handleProgress = useCallback((event: SSEProgressEvent) => {
    console.log("Progress update:", event.stage, event.message, event.partialData);
    setProgressStage(event.stage);
    
    if (event.message) {
      setProgressMessage(event.message);
    }
    
    // Update with partial data as it streams in
    if (event.partialData) {
      const partial = event.partialData;
      if (partial.course || partial.assignments) {
        // Merge partial data with existing data
        setExtractedData((prev) => {
          const merged: ExtractedSyllabusData = {
            course: partial.course || prev?.course || "",
            assignments: partial.assignments || prev?.assignments || [],
          };
          
          // Update progress message with live count
          if (merged.assignments.length > 0) {
            setProgressMessage(
              `Found ${merged.assignments.length} assignment${merged.assignments.length === 1 ? "" : "s"}${merged.course ? ` for ${merged.course}` : ""}...`
            );
          }
          
          return merged;
        });
      }
    }
    
    if (event.stage === "error" && event.error) {
      setProgressMessage(event.error);
    }
    
    if (event.stage === "complete" && event.data) {
      setExtractedData(event.data);
      setProgressMessage(event.message || "Extraction complete!");
    }
  }, []);

  const mutation = useMutation({
    mutationFn: async (file: File): Promise<ExtractedSyllabusData> => {
      return uploadExtractSyllabus({
        file,
        onProgress: handleProgress,
      });
    },
    onSuccess: (data) => {
      setExtractedData(data);
      setProgressStage("complete");
      setTimeout(() => {
        setShowReviewModal(true);
      }, 300);
    },
    onError: (error) => {
      console.error("Upload error:", error);
      setProgressStage("error");
      setProgressMessage(error instanceof Error ? error.message : "Failed to process file. Please try again.");
    },
  });

  const processFileWithStreaming = useCallback(
    async (file: File) => {
      setProgressStage("uploading");
      setProgressMessage("Preparing file...");
      setExtractedData(null);
      mutation.mutate(file);
    },
    [mutation]
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      // Process first file only for now
      await processFileWithStreaming(acceptedFiles[0]);
    },
    [processFileWithStreaming]
  );

  const isProcessing = mutation.isPending;

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
      // Reset state after modal closes
      setTimeout(() => {
        setProgressStage("idle");
        setProgressMessage("");
        setExtractedData(null);
        setShowReviewModal(false);
        mutation.reset();
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
      <AnimatePresence mode="wait">
        {isOpen && !showReviewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
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
            onClick={isProcessing ? undefined : handleClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
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
                      transition={{ duration: 0.2 }}
                      style={{
                        marginTop: "16px",
                        padding: "20px",
                        background: progressStage === "complete" 
                          ? "rgba(16,185,129,0.1)" 
                          : "rgba(34,211,238,0.1)",
                        border: `1px solid ${progressStage === "complete" 
                          ? "rgba(16,185,129,0.2)" 
                          : "rgba(34,211,238,0.2)"}`,
                        borderRadius: "12px",
                        transition: "all 0.3s ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          marginBottom: progressMessage ? "12px" : 0,
                        }}
                      >
                        {progressStage === "complete" ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            style={{
                              width: "20px",
                              height: "20px",
                              background: "#10b981",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Check style={{ width: "12px", height: "12px", color: "#fff" }} />
                          </motion.div>
                        ) : (
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
                        )}
                        <span
                          style={{
                            fontWeight: 600,
                            color: progressStage === "complete" ? "#10b981" : "#22d3ee",
                            fontSize: "16px",
                            transition: "color 0.3s ease",
                          }}
                        >
                          {getProgressLabel()}
                        </span>
                      </div>
                      {progressMessage && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          style={{
                            color: "#a1a1aa",
                            fontSize: "14px",
                            margin: 0,
                            paddingLeft: "32px",
                          }}
                        >
                          {progressMessage}
                        </motion.p>
                      )}
                    </motion.div>
                  )}

                  {/* Live Preview of Assignments */}
                  {isProcessing && extractedData && extractedData.assignments.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        marginTop: "16px",
                        padding: "16px",
                        background: "rgba(34,211,238,0.05)",
                        border: "1px solid rgba(34,211,238,0.2)",
                        borderRadius: "12px",
                        maxHeight: "300px",
                        overflowY: "auto",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "12px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "#22d3ee",
                          }}
                        >
                          Live Preview
                        </span>
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#71717a",
                          }}
                        >
                          {extractedData.assignments.length} assignment
                          {extractedData.assignments.length !== 1 ? "s" : ""} found
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        {extractedData.assignments.map((assignment, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            style={{
                              padding: "10px 12px",
                              background: "rgba(255,255,255,0.05)",
                              borderRadius: "8px",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "13px",
                                fontWeight: 500,
                                color: "#fff",
                                marginBottom: "4px",
                              }}
                            >
                              {assignment.name}
                            </div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#71717a",
                              }}
                            >
                              Due: {assignment.due_date}
                              {assignment.due_time ? ` at ${assignment.due_time}` : ""}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {mutation.error && (
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
                          {mutation.error instanceof Error
                            ? mutation.error.message
                            : "Failed to process file. Please try again."}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Format Guide */}
                {!isProcessing && !mutation.error && (
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
