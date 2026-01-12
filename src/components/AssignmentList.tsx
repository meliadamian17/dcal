"use client";

import { useState, useMemo, useOptimistic, startTransition } from "react";
import { format, isPast, isToday, isWithinInterval, parseISO } from "date-fns";
import {
  Clock,
  BookOpen,
  ChevronDown,
  Check,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import { Assignment } from "@/db/schema";
import { toggleAssignmentSubmitted, deleteAssignment } from "@/actions/assignment";
import { AddAssignmentModal } from "./AddAssignmentModal";
import { getCourseColor } from "@/lib/colors";

interface AssignmentListProps {
  assignments: Assignment[];
}

const ITEMS_PER_PAGE = 5;

export function AssignmentList({ assignments }: AssignmentListProps) {
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [optimisticAssignments, setOptimisticAssignment] = useOptimistic(
    assignments,
    (state, action: { type: "toggle" | "delete"; id: string }) => {
      if (action.type === "toggle") {
        return state.map((a) => (a.id === action.id ? { ...a, submitted: !a.submitted } : a));
      }
      if (action.type === "delete") {
        return state.filter((a) => a.id !== action.id);
      }
      return state;
    }
  );

  const handleToggleSubmitted = (assignmentId: string) => {
    startTransition(async () => {
      setOptimisticAssignment({ type: "toggle", id: assignmentId });
      await toggleAssignmentSubmitted(assignmentId);
    });
  };

  const handleDeleteAssignment = (assignmentId: string) => {
    startTransition(async () => {
      setOptimisticAssignment({ type: "delete", id: assignmentId });
      await deleteAssignment(assignmentId);
    });
  };

  // Get unique courses
  const courses = useMemo(() => {
    const courseSet = new Set(optimisticAssignments.map((a) => a.courseName));
    return Array.from(courseSet).sort();
  }, [optimisticAssignments]);

  // Initialize selected courses to all on first render
  useMemo(() => {
    if (selectedCourses.size === 0 && courses.length > 0) {
      setSelectedCourses(new Set(courses));
      setExpandedCourses(new Set(courses));
    }
  }, [courses, selectedCourses.size]);

  // Filter assignments
  const filteredAssignments = useMemo(() => {
    return optimisticAssignments
      .filter((a) => {
        // Course filter
        if (!selectedCourses.has(a.courseName)) {
          return false;
        }

        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesName = a.assignmentName.toLowerCase().includes(query);
          const matchesCourse = a.courseName.toLowerCase().includes(query);
          const matchesDescription = a.description?.toLowerCase().includes(query);
          if (!matchesName && !matchesCourse && !matchesDescription) {
            return false;
          }
        }

        // Date range filter
        if (startDate || endDate) {
          const dueDate = new Date(a.dueDateTime);
          if (startDate && endDate) {
            const start = parseISO(startDate);
            const end = parseISO(endDate);
            end.setHours(23, 59, 59, 999);
            if (!isWithinInterval(dueDate, { start, end })) {
              return false;
            }
          } else if (startDate) {
            const start = parseISO(startDate);
            if (dueDate < start) {
              return false;
            }
          } else if (endDate) {
            const end = parseISO(endDate);
            end.setHours(23, 59, 59, 999);
            if (dueDate > end) {
              return false;
            }
          }
        }

        return true;
      })
      .sort((a, b) => new Date(a.dueDateTime).getTime() - new Date(b.dueDateTime).getTime());
  }, [optimisticAssignments, selectedCourses, searchQuery, startDate, endDate]);

  // Group filtered assignments by course
  const assignmentsByCourse = useMemo(() => {
    const grouped: Record<string, Assignment[]> = {};
    for (const assignment of filteredAssignments) {
      if (!grouped[assignment.courseName]) {
        grouped[assignment.courseName] = [];
      }
      grouped[assignment.courseName].push(assignment);
    }
    return grouped;
  }, [filteredAssignments]);

  // Pagination
  const totalPages = Math.ceil(filteredAssignments.length / ITEMS_PER_PAGE);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, startDate, endDate, selectedCourses]);

  const toggleCourse = (course: string) => {
    const newSelected = new Set(selectedCourses);
    if (newSelected.has(course)) {
      newSelected.delete(course);
    } else {
      newSelected.add(course);
    }
    setSelectedCourses(newSelected);
  };

  const toggleExpanded = (course: string) => {
    const newExpanded = new Set(expandedCourses);
    if (newExpanded.has(course)) {
      newExpanded.delete(course);
    } else {
      newExpanded.add(course);
    }
    setExpandedCourses(newExpanded);
  };

  const selectAll = () => setSelectedCourses(new Set(courses));
  const selectNone = () => setSelectedCourses(new Set());

  const clearFilters = () => {
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setSelectedCourses(new Set(courses));
    setShowDateFilter(false);
  };

  const hasActiveFilters = searchQuery || startDate || endDate || selectedCourses.size !== courses.length;


  const cardStyle: React.CSSProperties = {
    background: "rgba(20, 20, 28, 0.9)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "16px",
  };

  const inputStyle: React.CSSProperties = {
    height: "40px",
    padding: "0 12px",
    backgroundColor: "rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  };

  const buttonStyle: React.CSSProperties = {
    height: "40px",
    padding: "0 14px",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#a1a1aa",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s ease",
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          marginBottom: "16px",
          paddingLeft: "4px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "4px",
              height: "24px",
              borderRadius: "999px",
              background: "linear-gradient(to bottom, #a855f7, #ec4899)",
            }}
          />
          <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#fff", margin: 0 }}>Assignments</h2>
          <span
            style={{
              fontSize: "12px",
              color: "#71717a",
              background: "rgba(255,255,255,0.05)",
              padding: "4px 8px",
              borderRadius: "999px",
              marginLeft: "8px",
            }}
          >
            {filteredAssignments.length} total
          </span>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          type="button"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "linear-gradient(135deg, rgba(168,85,247,0.3), rgba(236,72,153,0.3))";
            e.currentTarget.style.borderColor = "rgba(168,85,247,0.5)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(236,72,153,0.2))";
            e.currentTarget.style.borderColor = "rgba(168,85,247,0.3)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
          style={{
            ...buttonStyle,
            background: "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(236,72,153,0.2))",
            border: "1px solid rgba(168,85,247,0.3)",
            color: "#fff",
          }}
        >
          <Plus style={{ width: "16px", height: "16px" }} />
          Add Assignment
        </button>
      </div>

      {/* Filters */}
      <div style={{ ...cardStyle, padding: "16px", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "1", minWidth: "180px" }}>
            <Search
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "16px",
                height: "16px",
                color: "#71717a",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assignments..."
              style={{ ...inputStyle, width: "100%", paddingLeft: "38px" }}
            />
          </div>

          {/* Date Range Toggle */}
          <button
            type="button"
            onClick={() => setShowDateFilter(!showDateFilter)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = startDate || endDate ? "rgba(168,85,247,0.25)" : "rgba(255,255,255,0.1)";
              e.currentTarget.style.borderColor = startDate || endDate ? "rgba(168,85,247,0.4)" : "rgba(255,255,255,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = startDate || endDate ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.05)";
              e.currentTarget.style.borderColor = startDate || endDate ? "rgba(168,85,247,0.3)" : "rgba(255,255,255,0.1)";
            }}
            style={{
              ...buttonStyle,
              background: startDate || endDate ? "rgba(168,85,247,0.15)" : buttonStyle.background,
              borderColor: startDate || endDate ? "rgba(168,85,247,0.3)" : "rgba(255,255,255,0.1)",
              color: startDate || endDate ? "#a855f7" : "#a1a1aa",
            }}
          >
            <Calendar style={{ width: "16px", height: "16px" }} />
            {startDate || endDate ? `${startDate || "..."} - ${endDate || "..."}` : "Date Range"}
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                e.currentTarget.style.color = "#a1a1aa";
              }}
              style={buttonStyle}
            >
              <X style={{ width: "14px", height: "14px" }} />
              Clear
            </button>
          )}
        </div>

        {/* Date Range Inputs */}
        {showDateFilter && (
          <div
            style={{
              display: "flex",
              gap: "10px",
              padding: "12px",
              background: "rgba(0,0,0,0.2)",
              borderRadius: "10px",
              marginBottom: "12px",
            }}
          >
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "11px", color: "#71717a", marginBottom: "6px", textTransform: "uppercase" }}>
                From
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ ...inputStyle, width: "100%" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "11px", color: "#71717a", marginBottom: "6px", textTransform: "uppercase" }}>
                To
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ ...inputStyle, width: "100%" }}
              />
            </div>
          </div>
        )}

        {/* Course Filter */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#71717a",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Filter by Course
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={selectAll}
                type="button"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.color = "#a1a1aa";
                }}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#a1a1aa",
                  fontSize: "11px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                All
              </button>
              <button
                onClick={selectNone}
                type="button"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.color = "#a1a1aa";
                }}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#a1a1aa",
                  fontSize: "11px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                None
              </button>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {courses.map((course) => {
              const color = getCourseColor(course);
              const isSelected = selectedCourses.has(course);
              return (
                <button
                  key={course}
                  onClick={() => toggleCourse(course)}
                  type="button"
                  onMouseEnter={(e) => {
                    if (isSelected) {
                      e.currentTarget.style.background = color.bg.replace("0.15)", "0.25)");
                    } else {
                      e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isSelected) {
                      e.currentTarget.style.background = color.bg;
                    } else {
                      e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    background: isSelected ? color.bg : "rgba(255,255,255,0.02)",
                    border: `1px solid ${isSelected ? color.border : "rgba(255,255,255,0.08)"}`,
                    color: isSelected ? color.text : "#71717a",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {isSelected && <Check style={{ width: "12px", height: "12px" }} />}
                  <span style={{ maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {course}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Assignments by Course */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {Object.entries(assignmentsByCourse).map(([course, courseAssignments]) => {
          const color = getCourseColor(course);
          const isExpanded = expandedCourses.has(course);

          return (
            <div key={course} style={{ ...cardStyle, overflow: "hidden" }}>
              {/* Course Header */}
              <button
                onClick={() => toggleExpanded(course)}
                type="button"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px",
                  background: "transparent",
                  border: "none",
                  borderLeft: `4px solid ${color.border}`,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <BookOpen style={{ width: "18px", height: "18px", color: color.text }} />
                  <div>
                    <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#fff", margin: 0 }}>{course}</h3>
                    <p style={{ fontSize: "12px", color: "#71717a", margin: "2px 0 0 0" }}>
                      {courseAssignments.length} assignment{courseAssignments.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <ChevronDown
                  style={{
                    width: "18px",
                    height: "18px",
                    color: "#71717a",
                    transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                />
              </button>

              {/* Assignments List */}
              {isExpanded && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {courseAssignments.map((assignment) => {
                      const dueDate = new Date(assignment.dueDateTime);
                      const isOverdue = isPast(dueDate) && !isToday(dueDate);
                      const isDueToday = isToday(dueDate);

                      return (
                        <div
                          key={assignment.id}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            padding: "12px",
                            background: assignment.submitted ? "rgba(16,185,129,0.05)" : "rgba(255,255,255,0.02)",
                            borderRadius: "10px",
                            border: assignment.submitted
                              ? "1px solid rgba(16,185,129,0.2)"
                              : "1px solid rgba(255,255,255,0.04)",
                            gap: "12px",
                          }}
                        >
                          {/* Submit Toggle Button */}
                          <button
                            onClick={() => handleToggleSubmitted(assignment.id)}
                            type="button"
                            onMouseEnter={(e) => {
                              if (!assignment.submitted) {
                                e.currentTarget.style.borderColor = "rgba(16,185,129,0.5)";
                                e.currentTarget.style.background = "rgba(16,185,129,0.1)";
                              } else {
                                e.currentTarget.style.background = "#0d9668";
                              }
                              e.currentTarget.style.transform = "scale(1.1)";
                            }}
                            onMouseLeave={(e) => {
                              if (!assignment.submitted) {
                                e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                                e.currentTarget.style.background = "transparent";
                              } else {
                                e.currentTarget.style.background = "#10b981";
                              }
                              e.currentTarget.style.transform = "scale(1)";
                            }}
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "6px",
                              border: assignment.submitted ? "2px solid #10b981" : "2px solid rgba(255,255,255,0.2)",
                              background: assignment.submitted ? "#10b981" : "transparent",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              transition: "all 0.15s ease",
                            }}
                            title={assignment.submitted ? "Mark as not done" : "Mark as done"}
                          >
                            {assignment.submitted && <Check style={{ width: "16px", height: "16px", color: "#fff" }} />}
                          </button>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4
                              style={{
                                fontSize: "13px",
                                fontWeight: 600,
                                color: assignment.submitted ? "rgba(255,255,255,0.6)" : "#fff",
                                margin: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                textDecoration: assignment.submitted ? "line-through" : "none",
                              }}
                            >
                              {assignment.assignmentName}
                            </h4>
                            {assignment.description && (
                              <p
                                style={{
                                  fontSize: "12px",
                                  color: "#71717a",
                                  margin: "4px 0 0 0",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                }}
                              >
                                {assignment.description}
                              </p>
                            )}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
                            {assignment.submitted ? (
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  padding: "3px 8px",
                                  borderRadius: "999px",
                                  background: "rgba(16,185,129,0.2)",
                                  color: "#10b981",
                                }}
                              >
                                SUBMITTED
                              </span>
                            ) : (
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  padding: "3px 8px",
                                  borderRadius: "999px",
                                  background: isOverdue
                                    ? "rgba(239,68,68,0.2)"
                                    : isDueToday
                                      ? "rgba(34,211,238,0.2)"
                                      : "rgba(255,255,255,0.05)",
                                  color: isOverdue ? "#ef4444" : isDueToday ? "#22d3ee" : "#a1a1aa",
                                }}
                              >
                                {isDueToday ? "TODAY" : format(dueDate, "MMM d, yyyy")}
                              </span>
                            )}
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: "10px", color: "#52525b", display: "flex", alignItems: "center", gap: "4px" }}>
                                <Clock style={{ width: "10px", height: "10px" }} />
                                {format(dueDate, "h:mm a")}
                              </span>
                              <button
                                onClick={() => handleDeleteAssignment(assignment.id)}
                                type="button"
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "rgba(239,68,68,0.2)";
                                  e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)";
                                  e.currentTarget.style.transform = "scale(1.1)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                                  e.currentTarget.style.borderColor = "rgba(239,68,68,0.2)";
                                  e.currentTarget.style.transform = "scale(1)";
                                }}
                                style={{
                                  padding: "4px",
                                  borderRadius: "4px",
                                  background: "rgba(239,68,68,0.1)",
                                  border: "1px solid rgba(239,68,68,0.2)",
                                  color: "#ef4444",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  transition: "all 0.15s ease",
                                }}
                                title="Delete assignment"
                              >
                                <Trash2 style={{ width: "12px", height: "12px" }} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            ...cardStyle,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            marginTop: "12px",
          }}
        >
          <span style={{ fontSize: "12px", color: "#71717a" }}>
            Page {currentPage} of {totalPages}
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              onMouseEnter={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                  e.currentTarget.style.color = "#fff";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                e.currentTarget.style.color = "#a1a1aa";
              }}
              style={{
                ...buttonStyle,
                height: "32px",
                padding: "0 10px",
                opacity: currentPage === 1 ? 0.4 : 1,
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
              }}
            >
              <ChevronLeft style={{ width: "14px", height: "14px" }} />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              onMouseEnter={(e) => {
                if (currentPage !== totalPages) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                  e.currentTarget.style.color = "#fff";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                e.currentTarget.style.color = "#a1a1aa";
              }}
              style={{
                ...buttonStyle,
                height: "32px",
                padding: "0 10px",
                opacity: currentPage === totalPages ? 0.4 : 1,
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              }}
            >
              <ChevronRight style={{ width: "14px", height: "14px" }} />
            </button>
          </div>
        </div>
      )}

      {filteredAssignments.length === 0 && courses.length > 0 && (
        <div style={{ ...cardStyle, padding: "32px", textAlign: "center" }}>
          <p style={{ color: "#71717a", margin: 0 }}>
            {hasActiveFilters ? "No assignments match your filters" : "No assignments found"}
          </p>
        </div>
      )}

      {courses.length === 0 && (
        <div style={{ ...cardStyle, padding: "48px 24px", textAlign: "center" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              margin: "0 auto 16px",
              borderRadius: "16px",
              background: "rgba(168,85,247,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BookOpen style={{ width: "28px", height: "28px", color: "#a855f7" }} />
          </div>
          <h3 style={{ color: "#fff", fontSize: "16px", fontWeight: 600, margin: "0 0 8px 0" }}>
            No assignments yet
          </h3>
          <p style={{ color: "#71717a", fontSize: "14px", margin: 0 }}>
            Add your first assignment to get started
          </p>
        </div>
      )}

      <AddAssignmentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}
