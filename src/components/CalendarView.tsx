"use client";

import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  Upload, 
  Calendar as CalendarIcon, 
  Clock, 
  LogOut,
  X,
  Check
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Assignment } from "@/db/schema";
import { UploadModal } from "./UploadModal";
import { AssignmentList } from "./AssignmentList";
import { signOut } from "next-auth/react";
import { toggleAssignmentSubmitted } from "@/actions/assignment";

interface CalendarViewProps {
  currentDate: Date;
  assignments: Assignment[];
}

export function CalendarView({ currentDate, assignments }: CalendarViewProps) {
  const router = useRouter();
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const handleToggleSubmitted = async (assignmentId: string) => {
    if (selectedAssignment) {
      // Optimistic update for immediate UI feedback
      setSelectedAssignment({
        ...selectedAssignment,
        submitted: !selectedAssignment.submitted,
      });
    }
    await toggleAssignmentSubmitted(assignmentId);
  };

  // Calendar Logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handlePrevMonth = () => {
    const newDate = subMonths(currentDate, 1);
    const params = new URLSearchParams(window.location.search);
    params.set("month", newDate.toISOString());
    router.push(`/?${params.toString()}`);
  };

  const handleNextMonth = () => {
    const newDate = addMonths(currentDate, 1);
    const params = new URLSearchParams(window.location.search);
    params.set("month", newDate.toISOString());
    router.push(`/?${params.toString()}`);
  };

  const getAssignmentsForDay = (day: Date) => {
    return assignments.filter((assignment) =>
      isSameDay(new Date(assignment.dueDateTime), day)
    );
  };

  // Get color based on course name
  const getColor = (courseName: string) => {
    const hash = courseName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      { border: '#22d3ee', bg: 'rgba(34,211,238,0.15)' },
      { border: '#a855f7', bg: 'rgba(168,85,247,0.15)' },
      { border: '#10b981', bg: 'rgba(16,185,129,0.15)' },
      { border: '#ec4899', bg: 'rgba(236,72,153,0.15)' },
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

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div style={{ padding: '16px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header Section */}
      <header style={{ ...cardStyle, padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              padding: '10px', 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(168,85,247,0.2))',
              border: '1px solid rgba(34,211,238,0.2)'
            }}>
              <CalendarIcon style={{ width: '20px', height: '20px', color: '#22d3ee' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff', margin: 0 }}>
                {format(currentDate, "MMMM yyyy")}
              </h1>
              <p style={{ fontSize: '12px', color: '#71717a', margin: '2px 0 0 0' }}>
                Academic Schedule
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Month Navigation */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: '10px', 
              padding: '4px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <button
                onClick={handlePrevMonth}
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  borderRadius: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: '#a1a1aa',
                  cursor: 'pointer'
                }}
              >
                <ChevronLeft style={{ width: '16px', height: '16px' }} />
              </button>
              <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />
              <button
                onClick={handleNextMonth}
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  borderRadius: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: '#a1a1aa',
                  cursor: 'pointer'
                }}
              >
                <ChevronRight style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            {/* Import Button */}
            <button
              onClick={() => setIsUploadOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '14px',
                color: '#fff',
                background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(168,85,247,0.2))',
                border: '1px solid rgba(34,211,238,0.3)',
                cursor: 'pointer'
              }}
            >
              <Upload style={{ width: '14px', height: '14px' }} />
              <span>Import</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                color: '#a1a1aa',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer'
              }}
              title="Sign out"
            >
              <LogOut style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>
      </header>

      {/* Calendar Grid - Responsive with horizontal scroll on mobile */}
      <div style={{ ...cardStyle, padding: '16px', marginBottom: '20px', overflowX: 'auto' }}>
        <div style={{ minWidth: '700px' }}>
          {/* Days Header */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            marginBottom: '12px',
            paddingBottom: '12px',
            borderBottom: '1px solid rgba(255,255,255,0.06)'
          }}>
            {weekDays.map((day) => (
              <div key={day} style={{ textAlign: 'center' }}>
                <span style={{ 
                  fontSize: '11px', 
                  fontWeight: 600, 
                  color: '#71717a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }}>
                  {day}
                </span>
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
            {calendarDays.map((day) => {
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isCurrentDay = isToday(day);
              const dayAssignments = getAssignmentsForDay(day);

              return (
                <div
                  key={day.toString()}
                  style={{
                    minHeight: '100px',
                    padding: '8px',
                    borderRadius: '10px',
                    background: isCurrentDay 
                      ? 'rgba(34,211,238,0.08)' 
                      : 'rgba(255,255,255,0.02)',
                    border: isCurrentDay 
                      ? '1px solid rgba(34,211,238,0.3)' 
                      : '1px solid rgba(255,255,255,0.06)',
                    opacity: isCurrentMonth ? 1 : 0.3,
                    boxShadow: isCurrentDay ? '0 0 20px rgba(34,211,238,0.1)' : 'none'
                  }}
                >
                  {/* Date Number */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: isCurrentDay ? '#22d3ee' : '#a1a1aa',
                        background: isCurrentDay ? 'rgba(34,211,238,0.2)' : 'transparent',
                        padding: isCurrentDay ? '2px 6px' : '0',
                        borderRadius: '999px'
                      }}
                    >
                      {format(day, "d")}
                    </span>
                    {dayAssignments.length > 0 && (
                      <span style={{ 
                        fontSize: '9px', 
                        fontWeight: 700, 
                        color: '#71717a',
                        background: 'rgba(255,255,255,0.05)',
                        padding: '2px 5px',
                        borderRadius: '999px'
                      }}>
                        {dayAssignments.length}
                      </span>
                    )}
                  </div>

                  {/* Assignments */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '70px', overflowY: 'auto' }}>
                    {dayAssignments.map((assignment) => {
                      const color = getColor(assignment.courseName);
                      return (
                        <button
                          key={assignment.id}
                          onClick={() => setSelectedAssignment(assignment)}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '6px',
                            borderRadius: '6px',
                            background: assignment.submitted 
                              ? 'rgba(16,185,129,0.15)' 
                              : color.bg,
                            border: 'none',
                            borderLeft: `3px solid ${assignment.submitted ? '#10b981' : color.border}`,
                            cursor: 'pointer',
                            opacity: assignment.submitted ? 0.7 : 1,
                            position: 'relative'
                          }}
                        >
                          {assignment.submitted && (
                            <div style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              background: '#10b981',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <Check style={{ width: '8px', height: '8px', color: '#fff' }} />
                            </div>
                          )}
                          <div style={{ 
                            fontSize: '10px', 
                            fontWeight: 600, 
                            color: assignment.submitted ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.9)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            textDecoration: assignment.submitted ? 'line-through' : 'none'
                          }}>
                            {assignment.courseName}
                          </div>
                          <div style={{ 
                            fontSize: '9px', 
                            color: assignment.submitted ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.5)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {assignment.assignmentName}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Assignment Detail Modal */}
      <AnimatePresence>
        {selectedAssignment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              background: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(20px)'
            }}
            onClick={() => setSelectedAssignment(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                background: 'rgba(15, 15, 20, 0.98)',
                borderRadius: '20px',
                padding: '24px',
                width: '100%',
                maxWidth: '500px',
                position: 'relative',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Gradient top border */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(to right, #22d3ee, #a855f7, #ec4899)',
                borderRadius: '20px 20px 0 0'
              }} />

              {/* Close button */}
              <button
                onClick={() => setSelectedAssignment(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  padding: '8px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: 'none',
                  color: '#a1a1aa',
                  cursor: 'pointer'
                }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>

              <div style={{ marginBottom: '24px', paddingRight: '32px' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  background: 'rgba(34,211,238,0.2)',
                  color: '#22d3ee',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '12px'
                }}>
                  {selectedAssignment.courseName}
                </span>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', margin: 0, lineHeight: 1.3 }}>
                  {selectedAssignment.assignmentName}
                </h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(236,72,153,0.2)' }}>
                    <Clock style={{ width: '20px', height: '20px', color: '#ec4899' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', margin: 0 }}>Due Date</p>
                    <p style={{ fontFamily: 'monospace', color: '#fff', fontSize: '14px', margin: '4px 0 0 0' }}>
                      {format(new Date(selectedAssignment.dueDateTime), "PPPP 'at' p")}
                    </p>
                  </div>
                </div>

                {/* Submission Status Toggle */}
                <button
                  onClick={() => handleToggleSubmitted(selectedAssignment.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    background: selectedAssignment.submitted 
                      ? 'rgba(16,185,129,0.1)' 
                      : 'rgba(255,255,255,0.03)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: selectedAssignment.submitted 
                      ? '1px solid rgba(16,185,129,0.3)' 
                      : '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {/* Checkbox */}
                  <div style={{ 
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    border: selectedAssignment.submitted 
                      ? '2px solid #10b981' 
                      : '2px solid rgba(255,255,255,0.2)',
                    background: selectedAssignment.submitted 
                      ? '#10b981' 
                      : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.15s'
                  }}>
                    {selectedAssignment.submitted && (
                      <Check style={{ width: '16px', height: '16px', color: '#fff' }} />
                    )}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ 
                      color: selectedAssignment.submitted ? '#10b981' : '#a1a1aa', 
                      fontSize: '14px', 
                      fontWeight: 600,
                      margin: 0 
                    }}>
                      {selectedAssignment.submitted ? 'Submitted' : 'Not Submitted'}
                    </p>
                    <p style={{ 
                      fontSize: '12px', 
                      color: '#71717a', 
                      margin: '4px 0 0 0' 
                    }}>
                      {selectedAssignment.submitted ? 'Click to mark as not done' : 'Click to mark as done'}
                    </p>
                  </div>
                </button>
                
                {selectedAssignment.description && (
                  <div>
                    <p style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '8px', paddingLeft: '4px' }}>Description</p>
                    <div style={{
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '12px',
                      padding: '16px',
                      border: '1px solid rgba(255,255,255,0.06)'
                    }}>
                      <p style={{ color: '#d4d4d8', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontSize: '14px', margin: 0 }}>
                        {selectedAssignment.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedAssignment(null)}
                style={{
                  marginTop: '24px',
                  width: '100%',
                  padding: '14px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
      />

      {/* All Assignments List */}
      <AssignmentList assignments={assignments} />
    </div>
  );
}
