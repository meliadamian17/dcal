import { db } from "@/db";
import { assignments, events } from "@/db/schema";
import { sendDailySummaryEmail } from "@/lib/mail";
import { gte, lte, and, asc } from "drizzle-orm";
import { addDays, startOfDay, endOfDay, format } from "date-fns";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Security Check for Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekEnd = endOfDay(addDays(now, 7));

    // Fetch assignments for the next 7 days
    const upcomingAssignments = await db
      .select()
      .from(assignments)
      .where(
        and(
          gte(assignments.dueDateTime, todayStart),
          lte(assignments.dueDateTime, weekEnd)
        )
      )
      .orderBy(asc(assignments.dueDateTime));

    // Fetch events for the next 7 days
    const upcomingEvents = await db
      .select()
      .from(events)
      .where(
        and(
          gte(events.dateTime, todayStart),
          lte(events.dateTime, weekEnd)
        )
      )
      .orderBy(asc(events.dateTime));

    const recipientEmail = process.env.NOTIFICATION_EMAIL || process.env.SMTP_USER;
    
    if (!recipientEmail) {
      return NextResponse.json({ 
        success: false, 
        error: "No recipient email configured" 
      }, { status: 500 });
    }

    const dateLabel = format(now, "EEEE, MMMM d, yyyy");
    
    const sent = await sendDailySummaryEmail(
      recipientEmail,
      upcomingAssignments.map(a => ({
        assignmentName: a.assignmentName,
        courseName: a.courseName,
        dueDateTime: a.dueDateTime,
        description: a.description,
        submitted: a.submitted,
      })),
      upcomingEvents.map(e => ({
        title: e.title,
        dateTime: e.dateTime,
        description: e.description,
        tags: e.tags || [],
      })),
      dateLabel
    );

    if (sent) {
      return NextResponse.json({
        success: true,
        message: "Daily summary sent",
        stats: {
          assignments: upcomingAssignments.length,
          events: upcomingEvents.length,
        },
      });
    }

    return NextResponse.json({
      success: false,
      error: "Failed to send email",
    }, { status: 500 });
  } catch (error) {
    console.error("Cron Job Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

