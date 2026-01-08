"use client";

import { useState, useMemo, useOptimistic, startTransition } from "react";
import { format, isPast, isToday } from "date-fns";
import { Clock, BookOpen, ChevronDown, Check } from "lucide-react";
import { Assignment } from "@/db/schema";
import { toggleAssignmentSubmitted } from "@/actions/assignment";

interface AssignmentListProps {
  assignments: Assignment[];
}

export function AssignmentList({ assignments }: AssignmentListProps) {
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [optimisticAssignments, setOptimisticAssignment] = useOptimistic(
    assignments,
    (state, updatedId: string) =>
      state.map((a) =>
        a.id === updatedId ? { ...a, submitted: !a.submitted } : a
      )
  );

  const handleToggleSubmitted = (assignmentId: string) => {
    startTransition(async () => {
      setOptimisticAssignment(assignmentId);
      await toggleAssignmentSubmitted(assignmentId);
    });
  };

  // Get unique courses
  const courses = useMemo(() => {
    const courseSet = new Set(optimisticAssignments.map(a => a.courseName));
    return Array.from(courseSet).sort();
  }, [optimisticAssignments]);

  // Initialize selected courses to all on first render
  useMemo(() => {
    if (selectedCourses.size === 0 && courses.length > 0) {
      setSelectedCourses(new Set(courses));
      setExpandedCourses(new Set(courses));
    }
  }, [courses, selectedCourses.size]);

  // Filter and group assignments by course
  const filteredAssignments = useMemo(() => {
    return optimisticAssignments
      .filter(a => selectedCourses.has(a.courseName))
      .sort((a, b) => new Date(a.dueDateTime).getTime() - new Date(b.dueDateTime).getTime());
  }, [optimisticAssignments, selectedCourses]);

  const assignmentsByCourse = useMemo(() => {
    const grouped: Record<string, Assignment[]> = {};
    for (const course of courses) {
      if (selectedCourses.has(course)) {
        grouped[course] = optimisticAssignments
          .filter(a => a.courseName === course)
          .sort((a, b) => new Date(a.dueDateTime).getTime() - new Date(b.dueDateTime).getTime());
      }
    }
    return grouped;
  }, [optimisticAssignments, courses, selectedCourses]);

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

  // Get color based on course name
  const getColor = (courseName: string) => {
    const hash = courseName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      { border: '#22d3ee', bg: 'rgba(34,211,238,0.15)', text: '#22d3ee' },
      { border: '#a855f7', bg: 'rgba(168,85,247,0.15)', text: '#a855f7' },
      { border: '#10b981', bg: 'rgba(16,185,129,0.15)', text: '#10b981' },
      { border: '#ec4899', bg: 'rgba(236,72,153,0.15)', text: '#ec4899' },
    ];
    return colors[hash % colors.length];
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(20, 20, 28, 0.9)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
  };

  if (courses.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingLeft: '4px' }}>
        <div style={{ 
          width: '4px', 
          height: '24px', 
          borderRadius: '999px',
          background: 'linear-gradient(to bottom, #a855f7, #ec4899)'
        }} />
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', margin: 0 }}>All Assignments</h2>
        <span style={{ 
          fontSize: '12px', 
          color: '#71717a',
          background: 'rgba(255,255,255,0.05)',
          padding: '4px 8px',
          borderRadius: '999px',
          marginLeft: '8px'
        }}>
          {filteredAssignments.length} total
        </span>
      </div>

      {/* Course Filter */}
      <div style={{ ...cardStyle, padding: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Filter by Course
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={selectAll}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#a1a1aa',
                fontSize: '11px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              All
            </button>
            <button
              onClick={selectNone}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#a1a1aa',
                fontSize: '11px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              None
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {courses.map((course) => {
            const color = getColor(course);
            const isSelected = selectedCourses.has(course);
            return (
              <button
                key={course}
                onClick={() => toggleCourse(course)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: isSelected ? color.bg : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isSelected ? color.border : 'rgba(255,255,255,0.08)'}`,
                  color: isSelected ? color.text : '#71717a',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {isSelected && <Check style={{ width: '12px', height: '12px' }} />}
                <span style={{ 
                  maxWidth: '200px', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'nowrap' 
                }}>
                  {course}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Assignments by Course */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {Object.entries(assignmentsByCourse).map(([course, courseAssignments]) => {
          const color = getColor(course);
          const isExpanded = expandedCourses.has(course);
          
          return (
            <div key={course} style={{ ...cardStyle, overflow: 'hidden' }}>
              {/* Course Header */}
              <button
                onClick={() => toggleExpanded(course)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: 'transparent',
                  border: 'none',
                  borderLeft: `4px solid ${color.border}`,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <BookOpen style={{ width: '18px', height: '18px', color: color.text }} />
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: 0 }}>{course}</h3>
                    <p style={{ fontSize: '12px', color: '#71717a', margin: '2px 0 0 0' }}>
                      {courseAssignments.length} assignment{courseAssignments.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <ChevronDown 
                  style={{ 
                    width: '18px', 
                    height: '18px', 
                    color: '#71717a',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }} 
                />
              </button>

              {/* Assignments List */}
              {isExpanded && (
                <div style={{ 
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  padding: '12px 16px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {courseAssignments.map((assignment) => {
                      const dueDate = new Date(assignment.dueDateTime);
                      const isOverdue = isPast(dueDate) && !isToday(dueDate);
                      const isDueToday = isToday(dueDate);

                      return (
                        <div
                          key={assignment.id}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            padding: '12px',
                            background: assignment.submitted 
                              ? 'rgba(16,185,129,0.05)' 
                              : 'rgba(255,255,255,0.02)',
                            borderRadius: '10px',
                            border: assignment.submitted 
                              ? '1px solid rgba(16,185,129,0.2)' 
                              : '1px solid rgba(255,255,255,0.04)',
                            gap: '12px'
                          }}
                        >
                          {/* Submit Toggle Button */}
                          <button
                            onClick={() => handleToggleSubmitted(assignment.id)}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              border: assignment.submitted 
                                ? '2px solid #10b981' 
                                : '2px solid rgba(255,255,255,0.2)',
                              background: assignment.submitted 
                                ? '#10b981' 
                                : 'transparent',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              transition: 'all 0.15s'
                            }}
                            title={assignment.submitted ? 'Mark as not done' : 'Mark as done'}
                          >
                            {assignment.submitted && (
                              <Check style={{ width: '16px', height: '16px', color: '#fff' }} />
                            )}
                          </button>
                          
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{ 
                              fontSize: '13px', 
                              fontWeight: 600, 
                              color: assignment.submitted ? 'rgba(255,255,255,0.6)' : '#fff', 
                              margin: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              textDecoration: assignment.submitted ? 'line-through' : 'none'
                            }}>
                              {assignment.assignmentName}
                            </h4>
                            {assignment.description && (
                              <p style={{ 
                                fontSize: '12px', 
                                color: '#71717a', 
                                margin: '4px 0 0 0',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical'
                              }}>
                                {assignment.description}
                              </p>
                            )}
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'flex-end',
                            gap: '4px',
                            flexShrink: 0
                          }}>
                            {assignment.submitted ? (
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '3px 8px',
                                borderRadius: '999px',
                                background: 'rgba(16,185,129,0.2)',
                                color: '#10b981'
                              }}>
                                SUBMITTED
                              </span>
                            ) : (
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '3px 8px',
                                borderRadius: '999px',
                                background: isOverdue 
                                  ? 'rgba(239,68,68,0.2)' 
                                  : isDueToday 
                                    ? 'rgba(34,211,238,0.2)' 
                                    : 'rgba(255,255,255,0.05)',
                                color: isOverdue 
                                  ? '#ef4444' 
                                  : isDueToday 
                                    ? '#22d3ee' 
                                    : '#a1a1aa'
                              }}>
                                {isDueToday ? 'TODAY' : format(dueDate, 'MMM d, yyyy')}
                              </span>
                            )}
                            <span style={{ 
                              fontSize: '10px', 
                              color: '#52525b',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Clock style={{ width: '10px', height: '10px' }} />
                              {format(dueDate, 'h:mm a')}
                            </span>
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

      {selectedCourses.size === 0 && (
        <div style={{ ...cardStyle, padding: '32px', textAlign: 'center' }}>
          <p style={{ color: '#71717a', margin: 0 }}>Select a course to view assignments</p>
        </div>
      )}
    </div>
  );
}

