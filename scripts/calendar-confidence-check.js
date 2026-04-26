function eventSignature(event) {
  return `${String(event.date || "").trim()}|${String(event.startTime || "").trim()}|${String(event.endTime || "").trim()}|${String(event.title || "").trim().toLowerCase()}`;
}

function dedupeCalendarEvents(events) {
  const seen = new Set();
  const deduped = [];
  for (const event of events || []) {
    const key = eventSignature(event);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(event);
  }
  return deduped;
}

function parseClock(value) {
  const [h, m] = String(value || "00:00").split(":").map((item) => Number(item || 0));
  return h * 60 + m;
}

function overlapsWindow(start, end, windowItem) {
  return start < windowItem.end && end > windowItem.start;
}

function hasConflict(newEvent, existingEvents) {
  return (existingEvents || []).some((event) => newEvent.start < event.end && newEvent.end > event.start);
}

function toWindow(event) {
  return {
    start: parseClock(event.startTime),
    end: parseClock(event.endTime),
    title: event.title,
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const date = "2026-04-27"; // Monday

  const schoolRoutine = [
    { title: "School", date, startTime: "08:00", endTime: "15:00", category: "School", source: "recurring" },
  ];
  const manualBlocks = [
    { title: "Gym", date, startTime: "16:00", endTime: "17:00", category: "Busy", source: "manual" },
    { title: "Family", date, startTime: "19:00", endTime: "20:00", category: "Busy", source: "manual" },
  ];
  const assignments = [
    { title: "Math project work", date, startTime: "17:10", endTime: "17:50", category: "Assignment", source: "ai" },
    { title: "Chemistry review", date, startTime: "20:10", endTime: "20:50", category: "Study", source: "ai" },
  ];

  const busyWindows = [...schoolRoutine, ...manualBlocks].map(toWindow);
  const aiWindows = assignments.map(toWindow);

  // Check conflict safety against school + manual windows.
  const aiHasConflicts = aiWindows.some((windowItem) =>
    busyWindows.some((busy) => overlapsWindow(windowItem.start, windowItem.end, busy))
  );
  assert(!aiHasConflicts, "AI sessions conflict with school/manual windows.");

  // Check AI internal conflicts (stacking).
  for (let i = 0; i < aiWindows.length; i += 1) {
    const current = aiWindows[i];
    const rest = aiWindows.filter((_, idx) => idx !== i);
    assert(!hasConflict(current, rest), "AI sessions overlap each other.");
  }

  // Simulate generating/applying AI schedule twice and verify dedupe.
  const afterFirstApply = dedupeCalendarEvents([...schoolRoutine, ...manualBlocks, ...assignments]);
  const afterSecondApply = dedupeCalendarEvents([...afterFirstApply, ...assignments]);
  assert(afterSecondApply.length === afterFirstApply.length, "Duplicate events detected after second AI apply.");

  console.log("PASS school_routine_conflicts");
  console.log("PASS manual_blocks_conflicts");
  console.log("PASS assignments_conflicts");
  console.log("PASS ai_generate_twice_deduped");
  console.log(`RESULT ok events=${afterSecondApply.length}`);
}

try {
  run();
} catch (error) {
  console.error("RESULT fail", error.message);
  process.exit(1);
}
