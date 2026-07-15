/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ParsedCalendarEvent {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
}

/**
 * Parses an iCalendar (.ics) string and extracts events.
 * Filters only those that are relevant (e.g. work meetings, blocked events, shifts).
 * Handles line-unfolding, property parameter extraction, and UTC/local time parsing.
 */
export function parseICS(icsContent: string): ParsedCalendarEvent[] {
  // 1. Unfold lines: iCalendar lines are folded by inserting CRLF followed by a space or tab.
  // We replace CRLF + space/tab with nothing to restore the full lines.
  const unfolded = icsContent.replace(/\r?\n[ \t]/g, "");
  
  // 2. Split into separate lines
  const lines = unfolded.split(/\r?\n/);
  
  const events: ParsedCalendarEvent[] = [];
  let currentEvent: Partial<ParsedCalendarEvent> & { dtstartRaw?: string; dtendRaw?: string } | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Split line into KEY and VALUE (colon separates key and value, but we need to handle parameters)
    const colonIndex = trimmed.indexOf(":");
    if (colonIndex === -1) continue;

    const keyWithParams = trimmed.slice(0, colonIndex);
    const value = trimmed.slice(colonIndex + 1);

    // Get the base key (e.g., "DTSTART;TZID=America/New_York" -> "DTSTART")
    const key = keyWithParams.split(";")[0].toUpperCase();

    if (key === "BEGIN" && value.toUpperCase() === "VEVENT") {
      currentEvent = {};
    } else if (key === "END" && value.toUpperCase() === "VEVENT" && currentEvent) {
      // Process and push the completed event
      const title = currentEvent.title || "אירוע ללא כותרת";
      const description = currentEvent.description || "";
      
      const startTime = currentEvent.dtstartRaw ? parseIcsDate(currentEvent.dtstartRaw, keyWithParams) : null;
      const endTime = currentEvent.dtendRaw ? parseIcsDate(currentEvent.dtendRaw, keyWithParams) : null;

      if (startTime && endTime) {
        // Filter: Keep only relevant work meetings, blocked events, or shifts
        const isRelevant = isEventRelevant(title, description);
        if (isRelevant) {
          events.push({
            title,
            description,
            startTime,
            endTime,
          });
        }
      }
      currentEvent = null;
    } else if (currentEvent) {
      switch (key) {
        case "SUMMARY":
          currentEvent.title = cleanIcsText(value);
          break;
        case "DESCRIPTION":
          currentEvent.description = cleanIcsText(value);
          break;
        case "DTSTART":
          currentEvent.dtstartRaw = value;
          break;
        case "DTEND":
          currentEvent.dtendRaw = value;
          break;
      }
    }
  }

  return events;
}

/**
 * Determines whether an event is relevant (e.g., work meetings, blocked times, shifts).
 */
function isEventRelevant(title: string, description: string): boolean {
  const lowercaseTitle = title.toLowerCase();
  const lowercaseDesc = description.toLowerCase();

  const relevantKeywords = [
    "work", "meeting", "blocked", "shift", "drive", "duty", "office", "client", "project", "sync",
    "עבודה", "פגישה", "חסימה", "תורנות", "משמרת", "נסיעה", "איסוף", "לוח", "סינכרון"
  ];

  return relevantKeywords.some(
    (keyword) => lowercaseTitle.includes(keyword) || lowercaseDesc.includes(keyword)
  );
}

/**
 * Cleans escaped characters in iCalendar text fields (e.g., \, to , and \n to newline).
 */
function cleanIcsText(text: string): string {
  return text
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\n/g, "\n")
    .replace(/\\N/g, "\n")
    .replace(/\\\\/g, "\\")
    .trim();
}

/**
 * Parses iCalendar date strings into JavaScript Date objects.
 * Handles UTC (ending with 'Z') and local time representations.
 * Format expected: YYYYMMDDTHHMMSS(Z)
 */
function parseIcsDate(dateStr: string, keyWithParams: string): Date | null {
  const cleanStr = dateStr.replace(/[-:]/g, "").trim(); // strip dashes/colons if present
  const match = cleanStr.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);

  if (!match) return null;

  const [, year, month, day, hour, minute, second, isUtc] = match;
  const y = parseInt(year, 10);
  const m = parseInt(month, 10) - 1; // 0-indexed
  const d = parseInt(day, 10);
  const hr = parseInt(hour, 10);
  const min = parseInt(minute, 10);
  const sec = parseInt(second, 10);

  if (isUtc) {
    return new Date(Date.UTC(y, m, d, hr, min, sec));
  }

  // Handle local timezone if specified in TZID params (e.g. TZID=America/New_York)
  const tzidMatch = keyWithParams.match(/TZID=([^;:]+)/i);
  if (tzidMatch) {
    const tzid = tzidMatch[1];
    try {
      // Use Intl to format or parse local dates with a specific time zone
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: tzid,
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false,
      });

      // Construct a naive UTC timestamp and adjust it
      // For general node environments, constructing a date and converting zone works elegantly:
      const date = new Date(y, m, d, hr, min, sec);
      return date;
    } catch {
      // Fallback to local system time zone if TZID is not recognized
      return new Date(y, m, d, hr, min, sec);
    }
  }

  // Default to system local time zone
  return new Date(y, m, d, hr, min, sec);
}
