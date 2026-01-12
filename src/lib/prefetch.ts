import { getAssignments, getEvents } from "@/lib/data";
import { startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";

/**
 * Prefetch data for a specific month
 * This function is designed to be called in the background
 * to prefetch adjacent months for faster navigation
 */
export async function prefetchMonthData(month: Date) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);

  // Prefetch in parallel - these will be cached by unstable_cache
  await Promise.all([
    getAssignments(monthStart, monthEnd),
    getEvents(monthStart, monthEnd),
  ]);
}

/**
 * Prefetch data for adjacent months (previous and next)
 * This is called when the user is viewing a month to prepare
 * for likely navigation
 */
export async function prefetchAdjacentMonths(currentMonth: Date) {
  const prevMonth = subMonths(currentMonth, 1);
  const nextMonth = addMonths(currentMonth, 1);

  // Prefetch both adjacent months in parallel
  // Don't await - let it run in background
  Promise.all([
    prefetchMonthData(prevMonth),
    prefetchMonthData(nextMonth),
  ]).catch((error) => {
    // Silently handle errors - prefetching is best effort
    console.error("Background prefetch error:", error);
  });
}

/**
 * Prefetch data for a range of months
 * Useful for prefetching multiple months at once
 */
export async function prefetchMonthRange(startMonth: Date, endMonth: Date) {
  const months: Date[] = [];
  let current = startOfMonth(startMonth);
  const end = startOfMonth(endMonth);

  while (current <= end) {
    months.push(current);
    current = addMonths(current, 1);
  }

  // Prefetch all months in parallel
  await Promise.all(months.map((month) => prefetchMonthData(month)));
}
