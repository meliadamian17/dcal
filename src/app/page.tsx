import { Suspense } from "react";
import { getAllAssignments, getAllEvents } from "@/lib/data";
import { CalendarView } from "@/components/CalendarView";
import { parseISO } from "date-fns";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prefetchAdjacentMonths } from "@/lib/prefetch";

// Enable ISR with 60 second revalidation
export const revalidate = 60;

function LoadingState() {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#050508'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: '2px solid rgba(34,211,238,0.2)',
            borderTopColor: '#22d3ee',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
        <p style={{ color: '#71717a', fontSize: '14px', fontWeight: 500 }}>Loading your schedule...</p>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const monthParam = params.month as string;

  let currentDate = new Date();
  if (monthParam) {
    const parsed = parseISO(monthParam);
    if (!Number.isNaN(parsed.getTime())) {
      currentDate = parsed;
    }
  }

  // Fetch all assignments and events
  const [assignments, events] = await Promise.all([
    getAllAssignments(),
    getAllEvents(),
  ]);

  // Background prefetch adjacent months for faster navigation
  // Don't await - let it run in background
  prefetchAdjacentMonths(currentDate).catch((error) => {
    // Silently handle errors - prefetching is best effort
    console.error("Background prefetch error:", error);
  });

  return (
    <main style={{ minHeight: '100vh', position: 'relative' }}>
      <Suspense fallback={<LoadingState />}>
        <CalendarView currentDate={currentDate} assignments={assignments} events={events} />
      </Suspense>
    </main>
  );
}
