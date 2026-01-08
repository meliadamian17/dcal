"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Calendar, Tag } from "lucide-react";
import { createEvent } from "@/actions/event";
import { format } from "date-fns";

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date | null;
}

export function AddEventModal({ isOpen, onClose, initialDate }: AddEventModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set initial date when modal opens
  useEffect(() => {
    if (isOpen && initialDate) {
      setDate(format(initialDate, "yyyy-MM-dd"));
    }
  }, [isOpen, initialDate]);

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDate("");
    setTime("");
    setTags([]);
    setTagInput("");
    setError(null);
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
      const dateTime = new Date(`${date}T${time || "00:00"}`);

      if (Number.isNaN(dateTime.getTime())) {
        setError("Invalid date or time");
        setIsSubmitting(false);
        return;
      }

      const result = await createEvent({
        title,
        description: description || null,
        dateTime,
        tags,
      });

      if (result.success) {
        resetForm();
        onClose();
      } else {
        setError(result.error || "Failed to create event");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const tagColors = [
    { bg: "rgba(34,211,238,0.2)", border: "rgba(34,211,238,0.4)", text: "#22d3ee" },
    { bg: "rgba(168,85,247,0.2)", border: "rgba(168,85,247,0.4)", text: "#a855f7" },
    { bg: "rgba(16,185,129,0.2)", border: "rgba(16,185,129,0.4)", text: "#10b981" },
    { bg: "rgba(236,72,153,0.2)", border: "rgba(236,72,153,0.4)", text: "#ec4899" },
    { bg: "rgba(245,158,11,0.2)", border: "rgba(245,158,11,0.4)", text: "#f59e0b" },
  ];

  const getTagColor = (tag: string) => {
    const hash = tag.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return tagColors[hash % tagColors.length];
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
                background: "linear-gradient(to right, #22d3ee, #a855f7, #ec4899)",
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
                    background: "linear-gradient(135deg, rgba(34,211,238,0.2), rgba(16,185,129,0.2))",
                    border: "1px solid rgba(34,211,238,0.2)",
                  }}
                >
                  <Calendar style={{ width: "20px", height: "20px", color: "#22d3ee" }} />
                </div>
                <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "#fff", margin: 0 }}>
                  Add New Event
                </h3>
              </div>
              <p style={{ color: "#71717a", fontSize: "14px", margin: 0, paddingLeft: "52px" }}>
                Create a custom event with tags
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Event Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter event title"
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Event description..."
                  rows={3}
                  style={{
                    ...inputStyle,
                    height: "auto",
                    padding: "12px 14px",
                    resize: "none",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Time</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Tags</label>
                <div style={{ display: "flex", gap: "8px", marginBottom: tags.length > 0 ? "10px" : "0" }}>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Add a tag..."
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#a1a1aa",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Plus style={{ width: "18px", height: "18px" }} />
                  </button>
                </div>
                {tags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {tags.map((tag) => {
                      const color = getTagColor(tag);
                      return (
                        <span
                          key={tag}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "5px 10px",
                            borderRadius: "999px",
                            background: color.bg,
                            border: `1px solid ${color.border}`,
                            color: color.text,
                            fontSize: "12px",
                            fontWeight: 500,
                          }}
                        >
                          <Tag style={{ width: "10px", height: "10px" }} />
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "inherit",
                              cursor: "pointer",
                              padding: 0,
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <X style={{ width: "12px", height: "12px" }} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
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
                  background: "linear-gradient(135deg, rgba(34,211,238,0.2), rgba(16,185,129,0.2))",
                  border: "1px solid rgba(34,211,238,0.3)",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.6 : 1,
                }}
              >
                {isSubmitting ? "Creating..." : "Create Event"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
