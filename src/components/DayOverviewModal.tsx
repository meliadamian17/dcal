"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, BookOpen, Calendar, Clock, Check, Trash2, Tag } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { Assignment, Event } from "@/db/schema";
import { toggleAssignmentSubmitted, deleteAssignment } from "@/actions/assignment";
import { deleteEvent } from "@/actions/event";
import { AddAssignmentModal } from "./AddAssignmentModal";
import { AddEventModal } from "./AddEventModal";
import { getCourseColor, eventColors, getTagColor } from "@/lib/colors";

interface DayOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  assignments: Assignment[];
  events: Event[];
}

export function DayOverviewModal({
  isOpen,
  onClose,
  selectedDate,
  assignments,
  events,
}: DayOverviewModalProps) {
  const [isAddAssignmentOpen, setIsAddAssignmentOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);

  if (!selectedDate) return null;

  // Filter assignments and events for the selected day
  const dayAssignments = assignments.filter((assignment) =>
    isSameDay(new Date(assignment.dueDateTime), selectedDate)
  );

  const dayEvents = events.filter((event) =>
    isSameDay(new Date(event.dateTime), selectedDate)
  );

  const handleToggleSubmitted = async (assignmentId: string) => {
    await toggleAssignmentSubmitted(assignmentId);
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    await deleteAssignment(assignmentId);
  };

  const handleDeleteEvent = async (eventId: string) => {
    await deleteEvent(eventId);
  };

  const handleAddAssignmentClose = () => {
    setIsAddAssignmentOpen(false);
  };

  const handleAddEventClose = () => {
    setIsAddEventOpen(false);
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
                  background: "linear-gradient(to right, #22d3ee, #a855f7, #ec4899)",
                  borderRadius: "20px 20px 0 0",
                }}
              />

              {/* Close button */}
              <button
                onClick={onClose}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#a1a1aa";
                }}
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
                  transition: "all 0.2s ease",
                  zIndex: 1,
                }}
              >
                <X style={{ width: "20px", height: "20px" }} />
              </button>

              {/* Header */}
              <div style={{ marginBottom: "24px", paddingRight: "32px" }}>
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#fff",
                    margin: "0 0 8px 0",
                  }}
                >
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </h2>
                <p style={{ color: "#71717a", fontSize: "14px", margin: 0 }}>
                  {dayAssignments.length + dayEvents.length} item
                  {dayAssignments.length + dayEvents.length !== 1 ? "s" : ""} scheduled
                </p>
              </div>

              {/* Content - Scrollable */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  paddingRight: "8px",
                  marginRight: "-8px",
                }}
                className="scrollbar-hide"
              >
                {/* Assignments Section */}
                <div style={{ marginBottom: "32px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "16px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
                      <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#fff", margin: 0 }}>
                        Assignments
                      </h3>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#71717a",
                          background: "rgba(255,255,255,0.05)",
                          padding: "4px 8px",
                          borderRadius: "999px",
                        }}
                      >
                        {dayAssignments.length}
                      </span>
                    </div>
                    <button
                      onClick={() => setIsAddAssignmentOpen(true)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(168,85,247,0.2)";
                        e.currentTarget.style.borderColor = "rgba(168,85,247,0.4)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(168,85,247,0.1)";
                        e.currentTarget.style.borderColor = "rgba(168,85,247,0.3)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        background: "rgba(168,85,247,0.1)",
                        border: "1px solid rgba(168,85,247,0.3)",
                        color: "#a855f7",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        fontSize: "13px",
                        fontWeight: 500,
                      }}
                    >
                      <Plus style={{ width: "14px", height: "14px" }} />
                      Add
                    </button>
                  </div>

                  {dayAssignments.length === 0 ? (
                    <div
                      style={{
                        padding: "24px",
                        textAlign: "center",
                        background: "rgba(255,255,255,0.02)",
                        borderRadius: "12px",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <p style={{ color: "#71717a", fontSize: "14px", margin: 0 }}>
                        No assignments for this day
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {dayAssignments.map((assignment) => {
                        const color = getCourseColor(assignment.courseName);
                        const baseBg = assignment.submitted
                          ? "rgba(16,185,129,0.15)"
                          : color.bg;
                        return (
                          <div
                            key={assignment.id}
                            style={{
                              padding: "16px",
                              borderRadius: "12px",
                              background: baseBg,
                              border: `1px solid ${assignment.submitted ? "#10b981" : color.border}`,
                              opacity: assignment.submitted ? 0.7 : 1,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                justifyContent: "space-between",
                                gap: "12px",
                                marginBottom: "12px",
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    marginBottom: "6px",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: "12px",
                                      fontWeight: 600,
                                      color: assignment.submitted
                                        ? "rgba(255,255,255,0.6)"
                                        : color.border,
                                      background: assignment.submitted
                                        ? "rgba(16,185,129,0.2)"
                                        : color.bg,
                                      padding: "4px 10px",
                                      borderRadius: "999px",
                                      textDecoration: assignment.submitted ? "line-through" : "none",
                                    }}
                                  >
                                    {assignment.courseName}
                                  </span>
                                  {assignment.submitted && (
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        color: "#10b981",
                                        fontSize: "11px",
                                        fontWeight: 600,
                                      }}
                                    >
                                      <Check style={{ width: "12px", height: "12px" }} />
                                      Submitted
                                    </div>
                                  )}
                                </div>
                                <h4
                                  style={{
                                    fontSize: "16px",
                                    fontWeight: 600,
                                    color: assignment.submitted
                                      ? "rgba(255,255,255,0.6)"
                                      : "#fff",
                                    margin: "0 0 4px 0",
                                    textDecoration: assignment.submitted ? "line-through" : "none",
                                  }}
                                >
                                  {assignment.assignmentName}
                                </h4>
                                {assignment.description && (
                                  <p
                                    style={{
                                      fontSize: "13px",
                                      color: assignment.submitted
                                        ? "rgba(255,255,255,0.4)"
                                        : "rgba(255,255,255,0.6)",
                                      margin: "8px 0 0 0",
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
                                    gap: "8px",
                                    marginTop: "12px",
                                    color: assignment.submitted
                                      ? "rgba(255,255,255,0.4)"
                                      : "rgba(255,255,255,0.5)",
                                    fontSize: "12px",
                                  }}
                                >
                                  <Clock style={{ width: "14px", height: "14px" }} />
                                  <span>
                                    Due: {format(new Date(assignment.dueDateTime), "h:mm a")}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                gap: "8px",
                                marginTop: "12px",
                              }}
                            >
                              <button
                                onClick={() => handleToggleSubmitted(assignment.id)}
                                onMouseEnter={(e) => {
                                  if (assignment.submitted) {
                                    e.currentTarget.style.background = "rgba(16,185,129,0.15)";
                                    e.currentTarget.style.borderColor = "rgba(16,185,129,0.4)";
                                  } else {
                                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (assignment.submitted) {
                                    e.currentTarget.style.background = "rgba(16,185,129,0.1)";
                                    e.currentTarget.style.borderColor = "rgba(16,185,129,0.3)";
                                  } else {
                                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                                  }
                                }}
                                style={{
                                  flex: 1,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  padding: "10px 14px",
                                  borderRadius: "8px",
                                  background: assignment.submitted
                                    ? "rgba(16,185,129,0.1)"
                                    : "rgba(255,255,255,0.03)",
                                  border: assignment.submitted
                                    ? "1px solid rgba(16,185,129,0.3)"
                                    : "1px solid rgba(255,255,255,0.06)",
                                  color: assignment.submitted ? "#10b981" : "#a1a1aa",
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                  fontSize: "13px",
                                  fontWeight: 500,
                                }}
                              >
                                <div
                                  style={{
                                    width: "18px",
                                    height: "18px",
                                    borderRadius: "4px",
                                    border: assignment.submitted
                                      ? "2px solid #10b981"
                                      : "2px solid rgba(255,255,255,0.2)",
                                    background: assignment.submitted ? "#10b981" : "transparent",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                  }}
                                >
                                  {assignment.submitted && (
                                    <Check style={{ width: "12px", height: "12px", color: "#fff" }} />
                                  )}
                                </div>
                                {assignment.submitted ? "Mark as incomplete" : "Mark as complete"}
                              </button>
                              <button
                                onClick={() => handleDeleteAssignment(assignment.id)}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "rgba(239,68,68,0.2)";
                                  e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                                  e.currentTarget.style.borderColor = "rgba(239,68,68,0.2)";
                                }}
                                style={{
                                  padding: "10px 14px",
                                  borderRadius: "8px",
                                  background: "rgba(239,68,68,0.1)",
                                  border: "1px solid rgba(239,68,68,0.2)",
                                  color: "#ef4444",
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                                title="Delete assignment"
                              >
                                <Trash2 style={{ width: "16px", height: "16px" }} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Events Section */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "16px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div
                        style={{
                          padding: "10px",
                          borderRadius: "10px",
                          background: eventColors.bg,
                          border: `1px solid ${eventColors.border}`,
                        }}
                      >
                        <Calendar style={{ width: "20px", height: "20px", color: eventColors.icon }} />
                      </div>
                      <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#fff", margin: 0 }}>
                        Events
                      </h3>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#71717a",
                          background: "rgba(255,255,255,0.05)",
                          padding: "4px 8px",
                          borderRadius: "999px",
                        }}
                      >
                        {dayEvents.length}
                      </span>
                    </div>
                    <button
                      onClick={() => setIsAddEventOpen(true)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = eventColors.bgHover;
                        e.currentTarget.style.borderColor = eventColors.border;
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = eventColors.bg;
                        e.currentTarget.style.borderColor = eventColors.border;
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        background: eventColors.bg,
                        border: `1px solid ${eventColors.border}`,
                        color: eventColors.text,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        fontSize: "13px",
                        fontWeight: 500,
                      }}
                    >
                      <Plus style={{ width: "14px", height: "14px" }} />
                      Add
                    </button>
                  </div>

                  {dayEvents.length === 0 ? (
                    <div
                      style={{
                        padding: "24px",
                        textAlign: "center",
                        background: "rgba(255,255,255,0.02)",
                        borderRadius: "12px",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <p style={{ color: "#71717a", fontSize: "14px", margin: 0 }}>
                        No events for this day
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {dayEvents.map((event) => {
                        return (
                          <div
                            key={event.id}
                            style={{
                              padding: "16px",
                              borderRadius: "12px",
                              background: eventColors.bg,
                              border: `1px solid ${eventColors.border}`,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                justifyContent: "space-between",
                                gap: "12px",
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <h4
                                  style={{
                                    fontSize: "16px",
                                    fontWeight: 600,
                                    color: "#fff",
                                    margin: "0 0 6px 0",
                                  }}
                                >
                                  {event.title}
                                </h4>
                                {event.description && (
                                  <p
                                    style={{
                                      fontSize: "13px",
                                      color: "rgba(255,255,255,0.6)",
                                      margin: "0 0 12px 0",
                                      lineHeight: 1.5,
                                    }}
                                  >
                                    {event.description}
                                  </p>
                                )}
                                {event.tags && event.tags.length > 0 && (
                                  <div
                                    style={{
                                      display: "flex",
                                      flexWrap: "wrap",
                                      gap: "6px",
                                      marginBottom: "12px",
                                    }}
                                  >
                                    {event.tags.map((tag) => {
                                      const color = getTagColor(tag);
                                      return (
                                        <span
                                          key={tag}
                                          style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "4px",
                                            padding: "4px 10px",
                                            borderRadius: "999px",
                                            background: color.bg,
                                            border: `1px solid ${color.border}`,
                                            color: color.text,
                                            fontSize: "11px",
                                            fontWeight: 500,
                                          }}
                                        >
                                          <Tag style={{ width: "10px", height: "10px" }} />
                                          {tag}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    color: "rgba(255,255,255,0.5)",
                                    fontSize: "12px",
                                  }}
                                >
                                  <Clock style={{ width: "14px", height: "14px" }} />
                                  <span>
                                    {format(new Date(event.dateTime), "h:mm a")}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div style={{ marginTop: "12px" }}>
                              <button
                                onClick={() => handleDeleteEvent(event.id)}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "rgba(239,68,68,0.2)";
                                  e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                                  e.currentTarget.style.borderColor = "rgba(239,68,68,0.2)";
                                }}
                                style={{
                                  width: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "8px",
                                  padding: "10px 14px",
                                  borderRadius: "8px",
                                  background: "rgba(239,68,68,0.1)",
                                  border: "1px solid rgba(239,68,68,0.2)",
                                  color: "#ef4444",
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                  fontSize: "13px",
                                  fontWeight: 500,
                                }}
                              >
                                <Trash2 style={{ width: "16px", height: "16px" }} />
                                Delete Event
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Assignment Modal */}
      <AddAssignmentModal
        isOpen={isAddAssignmentOpen}
        onClose={handleAddAssignmentClose}
        initialDate={selectedDate}
      />

      {/* Add Event Modal */}
      <AddEventModal
        isOpen={isAddEventOpen}
        onClose={handleAddEventClose}
        initialDate={selectedDate}
      />
    </>
  );
}
