import { Suspense } from "react";
import { getAssignments } from "@/lib/data";
import { CalendarView } from "@/components/CalendarView";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  // Await searchParams as required in Next.js 15/16 for async handling
  const params = await searchParams;
  const monthParam = params.month as string;

  let currentDate = new Date();
  if (monthParam) {
    const parsed = parseISO(monthParam);
    if (!isNaN(parsed.getTime())) {
      currentDate = parsed;
    }
  }

  // Calculate range to fetch (full calendar grid scope)
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);

  const assignments = await getAssignments(gridStart, gridEnd);

  return (
    <main className="min-h-screen relative overflow-hidden pb-10">
      {/* Background Elements */}
      <div className="bg-orb w-[600px] h-[600px] bg-purple-900/30 top-[-200px] left-[20%] blur-[120px]" />
      <div className="bg-orb w-[500px] h-[500px] bg-blue-900/30 bottom-[-100px] right-[10%] blur-[100px]" />

      <div className="relative z-10 pt-8">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 neon-text-blue tracking-tighter">
          ACADEMIC <span className="text-white">LINK</span>
        </h1>
        <p className="text-center text-gray-400 mb-8 font-light tracking-widest text-sm uppercase">
          Assignment Tracking System
        </p>
        
        <Suspense fallback={<div className="text-center text-cyan-500 mt-20">Loading Grid...</div>}>
          <CalendarView currentDate={currentDate} assignments={assignments} />
        </Suspense>
      </div>
    </main>
  );
}
