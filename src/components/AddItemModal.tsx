"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, BookOpen } from "lucide-react";
import { format } from "date-fns";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  onSelectEvent: () => void;
  onSelectAssignment: () => void;
}

export function AddItemModal({
  isOpen,
  onClose,
  selectedDate,
  onSelectEvent,
  onSelectAssignment,
}: AddItemModalProps) {
  return (
    <AnimatePresence>
      {isOpen && selectedDate && (
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
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            style={{
              background: "rgba(15, 15, 20, 0.98)",
              borderRadius: "20px",
              padding: "24px",
              width: "100%",
              maxWidth: "400px",
              position: "relative",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient top border */}
            <div
              style={{
                position: "absolute",
                top: "-1px",
                left: "-1px",
                right: "-1px",
                height: "3px",
                background: "linear-gradient(to right, #22d3ee, #a855f7, #ec4899)",
                borderRadius: "20px 20px 0 0",
              }}
            />

            {/* Close button */}
            <button
              onClick={onClose}
              type="button"
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                padding: "8px",
                borderRadius: "8px",
                background: "transparent",
                border: "none",
                color: "#a1a1aa",
                cursor: "pointer",
              }}
            >
              <X style={{ width: "20px", height: "20px" }} />
            </button>

            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "#fff", margin: "0 0 8px 0" }}>
                Add to {format(selectedDate, "MMMM d, yyyy")}
              </h3>
              <p style={{ color: "#71717a", fontSize: "14px", margin: 0 }}>
                What would you like to add?
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Event Option */}
              <button
                onClick={onSelectEvent}
                type="button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "16px",
                  borderRadius: "12px",
                  background: "rgba(34,211,238,0.05)",
                  border: "1px solid rgba(34,211,238,0.2)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s",
                }}
              >
                <div
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, rgba(34,211,238,0.2), rgba(16,185,129,0.2))",
                    border: "1px solid rgba(34,211,238,0.2)",
                  }}
                >
                  <Calendar style={{ width: "24px", height: "24px", color: "#22d3ee" }} />
                </div>
                <div>
                  <h4 style={{ fontSize: "16px", fontWeight: 600, color: "#fff", margin: "0 0 4px 0" }}>
                    Event
                  </h4>
                  <p style={{ fontSize: "13px", color: "#71717a", margin: 0 }}>
                    Create a custom event with tags
                  </p>
                </div>
              </button>

              {/* Assignment Option */}
              <button
                onClick={onSelectAssignment}
                type="button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "16px",
                  borderRadius: "12px",
                  background: "rgba(168,85,247,0.05)",
                  border: "1px solid rgba(168,85,247,0.2)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s",
                }}
              >
                <div
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(236,72,153,0.2))",
                    border: "1px solid rgba(168,85,247,0.2)",
                  }}
                >
                  <BookOpen style={{ width: "24px", height: "24px", color: "#a855f7" }} />
                </div>
                <div>
                  <h4 style={{ fontSize: "16px", fontWeight: 600, color: "#fff", margin: "0 0 4px 0" }}>
                    Assignment
                  </h4>
                  <p style={{ fontSize: "13px", color: "#71717a", margin: 0 }}>
                    Add a class assignment with due date
                  </p>
                </div>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

