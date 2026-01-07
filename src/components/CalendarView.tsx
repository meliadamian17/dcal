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
  parseISO,
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Upload, Calendar as CalendarIcon, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Assignment } from "@/db/schema";
import { UploadModal } from "./UploadModal";

interface CalendarViewProps {
  currentDate: Date;
  assignments: Assignment[];
}

export function CalendarView({ currentDate, assignments }: CalendarViewProps) {
  const router = useRouter();
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(
    null
  );
  const [isUploadOpen, setIsUploadOpen] = useState(false);

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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 glass-panel p-4 rounded-xl">
        <div className="flex items-center space-x-4">
          <CalendarIcon className="text-cyan-400 w-6 h-6" />
          <h2 className="text-2xl font-bold text-white neon-text-blue">
            {format(currentDate, "MMMM yyyy")}
          </h2>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center space-x-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 border border-purple-500/50 px-4 py-2 rounded-lg transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Upload YAML</span>
          </button>
          <div className="flex space-x-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-white/10 rounded-lg text-gray-300 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-white/10 rounded-lg text-gray-300 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="glass-panel rounded-2xl p-6 overflow-hidden">
        {/* Days Header */}
        <div className="grid grid-cols-7 mb-4 text-center">
          {weekDays.map((day) => (
            <div key={day} className="text-gray-400 font-medium text-sm py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Days Cells */}
        <div className="grid grid-cols-7 gap-4">
          {calendarDays.map((day, dayIdx) => {
            const isCurrentMonth = isSameMonth(day, monthStart);
            const dayAssignments = getAssignmentsForDay(day);

            return (
              <div
                key={day.toString()}
                className={clsx(
                  "min-h-[120px] rounded-xl p-3 border transition-all duration-300",
                  isCurrentMonth
                    ? "bg-white/5 border-white/10 hover:border-cyan-500/30"
                    : "bg-transparent border-transparent opacity-30"
                )}
              >
                <div className="text-right mb-2">
                  <span
                    className={clsx(
                      "text-sm font-medium",
                      isSameDay(day, new Date())
                        ? "text-cyan-400 bg-cyan-900/30 px-2 py-1 rounded-full"
                        : "text-gray-400"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                </div>

                <div className="space-y-2">
                  {dayAssignments.map((assignment) => (
                    <motion.div
                      key={assignment.id}
                      layoutId={assignment.id}
                      onClick={() => setSelectedAssignment(assignment)}
                      className="cursor-pointer text-xs p-2 rounded-lg border border-l-4 bg-gray-900/60 hover:brightness-125 transition-all"
                      style={{
                        borderColor: "rgba(255, 255, 255, 0.1)",
                        borderLeftColor:
                          assignment.courseName.length % 2 === 0
                            ? "#00f3ff"
                            : "#ff00ff", // Simple random-ish color assignment
                      }}
                    >
                      <div className="font-bold truncate text-white">
                        {assignment.courseName}
                      </div>
                      <div className="truncate text-gray-400">
                        {assignment.assignmentName}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assignment Detail Modal */}
      <AnimatePresence>
        {selectedAssignment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedAssignment(null)}
          >
            <motion.div
              layoutId={selectedAssignment.id}
              className="glass-panel p-6 rounded-2xl w-full max-w-lg relative"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold mb-1 text-white">
                {selectedAssignment.assignmentName}
              </h3>
              <p className="text-cyan-400 font-mono mb-4 text-lg">
                {selectedAssignment.courseName}
              </p>
              
              <div className="space-y-4 text-gray-300">
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="w-4 h-4 text-pink-500" />
                  <span>
                    Due:{" "}
                    {format(
                      new Date(selectedAssignment.dueDateTime),
                      "PPPP 'at' p"
                    )}
                  </span>
                </div>
                
                <div className="p-4 bg-black/30 rounded-lg border border-white/5">
                  <p className="whitespace-pre-wrap">
                    {selectedAssignment.description}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedAssignment(null)}
                className="mt-6 w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
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
    </div>
  );
}

