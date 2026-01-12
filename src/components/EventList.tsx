"use client";

import { useState, useMemo, memo } from "react";
import { format, isWithinInterval, parseISO } from "date-fns";
import {
  Calendar,
  Clock,
  Tag,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  X,
} from "lucide-react";
import { Event } from "@/db/schema";
import { deleteEvent } from "@/actions/event";
import { AddEventModal } from "./AddEventModal";
import { getTagColor, eventColors } from "@/lib/colors";

interface EventListProps {
  events: Event[];
}

const ITEMS_PER_PAGE = 5;

function EventListComponent({ events }: EventListProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDateFilter, setShowDateFilter] = useState(false);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    events.forEach((event) => {
      event.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [events]);

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = event.title.toLowerCase().includes(query);
        const matchesDescription = event.description?.toLowerCase().includes(query);
        const matchesTags = event.tags?.some((tag) => tag.toLowerCase().includes(query));
        if (!matchesTitle && !matchesDescription && !matchesTags) {
          return false;
        }
      }

      // Tag filter
      if (selectedTags.size > 0) {
        const hasSelectedTag = event.tags?.some((tag) => selectedTags.has(tag));
        if (!hasSelectedTag) {
          return false;
        }
      }

      // Date range filter
      if (startDate || endDate) {
        const eventDate = new Date(event.dateTime);
        if (startDate && endDate) {
          const start = parseISO(startDate);
          const end = parseISO(endDate);
          end.setHours(23, 59, 59, 999);
          if (!isWithinInterval(eventDate, { start, end })) {
            return false;
          }
        } else if (startDate) {
          const start = parseISO(startDate);
          if (eventDate < start) {
            return false;
          }
        } else if (endDate) {
          const end = parseISO(endDate);
          end.setHours(23, 59, 59, 999);
          if (eventDate > end) {
            return false;
          }
        }
      }

      return true;
    });
  }, [events, searchQuery, selectedTags, startDate, endDate]);

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEvents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEvents, currentPage]);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTags, startDate, endDate]);

  const toggleTag = (tag: string) => {
    const newTags = new Set(selectedTags);
    if (newTags.has(tag)) {
      newTags.delete(tag);
    } else {
      newTags.add(tag);
    }
    setSelectedTags(newTags);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTags(new Set());
    setStartDate("");
    setEndDate("");
    setShowDateFilter(false);
  };

  const handleDeleteEvent = async (id: string) => {
    await deleteEvent(id);
  };

  const hasActiveFilters = searchQuery || selectedTags.size > 0 || startDate || endDate;

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
                background: eventColors.border,
              }}
            />
          <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#fff", margin: 0 }}>Events</h2>
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
            {filteredEvents.length} total
          </span>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          type="button"
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
            ...buttonStyle,
            background: eventColors.bg,
            border: `1px solid ${eventColors.border}`,
            color: "#fff",
          }}
        >
          <Plus style={{ width: "16px", height: "16px" }} />
          Add Event
        </button>
      </div>

      {/* Filters */}
      <div style={{ ...cardStyle, padding: "16px", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: allTags.length > 0 ? "12px" : "0", flexWrap: "wrap" }}>
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
              placeholder="Search events..."
              style={{ ...inputStyle, width: "100%", paddingLeft: "38px" }}
            />
          </div>

          {/* Date Range Toggle */}
          <button
            type="button"
            onClick={() => setShowDateFilter(!showDateFilter)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = (startDate || endDate) ? eventColors.bgHover : "rgba(255,255,255,0.1)";
              e.currentTarget.style.borderColor = (startDate || endDate) ? eventColors.border : "rgba(255,255,255,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = (startDate || endDate) ? eventColors.bg : "rgba(255,255,255,0.05)";
              e.currentTarget.style.borderColor = (startDate || endDate) ? eventColors.border : "rgba(255,255,255,0.1)";
            }}
            style={{
              ...buttonStyle,
              background: (startDate || endDate) ? eventColors.bg : buttonStyle.background,
              borderColor: (startDate || endDate) ? eventColors.border : "rgba(255,255,255,0.1)",
              color: (startDate || endDate) ? eventColors.text : "#a1a1aa",
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
              marginBottom: allTags.length > 0 ? "12px" : "0",
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

        {/* Tags Filter */}
        {allTags.length > 0 && (
          <div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#71717a",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "8px",
                display: "block",
              }}
            >
              Filter by Tags
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {allTags.map((tag) => {
                const color = getTagColor(tag);
                const isSelected = selectedTags.has(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    type="button"
                    onMouseEnter={(e) => {
                      if (isSelected) {
                        e.currentTarget.style.background = color.bg.replace("0.2)", "0.3)");
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
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "5px 10px",
                      borderRadius: "999px",
                      background: isSelected ? color.bg : "rgba(255,255,255,0.02)",
                      border: `1px solid ${isSelected ? color.border : "rgba(255,255,255,0.08)"}`,
                      color: isSelected ? color.text : "#71717a",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Tag style={{ width: "10px", height: "10px" }} />
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Events List */}
      <div style={{ ...cardStyle, overflow: "hidden" }}>
        {paginatedEvents.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                margin: "0 auto 16px",
                borderRadius: "16px",
                background: eventColors.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Calendar style={{ width: "28px", height: "28px", color: eventColors.icon }} />
            </div>
            <h3 style={{ color: "#fff", fontSize: "16px", fontWeight: 600, margin: "0 0 8px 0" }}>
              {hasActiveFilters ? "No matching events" : "No upcoming events"}
            </h3>
            <p style={{ color: "#71717a", fontSize: "14px", margin: 0 }}>
              {hasActiveFilters ? "Try adjusting your filters" : "Add your first event to get started"}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {paginatedEvents.map((event, index) => (
              <div
                key={event.id}
                style={{
                  padding: "16px",
                  borderBottom: index < paginatedEvents.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: "14px", fontWeight: 600, color: "#fff", margin: "0 0 4px 0" }}>
                    {event.title}
                  </h4>
                  {event.description && (
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#71717a",
                        margin: "0 0 8px 0",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {event.description}
                    </p>
                  )}
                  {event.tags && event.tags.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {event.tags.map((tag) => {
                        const color = getTagColor(tag);
                        return (
                          <span
                            key={tag}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "2px 8px",
                              borderRadius: "999px",
                              background: color.bg,
                              color: color.text,
                              fontSize: "10px",
                              fontWeight: 500,
                            }}
                          >
                            <Tag style={{ width: "8px", height: "8px" }} />
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px", flexShrink: 0 }}>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#a1a1aa", display: "block" }}>
                      {format(new Date(event.dateTime), "MMM d, yyyy")}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#52525b",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        justifyContent: "flex-end",
                      }}
                    >
                      <Clock style={{ width: "10px", height: "10px" }} />
                      {format(new Date(event.dateTime), "h:mm a")}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
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
                      padding: "6px",
                      borderRadius: "6px",
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      color: "#ef4444",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    title="Delete event"
                  >
                    <Trash2 style={{ width: "14px", height: "14px" }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
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
      </div>

      <AddEventModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}

// Memoize to prevent unnecessary re-renders when props haven't changed
export const EventList = memo(EventListComponent);
