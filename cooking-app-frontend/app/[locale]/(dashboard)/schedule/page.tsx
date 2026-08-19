"use client";

import React, { useState, useEffect } from "react";
import LegendBox from "./LegendBox";

// Exact category definitions and matching colors from the image
const CATEGORIES = {
  SLEEP: { name: "Sleep", bg: "bg-[#001845]", text: "text-white" },
  EARLY_MORNING: {
    name: "Early morning",
    bg: "bg-[#fef2d6]",
    text: "text-slate-900",
  },
  LATE_MORNING: {
    name: "Late morning",
    bg: "bg-[#d2ab00]",
    text: "text-slate-900",
  },
  AFTER_MEAL: {
    name: "After meal period",
    bg: "bg-[#e58a00]",
    text: "text-white",
  },
  EVENING: { name: "Evening", bg: "bg-[#556a53]", text: "text-white" },
  LATE_EVENING: {
    name: "Late evening",
    bg: "bg-[#cae3ff]",
    text: "text-slate-900",
  },
  NIGHT: { name: "Night", bg: "bg-[#6a5679]", text: "text-white" },
  LATE_NIGHT: { name: "Late night", bg: "bg-[#0052cc]", text: "text-white" },
};

// 24-hour schedule mapping
const HOURS_CONFIG = [
  { label: "0-1", category: CATEGORIES.LATE_NIGHT },
  { label: "1-2", category: CATEGORIES.SLEEP },
  { label: "2-3", category: CATEGORIES.SLEEP },
  { label: "3-4", category: CATEGORIES.SLEEP },
  { label: "4-5", category: CATEGORIES.SLEEP },
  { label: "5-6", category: CATEGORIES.SLEEP },
  { label: "6-7", category: CATEGORIES.SLEEP },
  { label: "7-8", category: CATEGORIES.SLEEP },
  { label: "8-9", category: CATEGORIES.EARLY_MORNING },
  { label: "9-10", category: CATEGORIES.EARLY_MORNING },
  { label: "10-11", category: CATEGORIES.LATE_MORNING },
  { label: "11-12", category: CATEGORIES.LATE_MORNING },
  { label: "12-13", category: CATEGORIES.AFTER_MEAL },
  { label: "13-14", category: CATEGORIES.AFTER_MEAL },
  { label: "14-15", category: CATEGORIES.EVENING },
  { label: "15-16", category: CATEGORIES.EVENING },
  { label: "16-17", category: CATEGORIES.EVENING },
  { label: "17-18", category: CATEGORIES.LATE_EVENING },
  { label: "18-19", category: CATEGORIES.LATE_EVENING },
  { label: "19-20", category: CATEGORIES.LATE_EVENING },
  { label: "20-21", category: CATEGORIES.NIGHT },
  { label: "21-22", category: CATEGORIES.NIGHT },
  { label: "22-23", category: CATEGORIES.LATE_NIGHT },
  { label: "23-0", category: CATEGORIES.LATE_NIGHT },
];

export default function ScheduleTracker() {
  const [now, setNow] = useState<Date | null>(null);

  // Update time every second
  useEffect(() => {
    const updateTime = () => setNow(new Date());

    // Push the initial update out of the synchronous execution phase
    // to satisfy the linter and prevent cascading render bottlenecks.
    const timeoutId = setTimeout(updateTime, 0);

    // Continue updating every second thereafter
    const intervalId = setInterval(updateTime, 1000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, []);

  // Avoid hydration mismatch on initial server render
  if (!now) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        Loading schedule...
      </div>
    );
  }

  const currentHour = now.getHours(); // 0 to 23
  const currentMinute = now.getMinutes();
  const currentSecond = now.getSeconds();

  // Progress within the current 1-hour block (0% to 100%)
  const minuteProgress = ((currentMinute * 60 + currentSecond) / 3600) * 100;

  return (
    <main className="flex flex-col items-center justify-center p-2 sm:p-6">
      <div className="w-full max-w-4xl space-y-12 rounded-xl sm:bg-white/10 sm:border border-white/20 sm:p-8 shadow-sm">
        {/* Header with Live Clock */}
        <div className="flex items-center justify-between">
          <header className="text-center mb-3 px-6 py-2 border-b-2 border-custom-sand-dune">
            <h1 className="text-xl font-semibold text-custom-sand-dune tracking-tight">
              Daily schedule
            </h1>
          </header>

          <div className="text-right">
            <span className="text-xs uppercase tracking-wider text-slate-400">
              Current Time
            </span>
            <p className="font-mono text-lg font-semibold text-gray-300">
              {now.toLocaleTimeString([], { hour12: false })}
            </p>
          </div>
        </div>

        {/* 24-Hour Grid (4 rows of 6 columns) */}
        <div className="grid grid-cols-6 gap-0.5 bg-white/10 p-0.5">
          {HOURS_CONFIG.map((block, index) => {
            const isCurrentBlock = index === currentHour;

            return (
              <div
                key={index}
                className={`relative flex h-16 select-none items-center justify-center font-semibold ${block.category.bg} ${block.category.text} border border-black/10`}
              >
                <span>{block.label}</span>

                {/* Moving Cursor Indicator */}
                {isCurrentBlock && (
                  <div
                    className="absolute bottom-0 top-0 z-10 w-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] transition-all duration-300 ease-linear"
                    style={{ left: `${minuteProgress}%` }}
                  >
                    {/* Top Pointer Pin */}
                    <div className="absolute -top-2 -translate-x-1/2 transform">
                      <div className="h-0 w-0 border-l-[6px] border-r-[6px] border-t-8 border-l-transparent border-r-transparent border-t-red-500" />
                    </div>

                    {/* Bottom Pointer Pin */}
                    <div className="absolute -bottom-2 -translate-x-1/2 transform">
                      <div className="h-0 w-0 border-b-8 border-l-[6px] border-r-[6px] border-b-red-500 border-l-transparent border-r-transparent" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend (2 Columns matching the layout in the screenshot) */}
        <div className="mx-auto grid max-w-lg grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-3">
            <LegendBox category={CATEGORIES.SLEEP} />
            <LegendBox category={CATEGORIES.EARLY_MORNING} />
            <LegendBox category={CATEGORIES.LATE_MORNING} />
            <LegendBox category={CATEGORIES.AFTER_MEAL} />
          </div>

          {/* Right Column */}
          <div className="space-y-3">
            <LegendBox category={CATEGORIES.EVENING} />
            <LegendBox category={CATEGORIES.LATE_EVENING} />
            <LegendBox category={CATEGORIES.NIGHT} />
            <LegendBox category={CATEGORIES.LATE_NIGHT} />
          </div>
        </div>
      </div>
    </main>
  );
}
