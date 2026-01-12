/**
 * Shared color utilities for consistent styling across components
 */

// Course/Assignment colors - unique per course name
export const courseColors = [
  { border: '#22d3ee', bg: 'rgba(34,211,238,0.15)', text: '#22d3ee' },
  { border: '#a855f7', bg: 'rgba(168,85,247,0.15)', text: '#a855f7' },
  { border: '#ec4899', bg: 'rgba(236,72,153,0.15)', text: '#ec4899' },
  { border: '#f59e0b', bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
  { border: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', text: '#8b5cf6' },
  { border: '#06b6d4', bg: 'rgba(6,182,212,0.15)', text: '#06b6d4' },
];

// Event colors - always green
export const eventColors = {
  border: '#10b981',
  bg: 'rgba(16,185,129,0.15)',
  bgHover: 'rgba(16,185,129,0.25)',
  text: '#10b981',
  icon: '#10b981',
};

// Tag colors for event tags
export const tagColors = [
  { bg: 'rgba(34,211,238,0.2)', border: 'rgba(34,211,238,0.4)', text: '#22d3ee' },
  { bg: 'rgba(168,85,247,0.2)', border: 'rgba(168,85,247,0.4)', text: '#a855f7' },
  { bg: 'rgba(16,185,129,0.2)', border: 'rgba(16,185,129,0.4)', text: '#10b981' },
  { bg: 'rgba(236,72,153,0.2)', border: 'rgba(236,72,153,0.4)', text: '#ec4899' },
  { bg: 'rgba(245,158,11,0.2)', border: 'rgba(245,158,11,0.4)', text: '#f59e0b' },
];

/**
 * Get a unique color for a course name based on hash
 * This ensures the same course always gets the same color
 */
export function getCourseColor(courseName: string) {
  const hash = courseName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return courseColors[hash % courseColors.length];
}

/**
 * Get a color for an event tag based on hash
 */
export function getTagColor(tag: string) {
  const hash = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return tagColors[hash % tagColors.length];
}
