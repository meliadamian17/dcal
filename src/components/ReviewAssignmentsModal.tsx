"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Calendar, Clock, BookOpen } from "lucide-react";
import { saveSelectedAssignments } from "@/actions/upload";
import { format } from "date-fns";

interface ExtractedAssignment {
  name: string;
  description?: string;
  due_date: string;
  due_time?: string | null;
}

interface ReviewAssignmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseName: string;
  assignments: ExtractedAssignment[];
  onSuccess?: () => void;
}

export function ReviewAssignmentsModal({
  isOpen,
  onClose,
  courseName,
  assignments,
  onSuccess,
}: ReviewAssignmentsModalProps) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set(assignments.map((_, index) => index))
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-select all assignments when modal opens or assignments change
  useEffect(() => {
    if (isOpen && assignments.length > 0) {
      setSelectedIndices(new Set(assignments.map((_, index) => index)));
    }
  }, [isOpen, assignments]);

  const toggleSelection = useCallback((index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIndices(new Set(assignments.map((_, index) => index)));
  }, [assignments]);

  const deselectAll = useCallback(() => {
    setSelectedIndices(new Set());
  }, []);

  const handleSave = useCallback(async () => {
    if (selectedIndices.size === 0) {
      setError("Please select at least one assignment to save.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const selectedAssignments = Array.from(selectedIndices).map(
        (index) => assignments[index]
      );

      const result = await saveSelectedAssignments(courseName, selectedAssignments);

      if (result.success) {
        if (onSuccess) {
          onSuccess();
        }
        onClose();
        window.location.reload();
      } else {
        setError(result.error || "Failed to save assignments");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSaving(false);
    }
  }, [selectedIndices, assignments, courseName, onSuccess, onClose]);

  const handleClose = () => {
    if (!isSaving) {
      onClose();
      setSelectedIndices(new Set(assignments.map((_, index) => index)));
      setError(null);
    }
  };

  const formatDateTime = (date: string, time?: string | null) => {
    try {
      const timeStr = time || "23:59";
      const dateTime = new Date(`${date}T${timeStr}`);
      return format(dateTime, "MMM d, yyyy 'at' h:mm a");
    } catch {
      return `${date}${time ? ` at ${time}` : ""}`;
    }
  };

  return (
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
              maxWidth: "600px",
              maxHeight: "90vh",
              position: "relative",
              border: "1px solid rgba(255,255,255,0.1)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
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

            <div style={{ padding: "24px", display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: "20px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <h2
                    style={{
                      fontSize: "20px",
                      fontWeight: "bold",
                      color: "#fff",
                      margin: 0,
                    }}
                  >
                    Review Extracted Assignments
                  </h2>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "8px",
                    }}
                  >
                    <BookOpen
                      style={{ width: "16px", height: "16px", color: "#71717a" }}
                    />
                    <p
                      style={{
                        color: "#71717a",
                        fontSize: "14px",
                        margin: 0,
                      }}
                    >
                      {courseName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isSaving}
                  style={{
                    padding: "8px",
                    borderRadius: "8px",
                    background: "transparent",
                    border: "none",
                    color: "#a1a1aa",
                    cursor: isSaving ? "not-allowed" : "pointer",
                    opacity: isSaving ? 0.5 : 1,
                  }}
                >
                  <X style={{ width: "20px", height: "20px" }} />
                </button>
              </div>

              {/* Selection controls */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                  padding: "12px",
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: "12px",
                }}
              >
                <span
                  style={{
                    color: "#a1a1aa",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  {selectedIndices.size} of {assignments.length} selected
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={selectAll}
                    disabled={isSaving}
                    style={{
                      padding: "6px 12px",
                      background: "rgba(255,255,255,0.1)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: isSaving ? "not-allowed" : "pointer",
                      opacity: isSaving ? 0.5 : 1,
                    }}
                  >
                    Select All
                  </button>
                  <button
                    onClick={deselectAll}
                    disabled={isSaving}
                    style={{
                      padding: "6px 12px",
                      background: "rgba(255,255,255,0.1)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: isSaving ? "not-allowed" : "pointer",
                      opacity: isSaving ? 0.5 : 1,
                    }}
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "12px",
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: "12px",
                    color: "#ef4444",
                    fontSize: "14px",
                  }}
                >
                  {error}
                </div>
              )}

              {/* Assignments list */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  marginBottom: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {assignments.map((assignment, index) => {
                  const isSelected = selectedIndices.has(index);
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        padding: "16px",
                        background: isSelected
                          ? "rgba(34,211,238,0.1)"
                          : "rgba(255,255,255,0.05)",
                        border: `2px solid ${
                          isSelected
                            ? "rgba(34,211,238,0.3)"
                            : "rgba(255,255,255,0.1)"
                        }`,
                        borderRadius: "12px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onClick={() => !isSaving && toggleSelection(index)}
                      whileHover={{ scale: 1.01 }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "12px",
                        }}
                      >
                        <div
                          style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "4px",
                            border: `2px solid ${
                              isSelected ? "#22d3ee" : "rgba(255,255,255,0.3)"
                            }`,
                            background: isSelected
                              ? "#22d3ee"
                              : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            marginTop: "2px",
                          }}
                        >
                          {isSelected && (
                            <Check
                              style={{
                                width: "14px",
                                height: "14px",
                                color: "#fff",
                              }}
                            />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3
                            style={{
                              fontSize: "16px",
                              fontWeight: 600,
                              color: "#fff",
                              margin: "0 0 8px 0",
                            }}
                          >
                            {assignment.name}
                          </h3>
                          {assignment.description && (
                            <p
                              style={{
                                fontSize: "14px",
                                color: "#a1a1aa",
                                margin: "0 0 12px 0",
                                lineHeight: 1.5,
                              }}
                            >
                              {assignment.description}
                            </p>
                          )}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "16px",
                              flexWrap: "wrap",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                color: "#71717a",
                                fontSize: "13px",
                              }}
                            >
                              <Calendar
                                style={{ width: "14px", height: "14px" }}
                              />
                              <span>
                                {formatDateTime(
                                  assignment.due_date,
                                  assignment.due_time
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Action buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  paddingTop: "16px",
                  borderTop: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <button
                  onClick={handleClose}
                  disabled={isSaving}
                  style={{
                    flex: 1,
                    padding: "14px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#fff",
                    fontWeight: 600,
                    cursor: isSaving ? "not-allowed" : "pointer",
                    opacity: isSaving ? 0.5 : 1,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || selectedIndices.size === 0}
                  style={{
                    flex: 1,
                    padding: "14px",
                    background:
                      selectedIndices.size === 0
                        ? "rgba(255,255,255,0.1)"
                        : "linear-gradient(135deg, #22d3ee 0%, #a855f7 100%)",
                    border: "none",
                    borderRadius: "12px",
                    color: "#fff",
                    fontWeight: 600,
                    cursor:
                      isSaving || selectedIndices.size === 0
                        ? "not-allowed"
                        : "pointer",
                    opacity: isSaving || selectedIndices.size === 0 ? 0.5 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  {isSaving ? (
                    <>
                      <div
                        style={{
                          width: "16px",
                          height: "16px",
                          border: "2px solid rgba(255,255,255,0.3)",
                          borderTopColor: "#fff",
                          borderRadius: "50%",
                          animation: "spin 1s linear infinite",
                        }}
                      />
                      Saving...
                    </>
                  ) : (
                    `Save ${selectedIndices.size} Assignment${selectedIndices.size !== 1 ? "s" : ""}`
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
