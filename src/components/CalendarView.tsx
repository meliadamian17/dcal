"use client";

import { useState, useRef, useEffect } from "react";
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
  Check,
  Trash2,
  Tag
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Assignment, Event } from "@/db/schema";
import { UploadModal } from "./UploadModal";
import { AssignmentList } from "./AssignmentList";
import { EventList } from "./EventList";
import { AddItemModal } from "./AddItemModal";
import { AddEventModal } from "./AddEventModal";
import { AddAssignmentModal } from "./AddAssignmentModal";
import { DayOverviewModal } from "./DayOverviewModal";
import { signOut } from "next-auth/react";
import { toggleAssignmentSubmitted, deleteAssignment } from "@/actions/assignment";
import { getCourseColor, eventColors } from "@/lib/colors";

interface CalendarViewProps {
  currentDate: Date;
  assignments: Assignment[];
  events: Event[];
}

export function CalendarView({ currentDate, assignments, events }: CalendarViewProps) {
  const router = useRouter();
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedDateForAdd, setSelectedDateForAdd] = useState<Date | null>(null);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isAddAssignmentModalOpen, setIsAddAssignmentModalOpen] = useState(false);
  const [selectedDateForOverview, setSelectedDateForOverview] = useState<Date | null>(null);
  const [isDayOverviewOpen, setIsDayOverviewOpen] = useState(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Background route prefetching for adjacent months
  // This prefetches the Next.js routes, which will trigger server-side data fetching
  useEffect(() => {
    const prevMonth = subMonths(currentDate, 1);
    const nextMonth = addMonths(currentDate, 1);
    
    const prevParams = new URLSearchParams();
    prevParams.set("month", prevMonth.toISOString());
    router.prefetch(`/?${prevParams.toString()}`);

    const nextParams = new URLSearchParams();
    nextParams.set("month", nextMonth.toISOString());
    router.prefetch(`/?${nextParams.toString()}`);
  }, [currentDate, router]);

  // Calendar Logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const handleDayClick = (day: Date, e: React.MouseEvent) => {
    if (!isSameMonth(day, monthStart)) return;
    
    // Don't open overview if clicking on an interactive element (button, link, etc.)
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }
    
    // Clear any existing timeout
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    
    // Set a timeout to handle single click (after double click delay)
    clickTimeoutRef.current = setTimeout(() => {
      setSelectedDateForOverview(day);
      setIsDayOverviewOpen(true);
    }, 200);
  };

  const handleDayDoubleClick = (day: Date) => {
    if (!isSameMonth(day, monthStart)) return;
    
    // Clear the single click timeout
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    
    // Close day overview if open
    setIsDayOverviewOpen(false);
    
    // Open add item modal
    setSelectedDateForAdd(day);
    setIsAddItemModalOpen(true);
  };

  const handleSelectEvent = () => {
    setIsAddItemModalOpen(false);
    setIsAddEventModalOpen(true);
  };

  const handleSelectAssignment = () => {
    setIsAddItemModalOpen(false);
    setIsAddAssignmentModalOpen(true);
  };

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

  const handleDeleteAssignment = async (assignmentId: string) => {
    setSelectedAssignment(null);
    await deleteAssignment(assignmentId);
  };

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

  const getEventsForDay = (day: Date) => {
    return events.filter((event) =>
      isSameDay(new Date(event.dateTime), day)
    );
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
    <div style={{ padding: 'clamp(8px, 2vw, 16px)', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header Section */}
      <header style={{ ...cardStyle, padding: 'clamp(12px, 2vw, 16px) clamp(12px, 2.5vw, 20px)', marginBottom: 'clamp(12px, 2.5vw, 20px)' }}>
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
              <h1 style={{ fontSize: 'clamp(18px, 4vw, 22px)', fontWeight: 'bold', color: '#fff', margin: 0 }}>
                {format(currentDate, "MMMM yyyy")}
              </h1>
              <p style={{ fontSize: 'clamp(10px, 2vw, 12px)', color: '#71717a', margin: '2px 0 0 0' }}>
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#a1a1aa';
                }}
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
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <ChevronLeft style={{ width: '16px', height: '16px' }} />
              </button>
              <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />
              <button
                onClick={handleNextMonth}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#a1a1aa';
                }}
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
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <ChevronRight style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            {/* Import Button */}
            <button
              onClick={() => setIsUploadOpen(true)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34,211,238,0.3), rgba(168,85,247,0.3))';
                e.currentTarget.style.borderColor = 'rgba(34,211,238,0.5)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(168,85,247,0.2))';
                e.currentTarget.style.borderColor = 'rgba(34,211,238,0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
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
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Upload style={{ width: '14px', height: '14px' }} />
              <span>Import</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
                e.currentTarget.style.color = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.color = '#a1a1aa';
              }}
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
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title="Sign out"
            >
              <LogOut style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>
      </header>

      {/* Calendar Grid - Responsive */}
      <div style={{ ...cardStyle, padding: 'clamp(8px, 2vw, 16px)', marginBottom: 'clamp(12px, 2.5vw, 20px)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ minWidth: 'min(100%, 700px)' }}>
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
                  fontSize: 'clamp(9px, 1.8vw, 11px)', 
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {calendarDays.map((day) => {
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isCurrentDay = isToday(day);
              const dayAssignments = getAssignmentsForDay(day);
              const dayEvents = getEventsForDay(day);

              return (
                <div
                  key={day.toString()}
                  onClick={(e) => isCurrentMonth && handleDayClick(day, e)}
                  onDoubleClick={() => isCurrentMonth && handleDayDoubleClick(day)}
                  onMouseEnter={(e) => {
                    if (isCurrentMonth && !isCurrentDay) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isCurrentMonth && !isCurrentDay) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    }
                  }}
                  style={{
                    minHeight: 'clamp(80px, 12vw, 100px)',
                    padding: 'clamp(4px, 1vw, 8px)',
                    borderRadius: '8px',
                    background: isCurrentDay 
                      ? 'rgba(34,211,238,0.08)' 
                      : 'rgba(255,255,255,0.02)',
                    border: isCurrentDay 
                      ? '1px solid rgba(34,211,238,0.3)' 
                      : '1px solid rgba(255,255,255,0.06)',
                    opacity: isCurrentMonth ? 1 : 0.3,
                    boxShadow: isCurrentDay ? '0 0 20px rgba(34,211,238,0.1)' : 'none',
                    cursor: isCurrentMonth ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Date Number */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'clamp(4px, 0.8vw, 6px)', flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: 'clamp(11px, 2vw, 13px)',
                        fontWeight: 600,
                        color: isCurrentDay ? '#22d3ee' : '#a1a1aa',
                        background: isCurrentDay ? 'rgba(34,211,238,0.2)' : 'transparent',
                        padding: isCurrentDay ? '2px clamp(4px, 1vw, 6px)' : '0',
                        borderRadius: '999px',
                        lineHeight: '1.2'
                      }}
                    >
                      {format(day, "d")}
                    </span>
                    {(dayAssignments.length > 0 || dayEvents.length > 0) && (
                      <span style={{ 
                        fontSize: 'clamp(8px, 1.5vw, 9px)', 
                        fontWeight: 700, 
                        color: '#71717a',
                        background: 'rgba(255,255,255,0.05)',
                        padding: '2px clamp(3px, 0.8vw, 5px)',
                        borderRadius: '999px',
                        flexShrink: 0
                      }}>
                        {dayAssignments.length + dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Assignments and Events */}
                  <div className="scrollbar-hide" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(2px, 0.5vw, 4px)', maxHeight: 'clamp(50px, 10vw, 70px)', overflowY: 'auto', flex: '1 1 auto', minHeight: 0 }}>
                    {/* Events */}
                    {dayEvents.map((event) => {
                      return (
                        <button
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent cell click from firing
                            setSelectedDateForOverview(day);
                            setIsDayOverviewOpen(true);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = eventColors.bgHover;
                            e.currentTarget.style.transform = 'translateX(2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = eventColors.bg;
                            e.currentTarget.style.transform = 'translateX(0)';
                          }}
                          style={{
                            width: '100%',
                            maxWidth: '100%',
                            textAlign: 'left',
                            padding: 'clamp(4px, 1vw, 6px)',
                            borderRadius: '6px',
                            background: eventColors.bg,
                            border: 'none',
                            borderLeft: `3px solid ${eventColors.border}`,
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'all 0.15s ease',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            boxSizing: 'border-box',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <CalendarIcon style={{ width: '10px', height: '10px', color: eventColors.icon, flexShrink: 0 }} />
                          <div style={{ 
                            fontSize: 'clamp(9px, 1.8vw, 10px)', 
                            fontWeight: 600, 
                            color: 'rgba(255,255,255,0.9)',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            whiteSpace: 'normal',
                            lineHeight: '1.3',
                            flex: 1,
                            minWidth: 0
                          }}>
                            {event.title}
                          </div>
                        </button>
                      );
                    })}
                    {/* Assignments */}
                    {dayAssignments.map((assignment) => {
                      const color = getCourseColor(assignment.courseName);
                      const baseBg = assignment.submitted ? 'rgba(16,185,129,0.15)' : color.bg;
                      const hoverBg = assignment.submitted ? 'rgba(16,185,129,0.25)' : color.bg.replace('0.15)', '0.25)');
                      return (
                        <button
                          key={assignment.id}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent cell click from firing
                            setSelectedAssignment(assignment);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = hoverBg;
                            e.currentTarget.style.transform = 'translateX(2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = baseBg;
                            e.currentTarget.style.transform = 'translateX(0)';
                          }}
                          style={{
                            width: '100%',
                            maxWidth: '100%',
                            textAlign: 'left',
                            padding: 'clamp(4px, 1vw, 6px)',
                            borderRadius: '6px',
                            background: baseBg,
                            border: 'none',
                            borderLeft: `3px solid ${assignment.submitted ? '#10b981' : color.border}`,
                            cursor: 'pointer',
                            opacity: assignment.submitted ? 0.7 : 1,
                            position: 'relative',
                            transition: 'all 0.15s ease',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            boxSizing: 'border-box',
                            flexShrink: 0
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
                              justifyContent: 'center',
                              flexShrink: 0,
                              zIndex: 1
                            }}>
                              <Check style={{ width: '8px', height: '8px', color: '#fff' }} />
                            </div>
                          )}
                          <div style={{ 
                            fontSize: 'clamp(9px, 1.8vw, 10px)', 
                            fontWeight: 600, 
                            color: assignment.submitted ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.9)',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            whiteSpace: 'normal',
                            lineHeight: '1.3',
                            textDecoration: assignment.submitted ? 'line-through' : 'none',
                            paddingRight: assignment.submitted ? 'clamp(12px, 2vw, 16px)' : '0'
                          }}>
                            {assignment.courseName}
                          </div>
                          <div style={{ 
                            fontSize: 'clamp(8px, 1.6vw, 9px)', 
                            color: assignment.submitted ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.5)',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            whiteSpace: 'normal',
                            lineHeight: '1.3',
                            marginTop: 'clamp(1px, 0.3vw, 2px)'
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#a1a1aa';
                }}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  padding: '8px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: 'none',
                  color: '#a1a1aa',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>

              <div style={{ marginBottom: '24px', paddingRight: '32px' }}>
                {(() => {
                  const courseColor = getCourseColor(selectedAssignment.courseName);
                  return (
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '999px',
                      background: courseColor.bg,
                      color: courseColor.text,
                      fontSize: '12px',
                      fontWeight: 600,
                      marginBottom: '12px'
                    }}>
                      {selectedAssignment.courseName}
                    </span>
                  );
                })()}
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
                  onMouseEnter={(e) => {
                    if (selectedAssignment.submitted) {
                      e.currentTarget.style.background = 'rgba(16,185,129,0.15)';
                      e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)';
                    } else {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedAssignment.submitted) {
                      e.currentTarget.style.background = 'rgba(16,185,129,0.1)';
                      e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)';
                    } else {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    }
                  }}
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
                    transition: 'all 0.2s ease'
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

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  onClick={() => setSelectedAssignment(null)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  }}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Close
                </button>
                <button
                  onClick={() => handleDeleteAssignment(selectedAssignment.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
                    e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                    e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)';
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '14px 20px',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '12px',
                    color: '#ef4444',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  title="Delete assignment"
                >
                  <Trash2 style={{ width: '16px', height: '16px' }} />
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
      />

      {/* Add Item Choice Modal */}
      <AddItemModal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        selectedDate={selectedDateForAdd}
        onSelectEvent={handleSelectEvent}
        onSelectAssignment={handleSelectAssignment}
      />

      {/* Add Event Modal */}
      <AddEventModal
        isOpen={isAddEventModalOpen}
        onClose={() => {
          setIsAddEventModalOpen(false);
          setSelectedDateForAdd(null);
        }}
        initialDate={selectedDateForAdd}
      />

      {/* Add Assignment Modal */}
      <AddAssignmentModal
        isOpen={isAddAssignmentModalOpen}
        onClose={() => {
          setIsAddAssignmentModalOpen(false);
          setSelectedDateForAdd(null);
        }}
        initialDate={selectedDateForAdd}
      />

      {/* Day Overview Modal */}
      <DayOverviewModal
        isOpen={isDayOverviewOpen}
        onClose={() => {
          setIsDayOverviewOpen(false);
          setSelectedDateForOverview(null);
        }}
        selectedDate={selectedDateForOverview}
        assignments={assignments}
        events={events}
      />

      {/* Lists Section - Two Column Layout on larger screens */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '24px',
        marginTop: '24px'
      }}>
        {/* Assignments List */}
        <AssignmentList assignments={assignments} />
        
        {/* Events List */}
        <EventList events={events} />
      </div>
    </div>
  );
}
