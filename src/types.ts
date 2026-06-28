/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PickupStatus = "regular" | "urgent"; // רגיל / דחוף

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicleInfo: string; // צבע רכב, יצרן, מספר וכו׳
  type: "permanent" | "guest"; // קבוע / אורח
  reminderOptIn: boolean; // קבלת תזכורת שעה לפני
}

export interface Pickup {
  id: string;
  day: string; // 'א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳'
  childName: string; // איתי, נועה, עומר
  time: string; // למשל "13:30"
  endTime?: string; // למשל "14:30"
  driverId: string; // מפתח חוץ ל-Driver.id
  status: PickupStatus;
  notes: string; // הערות לחוג, מיקום וכו׳
  completed: boolean; // האם הושלם בהצלחה
  babysitterType?: "none" | "babysitter_only" | "both"; // סוג בייביסיטר: ללא, רק בייביסיטר, גם וגם
  isRecurring?: boolean; // האם מדובר באירוע קבוע (חוזר מדי שבוע)
  isOneTimeOverride?: boolean; // האם זהו שינוי חד-פעמי של אירוע קבוע
  isOneTimeDeleted?: boolean; // האם מדובר בביטול חד-פעמי לשבוע הנוכחי בלבד קבוע בלי למחוק פיזית
  originalRecurringValues?: { // ערכי המקור הקבועים לשחזור מהיר
    time: string;
    endTime?: string;
    driverId: string;
    notes: string;
    status: PickupStatus;
    babysitterType?: "none" | "babysitter_only" | "both";
  };
}

export interface ActivityLog {
  id: string;
  timestamp: string; // "2026-06-21T13:32:00"
  action: string; // סוג הפעולה (למשל: עדכון הסעה, הוספת נהג)
  details: string; // פירוט הפעולה השלם
  userRole: "parent" | "child" | "system";
  childName?: string; // לסינון
}

export interface AlertNotification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: "info" | "urgent" | "success";
  read: boolean;
}

export const DAYS_OF_WEEK = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

export const DEFAULT_CHILDREN = ["יובל", "אלון", "בר"];

export function isPickupLessThan12HoursAway(day: string, timeStr: string, driverId?: string): boolean {
  const isUnassigned = !driverId || driverId === "unassigned" || driverId === "none";
  if (!isUnassigned) return false;

  const HEBREW_DAYS_CYCLE = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  const now = new Date();
  const currentJsDayIdx = now.getDay(); // 0 is Sunday, 6 is Saturday

  const targetDayIdx = HEBREW_DAYS_CYCLE.indexOf(day);
  if (targetDayIdx === -1) return false;

  const timeParts = timeStr.split(":");
  if (timeParts.length !== 2) return false;
  const hours = parseInt(timeParts[0], 10);
  const minutes = parseInt(timeParts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return false;

  const upcomingDayDiff = (targetDayIdx - currentJsDayIdx + 7) % 7;
  const upcomingTargetDate = new Date(now);
  upcomingTargetDate.setDate(now.getDate() + upcomingDayDiff);
  upcomingTargetDate.setHours(hours, minutes, 0, 0);

  const diffHours = (upcomingTargetDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  return diffHours > 0 && diffHours < 12;
}

