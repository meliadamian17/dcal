"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, Plus, ChevronDown } from "lucide-react";
import { createAssignment, getUniqueCourses } from "@/actions/assignment";
import { format } from "date-fns";

interface AddAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date | null;
  existingCourses?: string[];
}

export function AddAssignmentModal({ isOpen, onClose, initialDate, existingCourses = [] }: AddAssignmentModalProps) {
  const [courseName, setCourseName] = useState("");
  const [isNewCourse, setIsNewCourse] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [assignmentName, setAssignmentName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("23:59");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<string[]>(existingCourses);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);

  // Fetch courses when modal opens
  useEffect(() => {
    if (isOpen) {
      getUniqueCourses().then(setCourses);
      if (initialDate) {
        setDate(format(initialDate, "yyyy-MM-dd"));
      }
    }
  }, [isOpen, initialDate]);

  const resetForm = () => {
    setCourseName("");
    setIsNewCourse(false);
    setNewCourseName("");
    setAssignmentName("");
    setDescription("");
    setDate("");
    setTime("23:59");
    setError(null);
    setShowCourseDropdown(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const finalCourseName = isNewCourse ? newCourseName.trim() : courseName;
      
      if (!finalCourseName) {
        setError("Please select or enter a course name");
        setIsSubmitting(false);
        return;
      }

      const dueDateTime = new Date(`${date}T${time || "23:59"}`);

      if (Number.isNaN(dueDateTime.getTime())) {
        setError("Invalid date or time");
        setIsSubmitting(false);
        return;
      }

      const result = await createAssignment({
        courseName: finalCourseName,
        assignmentName: assignmentName.trim(),
        description: description.trim() || null,
        dueDateTime,
      });

      if (result.success) {
        resetForm();
        onClose();
      } else {
        setError(result.error || "Failed to create assignment");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectCourse = (course: string) => {
    setCourseName(course);
    setIsNewCourse(false);
    setShowCourseDropdown(false);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: "44px",
    padding: "0 14px",
    backgroundColor: "rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "11px",
    fontWeight: 600,
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "8px",
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
              padding: "24px",
              width: "100%",
              maxWidth: "480px",
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
                background: "linear-gradient(to right, #a855f7, #ec4899, #f59e0b)",
                borderRadius: "20px 20px 0 0",
              }}
            />

            {/* Close button */}
            <button
              onClick={handleClose}
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
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <div
                  style={{
                    padding: "10px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(236,72,153,0.2))",
                    border: "1px solid rgba(168,85,247,0.2)",
                  }}
                >
                  <BookOpen style={{ width: "20px", height: "20px", color: "#a855f7" }} />
                </div>
                <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "#fff", margin: 0 }}>
                  Add Assignment
                </h3>
              </div>
              <p style={{ color: "#71717a", fontSize: "14px", margin: 0, paddingLeft: "52px" }}>
                Create a new assignment for a class
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Course Selection */}
              <div>
                <label style={labelStyle}>Course / Class</label>
                
                {/* Toggle between existing and new */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewCourse(false);
                      setShowCourseDropdown(false);
                    }}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: !isNewCourse ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${!isNewCourse ? "rgba(168,85,247,0.4)" : "rgba(255,255,255,0.08)"}`,
                      color: !isNewCourse ? "#a855f7" : "#71717a",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    Existing Class
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewCourse(true);
                      setCourseName("");
                      setShowCourseDropdown(false);
                    }}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: isNewCourse ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${isNewCourse ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.08)"}`,
                      color: isNewCourse ? "#10b981" : "#71717a",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    + New Class
                  </button>
                </div>

                {isNewCourse ? (
                  <input
                    type="text"
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    placeholder="Enter new class name (e.g., CSC101 Introduction to CS)"
                    required={isNewCourse}
                    style={inputStyle}
                  />
                ) : (
                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      onClick={() => setShowCourseDropdown(!showCourseDropdown)}
                      style={{
                        ...inputStyle,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span style={{ color: courseName ? "#fff" : "#52525b" }}>
                        {courseName || "Select a class..."}
                      </span>
                      <ChevronDown
                        style={{
                          width: "16px",
                          height: "16px",
                          color: "#71717a",
                          transform: showCourseDropdown ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.2s",
                        }}
                      />
                    </button>
                    
                    {showCourseDropdown && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          marginTop: "4px",
                          background: "rgba(20, 20, 28, 0.98)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "10px",
                          maxHeight: "200px",
                          overflowY: "auto",
                          zIndex: 10,
                        }}
                      >
                        {courses.length === 0 ? (
                          <div style={{ padding: "12px 14px", color: "#71717a", fontSize: "13px" }}>
                            No existing classes. Create a new one!
                          </div>
                        ) : (
                          courses.map((course) => (
                            <button
                              key={course}
                              type="button"
                              onClick={() => selectCourse(course)}
                              style={{
                                width: "100%",
                                padding: "12px 14px",
                                background: courseName === course ? "rgba(168,85,247,0.1)" : "transparent",
                                border: "none",
                                borderBottom: "1px solid rgba(255,255,255,0.05)",
                                color: "#fff",
                                fontSize: "13px",
                                textAlign: "left",
                                cursor: "pointer",
                              }}
                            >
                              {course}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Assignment Name */}
              <div>
                <label style={labelStyle}>Assignment Name</label>
                <input
                  type="text"
                  value={assignmentName}
                  onChange={(e) => setAssignmentName(e.target.value)}
                  placeholder="Enter assignment name"
                  required
                  style={inputStyle}
                />
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Assignment description..."
                  rows={3}
                  style={{
                    ...inputStyle,
                    height: "auto",
                    padding: "12px 14px",
                    resize: "none",
                  }}
                />
              </div>

              {/* Date and Time */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Due Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Due Time</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              {error && (
                <p
                  style={{
                    color: "#ef4444",
                    fontSize: "14px",
                    background: "rgba(239,68,68,0.1)",
                    padding: "10px 16px",
                    borderRadius: "10px",
                    border: "1px solid rgba(239,68,68,0.2)",
                    margin: 0,
                  }}
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  height: "48px",
                  borderRadius: "12px",
                  fontWeight: 600,
                  fontSize: "15px",
                  color: "#fff",
                  background: "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(236,72,153,0.2))",
                  border: "1px solid rgba(168,85,247,0.3)",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.6 : 1,
                }}
              >
                {isSubmitting ? "Creating..." : "Create Assignment"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

