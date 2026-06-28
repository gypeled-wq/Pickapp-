/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { Pickup, Driver, DAYS_OF_WEEK, DEFAULT_CHILDREN, isPickupLessThan12HoursAway } from "../types";
import { StorageEngine, subscribeToStore } from "../data";
import { Calendar, Clock, User, AlertTriangle, Edit3, Trash2, CheckCircle, ShieldAlert, Plus, HelpCircle, Phone, Sparkles, PlusCircle, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface WeeklyScheduleProps {
  userRole: "parent" | "driver" | "child";
  activeDriverId?: string | null;
}

export default function WeeklySchedule({ userRole, activeDriverId = null }: WeeklyScheduleProps) {
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDayTab, setSelectedDayTab] = useState("ראשון"); // For mobile day tabs
  const [driverFilter, setDriverFilter] = useState<"only-mine" | "all">("only-mine"); // For driver focus view

  // אישור פנימי לביטול/מחיקה ואיפוס שבוע ללא window.confirm (בשל חסימת iframe)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [resetWeekConfirmOpen, setResetWeekConfirmOpen] = useState(false);

  // מודאל עריכה
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPickup, setEditingPickup] = useState<Pickup | null>(null);

  // תמיכה באירועים קבועים ושינויים חד-פעמיים
  const [formIsRecurring, setFormIsRecurring] = useState(true);
  const [formOverrideType, setFormOverrideType] = useState<"permanent" | "onetime">("permanent");
  const [driverNotificationPending, setDriverNotificationPending] = useState<{
    driver: Driver;
    pickup: Pickup;
    actionType: "edit" | "delete";
    oldPickup?: { day: string; time: string; childName: string; notes: string };
  } | null>(null);

  // ערכי טופס
  const [formDay, setFormDay] = useState("ראשון");
  const [formChildren, setFormChildren] = useState<string[]>(["יובל"]);
  const [formTime, setFormTime] = useState("13:30");
  const [formEndTime, setFormEndTime] = useState("");
  const [formDriverId, setFormDriverId] = useState("");
  const [formStatus, setFormStatus] = useState<"regular" | "urgent">("regular");
  const [formNotes, setFormNotes] = useState("");
  const [formBabysitterType, setFormBabysitterType] = useState<"none" | "babysitter_only" | "both">("none");

  // שלב שני של קלט נהג מזדמן מהיר מתוך הטופס
  const [isQuickDriver, setIsQuickDriver] = useState(false);
  const [quickDriverName, setQuickDriverName] = useState("");
  const [quickDriverPhone, setQuickDriverPhone] = useState("");
  const [quickDriverCar, setQuickDriverCar] = useState("");

  // שלב דיווח על שינוי מקוצר (כפתור מוקד דחוף)
  const [isUrgentReporterOpen, setIsUrgentReporterOpen] = useState(false);
  const [urgentReportChild, setUrgentReportChild] = useState("יובל");
  const [urgentReportDay, setUrgentReportDay] = useState("ראשון");
  const [urgentReportTime, setUrgentReportTime] = useState("13:30");
  const [urgentReportType, setUrgentReportType] = useState<"change" | "cancel">("change");
  const [urgentReportReason, setUrgentReportReason] = useState("");
  const [selectedUrgentPickupId, setSelectedUrgentPickupId] = useState("");
  const [urgentReportSuccessMsg, setUrgentReportSuccessMsg] = useState<{
    fatherUrl: string;
    motherUrl: string;
    fatherName: string;
    motherName: string;
    fatherSent: boolean;
    motherSent: boolean;
  } | null>(null);

  // מודאל הודעת ביטול ננהג להורים
  const [cancellationMessagePrompt, setCancellationMessagePrompt] = useState<{
    pickup: Pickup;
    parentMessage: string;
    motherName: string;
    fatherName: string;
    motherUrl: string;
    fatherUrl: string;
    generalUrl: string;
  } | null>(null);

  // טיימר להתראות איוש נסיעות פעיל להורים
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(30);
  const [isAlertScanning, setIsAlertScanning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimerSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsAlertScanning(true);
          setTimeout(() => setIsAlertScanning(false), 1500);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const upcomingUnassignedPickups = useMemo(() => {
    const HEBREW_DAYS_CYCLE = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
    const currentJsDayIdx = new Date().getDay(); // 0 (Sunday) to 6 (Saturday)

    return pickups.filter((p) => {
      if (p.isOneTimeDeleted) return false;
      const isUnassigned = !p.driverId || p.driverId === "unassigned" || p.driverId === "none";
      if (!isUnassigned) return false;

      const dayIdx = HEBREW_DAYS_CYCLE.indexOf(p.day);
      if (dayIdx === -1) return false;

      // בדיקה אם הנסיעה היא להיום (0) או למחר (1)
      const diff = (dayIdx - currentJsDayIdx + 7) % 7;
      return diff === 0 || diff === 1;
    });
  }, [pickups]);

  useEffect(() => {
    setPickups(StorageEngine.getPickups());
    setDrivers(StorageEngine.getDrivers());

    const unsubscribe = subscribeToStore(() => {
      setPickups(StorageEngine.getPickups());
      setDrivers(StorageEngine.getDrivers());
    });
    return unsubscribe;
  }, []);

  // במצב נהגים להציג קודם את הילדים שיש לנהג נסיעות איתם השבוע
  const displayChildren = useMemo(() => {
    if (userRole === "driver" && activeDriverId) {
      const hasRideWithDriver = (childName: string) => {
        return pickups.some(
          (p) =>
            p.driverId === activeDriverId &&
            p.childName.split(",").map(c => c.trim()).includes(childName)
        );
      };

      return [...DEFAULT_CHILDREN].sort((a, b) => {
        const aHas = hasRideWithDriver(a) ? 1 : 0;
        const bHas = hasRideWithDriver(b) ? 1 : 0;
        return bHas - aHas;
      });
    }
    return DEFAULT_CHILDREN;
  }, [pickups, activeDriverId, userRole]);

  // שליחת תזכורת נסיעה או שינוי דרך הווטסאפ (WhatsApp)
  const shareOnWhatsApp = (pickup: Pickup) => {
    const driver = drivers.find((d) => d.id === pickup.driverId);
    const timeStr = pickup.endTime ? `${pickup.time} עד ${pickup.endTime}` : pickup.time;
    const text = `🚗 *עדכון נסיעה חשוב מסהרון* 🚗\n\n*יום:* יום ${pickup.day}\n*שעה:* ${timeStr}\n*עבור הילדים:* ${pickup.childName}\n*הנהג/ת המשויך:* ${driver ? driver.name : "טרם שוייך"}\n${driver?.phone ? `*טלפון:* ${driver.phone}` : ""}\n${pickup.notes ? `*הערות איסוף:* ${pickup.notes}` : ""}\n\nנא לאשר קבלת ההסעה! נסיעה בטוחה! 🧡🚲`;
    
    let phoneNum = driver?.phone || "";
    if (phoneNum) {
      phoneNum = phoneNum.replace(/[^0-9]/g, ""); // הסרת תווים שאינם מספרים ועוד
      if (phoneNum.startsWith("0")) {
        phoneNum = "972" + phoneNum.substring(1);
      }
    }

    const url = phoneNum
      ? `https://api.whatsapp.com/send?phone=${phoneNum}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    
    window.open(url, "_blank");
  };

  // קבלת תאריך עבור יום בשבוע בשביל קובץ הלוח (iCal / ICS)
  const getDayDate = (dayHebrew: string): Date => {
    const dayMap: { [key: string]: number } = {
      "ראשון": 0,
      "שני": 1,
      "שלישי": 2,
      "רביעי": 3,
      "חמישי": 4,
      "שישי": 5,
      "שבת": 6
    };
    const order = dayMap[dayHebrew] ?? 0;
    // שבוע הנוכחי מתחיל ב-21 ליוני 2026 (יום ראשון)
    const baseDate = new Date("2026-06-21T00:00:00");
    const targetDate = new Date(baseDate);
    targetDate.setDate(baseDate.getDate() + order);
    return targetDate;
  };

  // ייצוא כל נסיעות השבוע של הנהג לקובץ לוח שנה iCal (.ics) תקני המסתנכרן עם כל מכשיר מקומי
  const exportDriverCalendar = (driverId: string) => {
    const driverObj = drivers.find(d => d.id === driverId);
    if (!driverObj) return;

    const myPickups = pickups.filter(p => p.driverId === driverId && !p.isOneTimeDeleted);
    if (myPickups.length === 0) {
      alert("אין לך נסיעות משויכות השבוע לייצוא ליומן!");
      return;
    }

    let icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Saharoon Kid Sync//HE",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:הסעות סהרון - ${driverObj.name}`,
      "X-WR-TIMEZONE:Asia/Jerusalem"
    ];

    const pad = (num: number) => num.toString().padStart(2, "0");

    myPickups.forEach(p => {
      const date = getDayDate(p.day);
      const [hours, minutes] = p.time.split(":").map(Number);
      
      const startDate = new Date(date);
      startDate.setHours(hours || 0, minutes || 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(hours || 0, (minutes || 0) + 45, 0, 0); // נניח 45 דק לכל נסיעה

      const formatICSDate = (d: Date) => {
        const yyyy = d.getFullYear();
        const mm = pad(d.getMonth() + 1);
        const dd = pad(d.getDate());
        const h = pad(d.getHours());
        const min = pad(d.getMinutes());
        return `${yyyy}${mm}${dd}T${h}${min}00`;
      };

      const startStr = formatICSDate(startDate);
      const endStr = formatICSDate(endDate);

      const summary = `סהרון: איסוף ${p.childName}`;
      const description = `יום ${p.day} בשעה ${p.time}. ילדים: ${p.childName}. נהג: ${driverObj.name}.${p.notes ? ' הערות: ' + p.notes : ''}`;

      icsContent.push(
        "BEGIN:VEVENT",
        `UID:pickup_${p.id}_2026_${Math.random().toString(36).substring(2, 7)}@saharon.kids`,
        `DTSTART;TZID=Asia/Jerusalem:${startStr}`,
        `DTEND;TZID=Asia/Jerusalem:${endStr}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        "STATUS:CONFIRMED",
        "BEGIN:VALARM",
        "TRIGGER:-PT30M", // תזכורת 30 דקות לפני
        "ACTION:DISPLAY",
        `DESCRIPTION:תזכורת: ${summary}`,
        "END:VALARM",
        "END:VEVENT"
      );
    });

    icsContent.push("END:VCALENDAR");

    try {
      const blob = new Blob([icsContent.join("\r\n")], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `saharon_schedule_${driverObj.name.replace(/\s+/g, "_")}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("iCal export failed", e);
    }
  };

  // שיתוף הלוח השבועי המלא של הנהג בוואטסאפ בקלות
  const shareDriverWeeklySchedule = (driverId: string) => {
    const driverObj = drivers.find(d => d.id === driverId);
    if (!driverObj) return;

    const myPickups = pickups.filter(p => p.driverId === driverId && !p.isOneTimeDeleted);
    if (myPickups.length === 0) {
      alert("אין לך נסיעות משויכות השבוע לשיתוף!");
      return;
    }

    let text = `🚗 *לוח ההסעות השבועי שלי (${driverObj.name})* 🚗\n\n`;
    
    const dayOrder = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
    const sorted = [...myPickups].sort((a, b) => {
      const diff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
      if (diff !== 0) return diff;
      return a.time.localeCompare(b.time);
    });

    sorted.forEach((p) => {
      text += `📅 *יום ${p.day}* בשעה *${p.time}*\n👦🧒 *ילדים:* ${p.childName}\n${p.notes ? `💬 *הערות:* ${p.notes}\n` : ""}${p.completed ? "✅ סומן כנאסף\n" : "⏳ ממתין לאיסוף\n"}\n`;
    });

    text += `התעדכן בזמן אמת באפליקציית סהרון! 🚲🧡`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  // מפתח נהג ברירת מחדל בעת פתיחת הטופס במידה ולא נבחר
  useEffect(() => {
    if (drivers.length > 0 && !formDriverId) {
      setFormDriverId(drivers[0].id);
    }
  }, [drivers, formDriverId]);

  const openAddForm = (day: string, child: string) => {
    if (userRole !== "parent") return; // מורשה להורים בלבד
    setEditingPickup(null);
    setFormDay(day);
    setFormChildren([child]);
    setFormTime("13:30");
    setFormEndTime("");
    if (drivers.length > 0) {
      setFormDriverId(drivers[0].id);
    } else {
      setFormDriverId("unassigned");
    }
    setFormStatus("regular");
    setFormNotes("");
    setFormBabysitterType("none");
    setFormIsRecurring(true);
    setFormOverrideType("permanent");
    setIsQuickDriver(false);
    setIsFormOpen(true);
  };

  const openEditForm = (pickup: Pickup) => {
    if (userRole !== "parent") return; // מורשה להורים בלבד
    setEditingPickup(pickup);
    setFormDay(pickup.day);
    const parsed = pickup.childName.split(",").map(c => c.trim()).filter(Boolean);
    setFormChildren(parsed.length > 0 ? parsed : ["יובל"]);
    setFormTime(pickup.time);
    setFormEndTime(pickup.endTime || "");
    setFormDriverId(pickup.driverId || "unassigned");
    setFormStatus(pickup.status);
    setFormNotes(pickup.notes);
    setFormBabysitterType(pickup.babysitterType || "none");
    setFormIsRecurring(pickup.isRecurring !== false);
    setFormOverrideType(pickup.isOneTimeOverride ? "onetime" : "permanent");
    setIsQuickDriver(false);
    setIsFormOpen(true);
  };

  const handleSavePickup = (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== "parent") return; // מורשה להורים בלבד

    let targetDriverId = formDriverId;

    // האם הורים רשמו נהג אורח מהטופס השבועי? (קלט נהג מזדמן)
    if (isQuickDriver && quickDriverName && quickDriverPhone) {
      const added = StorageEngine.addDriver({
        name: quickDriverName,
        phone: quickDriverPhone,
        vehicleInfo: quickDriverCar,
        type: "guest",
        reminderOptIn: true,
      });
      targetDriverId = added.id;
      // איפוס קלט מהיר
      setQuickDriverName("");
      setQuickDriverPhone("");
      setQuickDriverCar("");
      setIsQuickDriver(false);
    }

    const childNamesString = formChildren.join(", ");
    let finalPickup: Pickup;

    if (editingPickup) {
      const oldDriverId = editingPickup.driverId;
      const isOneTime = formOverrideType === "onetime" && formIsRecurring;

      let originalVals = editingPickup.originalRecurringValues;
      if (isOneTime && !originalVals) {
        originalVals = {
          time: editingPickup.time,
          endTime: editingPickup.endTime || "",
          driverId: editingPickup.driverId,
          notes: editingPickup.notes,
          status: editingPickup.status,
          babysitterType: editingPickup.babysitterType || "none",
        };
      } else if (!isOneTime) {
        originalVals = undefined;
      }

      finalPickup = {
        ...editingPickup,
        day: formDay,
        childName: childNamesString,
        time: formTime,
        endTime: formEndTime,
        driverId: targetDriverId,
        status: formStatus,
        notes: formNotes,
        babysitterType: formBabysitterType,
        isRecurring: formIsRecurring,
        isOneTimeOverride: isOneTime,
        originalRecurringValues: originalVals,
      };

      StorageEngine.updatePickup(finalPickup);

      // זיהוי שינויים ודיווח לנהג המוגדר
      if (oldDriverId && oldDriverId !== "unassigned") {
        const hasMajorChanges =
          editingPickup.time !== formTime ||
          editingPickup.day !== formDay ||
          editingPickup.driverId !== targetDriverId ||
          editingPickup.childName !== childNamesString ||
          editingPickup.notes !== formNotes;

        if (hasMajorChanges) {
          const matchedDriver = drivers.find((d) => d.id === oldDriverId);
          if (matchedDriver) {
            // הוספת התראת מערכת ולוג מובנה לנהג
            StorageEngine.addAlert(
              `עדכון פרטי נסיעה: ${childNamesString}`,
              `הנסיעה ביום ${formDay} בשעה ${formTime} עודכנה על ידי ההורים.`,
              "urgent"
            );
            
            setDriverNotificationPending({
              driver: matchedDriver,
              pickup: finalPickup,
              actionType: "edit",
              oldPickup: {
                day: editingPickup.day,
                time: editingPickup.time,
                childName: editingPickup.childName,
                notes: editingPickup.notes,
              },
            });
          }
        }
      }
    } else {
      // יצירת חדש
      finalPickup = StorageEngine.addPickup({
        day: formDay,
        childName: childNamesString,
        time: formTime,
        endTime: formEndTime,
        driverId: targetDriverId,
        status: formStatus,
        notes: formNotes,
        completed: false,
        babysitterType: formBabysitterType,
        isRecurring: formIsRecurring,
      });
    }

    setIsFormOpen(false);
  };

  const handleDeletePickup = (id: string) => {
    if (userRole !== "parent") return; // מורשה להורים בלבד
    setDeleteConfirmId(id);
  };

  const executeDeletePickup = (id: string, mode: "onetime" | "permanent" = "permanent") => {
    const pickup = pickups.find((p) => p.id === id);
    if (pickup) {
      const oldDriverId = pickup.driverId;
      
      if (mode === "onetime") {
        const originalVals = pickup.originalRecurringValues || {
          time: pickup.time,
          driverId: pickup.driverId,
          notes: pickup.notes,
          status: pickup.status,
          babysitterType: pickup.babysitterType || "none",
        };
        StorageEngine.updatePickup({
          ...pickup,
          isOneTimeOverride: true,
          isOneTimeDeleted: true,
          originalRecurringValues: originalVals,
        });

        StorageEngine.addLog(
          "ביטול חד-פעמי",
          `בוטל זמנית (חד-פעמי לשבוע זה בלבד) האיסוף של ${pickup.childName} ביום ${pickup.day} בשעה ${pickup.time}.`,
          "parent",
          pickup.childName
        );
        StorageEngine.addAlert(
          "ביטול חד-פעמי",
          `ההסעה של ${pickup.childName} ביום ${pickup.day} בוטלה לשבוע הנוכחי בלבד (תוחזר אוטומטית בשבוע הבא).`,
          "success"
        );
      } else {
        StorageEngine.deletePickup(id);
      }

      if (oldDriverId && oldDriverId !== "unassigned") {
        const matchedDriver = drivers.find((d) => d.id === oldDriverId);
        if (matchedDriver) {
          StorageEngine.addAlert(
            `ביטול נסיעה: ${pickup.childName}`,
            `הנסיעה של יום ${pickup.day} בשעה ${pickup.time} בוטלה על ידי ההורים.`,
            "urgent"
          );

          setDriverNotificationPending({
            driver: matchedDriver,
            pickup: pickup,
            actionType: "delete",
          });
        }
      }
    }
    setDeleteConfirmId(null);
  };

  const executeResetWeek = () => {
    const masterBaseline = StorageEngine.getMasterPickups();
    const processed = masterBaseline.map((p) => {
      return {
        ...p,
        completed: false,
        isOneTimeDeleted: false,
        isOneTimeOverride: false,
        originalRecurringValues: undefined,
        notes: p.notes || "",
        status: p.status || "regular",
        babysitterType: p.babysitterType || "none"
      };
    });

    StorageEngine.savePickups(processed);
    StorageEngine.addLog("איפוס שבוע הבא", "בוצע איפוס גלובלי והתחלת שבוע חדש במערכת מלוח הבסיס השמור.", "parent");
    StorageEngine.addAlert("שבוע חדש התחיל!", "כל איסופי הלוח הקבוע שוחזרו מלוח הבסיס השמור ואופסו מביצוע בהצלחה!", "success");
    setResetWeekConfirmOpen(false);
  };

  const handleToggleCompletion = (id: string) => {
    if (userRole === "child") return; // ילדים יכולים רק לצפות

    const pickupItem = pickups.find((p) => p.id === id);
    if (userRole === "driver" && activeDriverId && pickupItem && pickupItem.driverId !== activeDriverId) {
      alert("שגיאת הרשאה: נהגים מורשים לסמן השלמה עבור נסיעות המשויכות אליהם בלבד!");
      return;
    }

    StorageEngine.togglePickupCompletion(id);
  };

  const handleDriverCannotPickup = (pickupItem: Pickup) => {
    const myDriverObject = drivers.find(d => d.id === activeDriverId);
    const driverName = myDriverObject ? myDriverObject.name : "נהג";
    
    // החזרת הנסיעה למאגר ללא הגדרת נהג
    StorageEngine.updatePickup({
      ...pickupItem,
      driverId: "unassigned",
      completed: false
    });

    StorageEngine.addLog(
      "ביטול שיבוץ",
      `הנהג/ת ${driverName} הודיע/ה כי לא יוכל/תוכל לבצע את האיסוף של ${pickupItem.childName} ביום ${pickupItem.day} בשעה ${pickupItem.time}. הנסיעה הוחזרה למאגר.`,
      "system",
      pickupItem.childName
    );

    StorageEngine.addAlert(
      `⚠️ דרוש נהג! עידכון מנהג (${pickupItem.childName})`,
      `${driverName} ביטל/ה את השיבוץ ליום ${pickupItem.day} בשעה ${pickupItem.time}. הנסיעה הוחזרה למאגר והיא דורשת שיבוץ מחדש!`,
      "urgent"
    );

    // הכנת פרטי ההתראה לשליחה מהירה להורים
    const msgText = `⚠️ *דיווח דחוף מנהג סהרון* ⚠️\n\nהיי,\nאני מצטער לעדכן שלא אוכל לבצע את האיסוף של *${pickupItem.childName}* ב*יום ${pickupItem.day}* בשעה *${pickupItem.time}*.\n\nהחזרתי את הנסיעה למאגר הכללי לשיבוץ מחדש. אנא ודאו שיבוץ נהג חלופי! 🧡`;
    
    const mamaDriver = drivers.find(d => d.id === "drv_mama");
    const papaDriver = drivers.find(d => d.id === "drv_papa");
    
    const cleanPhone = (pNum: string) => {
      let cleaned = pNum.replace(/[^0-9]/g, "");
      if (cleaned.startsWith("0")) {
        cleaned = "972" + cleaned.substring(1);
      }
      return cleaned;
    };
    
    const motherCleanPhone = mamaDriver ? cleanPhone(mamaDriver.phone) : "972549876543";
    const fatherCleanPhone = papaDriver ? cleanPhone(papaDriver.phone) : "972521234567";
    
    setCancellationMessagePrompt({
      pickup: pickupItem,
      parentMessage: msgText,
      motherName: mamaDriver?.name || "מיכל (אמא)",
      fatherName: papaDriver?.name || "ארז (אבא)",
      motherUrl: `https://api.whatsapp.com/send?phone=${motherCleanPhone}&text=${encodeURIComponent(msgText)}`,
      fatherUrl: `https://api.whatsapp.com/send?phone=${fatherCleanPhone}&text=${encodeURIComponent(msgText)}`,
      generalUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(msgText)}`
    });
  };

  // דיווח מהיר על שינויים וביטולים דחופים (מפעיל התראה מיידית)
  const handleUrgentReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalChild = urgentReportChild;
    let finalDay = urgentReportDay;
    let finalTime = urgentReportTime;

    // First find the pickup (if selected)
    let match = pickups.find(p => p.id === selectedUrgentPickupId);
    if (!match) {
      match = pickups.find(
        (p) => p.day === urgentReportDay && p.childName === urgentReportChild
      );
    }

    if (match) {
      finalChild = match.childName;
      finalDay = match.day;
      if (urgentReportType !== "cancel") {
        finalTime = urgentReportTime || match.time;
      } else {
        finalTime = match.time;
      }
    }

    if (urgentReportType === "cancel") {
      if (match) {
        StorageEngine.deletePickup(match.id);
      } else {
        StorageEngine.addLog(
          "ביטול הסעה - דחוף",
          `בוטל איסוף של ${finalChild} ביום ${finalDay} שתוכנן בסביבות שעה ${finalTime}. סיבה: ${urgentReportReason}`,
          "parent",
          finalChild
        );
        StorageEngine.addAlert(
          "בוטלה הסעה - דחוף!",
          `ההסעה המתוכננת של ${finalChild} ביום ${finalDay} בבוטלה בדחיפות. הערה: ${urgentReportReason}`,
          "urgent"
        );
      }
    } else {
      if (match) {
        StorageEngine.updatePickup({
          ...match,
          status: "urgent",
          time: finalTime,
          notes: `שינוי דחוף: ${urgentReportReason} (עדכון זמן אמת בשעה ${finalTime})`,
        });
      } else {
        const defaultDriver = drivers.length > 0 ? drivers[0].id : "";
        StorageEngine.addPickup({
          day: finalDay,
          childName: finalChild,
          time: finalTime,
          driverId: defaultDriver,
          status: "urgent",
          notes: `שינוי מהיר מעודכן: ${urgentReportReason}`,
          completed: false,
        });
      }
    }

    // Prepare WhatsApp links to BOTH parents (Erez and Michal)
    const father = drivers.find(d => d.id === "drv_papa") || { name: "ארז (אבא)", phone: "052-123-4567" };
    const mother = drivers.find(d => d.id === "drv_mama") || { name: "מיכל (אמא)", phone: "054-987-6543" };

    const formatPhoneForWa = (phone: string) => {
      let phoneNum = phone.replace(/[^0-9]/g, "");
      if (phoneNum.startsWith("0")) {
        phoneNum = "972" + phoneNum.substring(1);
      }
      return phoneNum;
    };

    const text = `🚨 *דיווח חירום / עדכון דחוף מסהרון* 🚨\n\n*סוג העדכון:* ${
      urgentReportType === "cancel" ? "🔴 ביטול הסעה קיימת" : "🟡 שינוי דחוף של הרגע האחרון"
    }\n*יום:* יום ${finalDay}\n*שעה:* ${finalTime}\n*עבור הילדים:* ${finalChild}\n*סיבה / עדכון:* ${urgentReportReason}\n\nהדיווח מעודכן כעת בלוח הבקרה! 🚗💨`;

    const fatherUrl = `https://api.whatsapp.com/send?phone=${formatPhoneForWa(father.phone)}&text=${encodeURIComponent(text)}`;
    const motherUrl = `https://api.whatsapp.com/send?phone=${formatPhoneForWa(mother.phone)}&text=${encodeURIComponent(text)}`;

    setUrgentReportSuccessMsg({
      fatherUrl,
      motherUrl,
      fatherName: father.name,
      motherName: mother.name,
      fatherSent: false,
      motherSent: false,
    });
  };

  // שליפת כל האיסופים הרלוונטיים ליום וילד ספציפיים (שלא תהיה הגבלה יומית)
  const getPickupsFor = (day: string, child: string): Pickup[] => {
    return pickups.filter((p) => p.day === day && p.childName.split(",").map(c => c.trim()).includes(child) && !p.isOneTimeDeleted);
  };

  // שליפת איסוף יחיד (הראשון) לצורכי תאימות במידת הצורך
  const getPickupFor = (day: string, child: string): Pickup | undefined => {
    return getPickupsFor(day, child)[0];
  };

  const unassignedPickups = pickups.filter(p => (!p.driverId || p.driverId === "unassigned") && !p.isOneTimeDeleted);

  return (
    <div className="space-y-6" id="scheduling_dashboard_module">
      {/* לוח ניהול שבועי להורים - התחלת שבוע חדש */}
      {userRole === "parent" && (
        <div className="bg-[#EEF2FF] border-4 border-[#141414] tech-shadow p-3 md:p-5 text-right font-mono" style={{ direction: "rtl" }}>
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 md:gap-4 flex-row-reverse text-right">
            <div className="hidden md:block space-y-1">
              <h4 className="text-sm font-black text-indigo-950 flex items-center gap-1.5 flex-row-reverse justify-end">
                <span>🔄 אתחול מחזור שבועי הבא / START NEW WEEK</span>
              </h4>
              <p className="text-xs text-indigo-950/90 leading-relaxed font-sans font-bold">
                מעבר קל לשבוע הבא: הכפתור ימחק אירועים חד-פעמיים שפג תוקפם השבוע, ישחזר את הגדרות המקור הקבועות של אירועים שעברו שינוי זמני, וינקה את סימוני ה-V של איסופים שבוצעו כדי לעבוד נקי בשבוע החדש!
              </p>
            </div>
            <button
              onClick={() => {
                setResetWeekConfirmOpen(true);
              }}
              className="w-full md:w-auto px-4 py-2.5 md:py-2 border-2 border-[#141414] bg-indigo-950 text-white hover:bg-white hover:text-black font-black text-xs shadow-[3px_3px_0_0_#141414] hover:shadow-none active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 flex-row-reverse cursor-pointer shrink-0"
              id="btn_start_new_week"
            >
              <span>שחזר והתחל שבוע חדש 🔄</span>
            </button>
          </div>
        </div>
      )}

      {/* כפתור דיווח מהיר על שינויים עליון */}
      {(userRole === "parent" || userRole === "driver") && (
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#FFD4D4] border-4 border-[#141414] tech-shadow p-5 flex-row-reverse text-right">
          <div className="space-y-1">
            <h4 className="text-sm font-black text-red-900 flex items-center gap-1.5 justify-end flex-row-reverse uppercase">
              <ShieldAlert className="hidden md:inline w-4 h-4 text-red-700 animate-pulse" />
              <span className="hidden sm:inline">עמדת עדכונים ושינויי הסעות של הרגע האחרון / EMERGENCY URGENT DISPATCH</span>
            </h4>
            <p className="hidden sm:block text-xs text-red-955 font-bold">كل שינוי או ביטול כאן מעדכן מיידית את המערכת ושולח דוח התראות להורים ולנהגים</p>
          </div>
          <button
            onClick={() => setIsUrgentReporterOpen(true)}
            className="px-4 py-2 border-2 border-[#141414] bg-[#141414] text-white hover:bg-white hover:text-black font-black text-xs shadow-[2px_2px_0_0_#141414] transition-all flex items-center gap-1.5 flex-row-reverse cursor-pointer"
            id="btn_report_urgent_change"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>דיווח דחוף על שינוי או ביטול / DISPATCH</span>
          </button>
        </div>
      )}

      {/* מדור נסיעות פנויות הממתינות לשיבוץ */}
      {unassignedPickups.length > 0 && (
        <div className="bg-[#FFFCE8] border-4 border-[#141414] tech-shadow p-5 text-right space-y-3 font-mono" style={{ direction: "rtl" }}>
          <h4 className="text-sm font-black text-amber-955 flex items-center gap-1.5 flex-row-reverse">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span>📋 נסיעות פנויות הממתינות לשיבוץ נהג ({unassignedPickups.length})</span>
          </h4>
          <p className="text-xs text-amber-950/85 font-black leading-normal">
            מזוהות נסיעות בלוח ללא נהג מוגדר. נהגים קבועים או אורחים יכולים לשבץ את עצמם בקליק מהיר:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {unassignedPickups.map((p) => {
              const driverNameActive = activeDriverId ? drivers.find(d => d.id === activeDriverId)?.name : "";
              const isUrgentUnassigned = isPickupLessThan12HoursAway(p.day, p.time, p.driverId);
              return (
                <div key={p.id} className={`bg-white p-3.5 flex flex-col justify-between space-y-2 hover:bg-amber-50/20 ${
                  isUrgentUnassigned 
                    ? "border-4 border-red-600 ring-4 ring-red-200" 
                    : "border-2 border-[#141414] shadow-[2px_2px_0_0_#141414]"
                }`}>
                  <div className="flex justify-between items-center flex-row-reverse border-b border-dashed border-slate-350 pb-1.5">
                    <span className="font-extrabold text-[#141414] text-xs">יום {p.day} • {p.time}</span>
                    <span className="bg-amber-100 text-amber-950 text-[10px] px-1.5 py-0.5 border border-amber-950 font-black font-mono">
                      {p.childName}
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 space-y-1">
                    {p.notes ? <p className="italic">🎯 &quot;{p.notes}&quot;</p> : <p className="text-slate-400">אין הערות מיוחדות</p>}
                    {p.babysitterType && p.babysitterType !== "none" && (
                      <span className="inline-block mt-1 font-black text-[10px] bg-indigo-50 text-[#141414] border border-indigo-300 px-1.5 py-0.5 rounded">
                        🧸 {p.babysitterType === "babysitter_only" ? "בייביסיטר בלבד" : "איסוף + בייביסיטר"}
                      </span>
                    )}
                  </div>
                  {userRole === "driver" && activeDriverId ? (
                    <button
                      onClick={() => {
                        StorageEngine.updatePickup({ ...p, driverId: activeDriverId });
                        StorageEngine.addLog(
                          "שיבוץ נהג עצמי",
                          `הנהג/ת ${driverNameActive || activeDriverId} לקח/ה אחריות על האיסוף של ${p.childName} ביום ${p.day} בשעה ${p.time}.`,
                          "system",
                          p.childName
                        );
                        StorageEngine.addAlert(
                          "שיבוץ נסיעה פנויה",
                          `${driverNameActive || "נהג"} שיבץ/ה את עצמו לאיסוף של ${p.childName} ביום ${p.day}.`,
                          "success"
                        );
                      }}
                      className="w-full py-1.5 text-center bg-[#141414] text-white hover:bg-white hover:text-black hover:border-black font-black text-[11px] border-2 border-[#141414] transition-all cursor-pointer shadow-[2px_2px_0_0_#141414] active:translate-y-0.5 active:shadow-none"
                    >
                      🖐 אני אקח את זה!
                    </button>
                  ) : (
                    <p className="text-[10px] text-amber-900 border border-transparent italic">אנא התחבר כמלווה/נהג כדי לשבץ את עצמך</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* כותרת המדור ופיקוח */}
      <div className="flex flex-col md:flex-row-reverse justify-between items-center gap-4 border-b-4 border-[#141414] pb-4">
        <div className="text-right w-full md:w-auto">
          <span className="hidden md:inline-block text-[10px] font-mono font-bold uppercase tracking-wider bg-[#141414] text-[#E4E3E0] px-2 py-0.5 border border-[#141414]">
            לוח בקרה שבועי / WEEKLY CONTROL GRID
          </span>
          <h2 className="hidden sm:block text-2xl font-black text-[#141414] mt-1 font-serif uppercase italic font-sans">תוכנית האיסופים השבועית</h2>
          <p className="hidden sm:block text-xs text-slate-700 mt-1 font-mono">מפגש שבועי המפצל את ההסעות לפי 3 הילדים. כחול = קבוע, כתום/אדום = דחוף.</p>
        </div>

        {/* כפתור תיאום נסיעה מרכזי להורים במכשיר שולחן עבודה */}
        {userRole === "parent" && (
          <button
            onClick={() => openAddForm("ראשון", "יובל")}
            className="hidden md:flex px-6 py-3 bg-[#EEF2FF] hover:bg-[#141414] text-indigo-950 hover:text-white font-black text-xs border-4 border-[#141414] shadow-[4px_4px_0_0_#141414] hover:shadow-none active:translate-y-0.5 transition-all items-center gap-1.5 flex-row-reverse cursor-pointer font-sans shrink-0 uppercase tracking-wide"
            id="parent_desktop_add_pickup_central_btn"
          >
            <Plus className="w-4 h-4 text-indigo-900" />
            <span>➕ תיאום נסיעה חדשה / CREATE NEW ENTRY</span>
          </button>
        )}

        {/* טאבים על ימים במובייל / סינונים */}
        <div className="md:hidden grid grid-cols-7 gap-1 bg-[#D1D0CC] p-1.5 border-4 border-[#141414] w-full select-none text-center shadow-[4px_4px_0_0_#141414]" style={{ direction: "rtl" }}>
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = selectedDayTab === day;
            const shortName = day === "ראשון" ? "א'" : day === "שני" ? "ב'" : day === "שלישי" ? "ג'" : day === "רביעי" ? "ד'" : day === "חמישי" ? "ה'" : day === "שישי" ? "ו'" : "שב'";
            return (
              <button
                key={day}
                onClick={() => setSelectedDayTab(day)}
                className={`py-5 px-1 text-center transition-all cursor-pointer font-black flex flex-col items-center justify-center border-2 border-[#141414] ${
                  isSelected
                    ? "bg-[#141414] text-white"
                    : "bg-white text-[#141414] hover:bg-slate-50"
                }`}
              >
                <span className="text-base font-black leading-none">{shortName}</span>
                <span className="text-[11px] font-black leading-none mt-1.5 block">{day}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* פילטר ייחודי למצב נהג פעיל */}
      {userRole === "driver" && activeDriverId && (
        <div className="bg-[#E4E3E0] border-4 border-[#141414] p-4 flex flex-col md:flex-row justify-between items-center gap-4 text-right" style={{ direction: "rtl" }}>
          <div className="space-y-1">
            <h4 className="text-sm font-black text-[#141414] uppercase flex items-center gap-1.5 flex-row-reverse">
              <Sparkles className="hidden md:inline w-4 h-4 text-indigo-600 animate-bounce" />
              <span className="hidden md:inline">מצב סינון לוח שבועי / WEEKLY CONTROL MODE</span>
            </h4>
            <p className="hidden sm:block text-xs text-slate-700 font-medium">כנהג משפחתי פעיל, באפשרותך לסנן את הלוח כדי להתרכז רק במשימות שלך השבוע, או לצפות בכלל נסיעות הבית.</p>
          </div>
          <div className="flex bg-white border-2 border-[#141414] p-1 shadow-[2px_2px_0_0_#141414] w-full md:w-auto flex-1 select-none">
            <button
              onClick={() => setDriverFilter("only-mine")}
              className={`flex-1 md:flex-initial text-center px-4 py-2.5 text-xs font-black transition-all cursor-pointer ${
                driverFilter === "only-mine"
                  ? "bg-[#141414] text-white"
                  : "bg-white text-slate-705 hover:bg-[#F2F2EF]"
              }`}
            >
              רק הנסיעות שלי השבוע 🚗
            </button>
            <button
              onClick={() => setDriverFilter("all")}
              className={`flex-1 md:flex-initial text-center px-4 py-2.5 text-xs font-black transition-all border-r-2 border-[#141414] cursor-pointer ${
                driverFilter === "all"
                  ? "bg-[#141414] text-white"
                  : "bg-white text-slate-705 hover:bg-[#F2F2EF]"
              }`}
            >
              כל הנסיעות המשפחתיות 🌐
            </button>
          </div>
        </div>
      )}

      {userRole === "driver" && activeDriverId && (
        <div className="bg-amber-50 border-4 border border-[#141414] border-t-0 p-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-right shadow-[3px_3px_0_0_#141414]" style={{ direction: "rtl" }}>
          <div className="space-y-1">
            <h5 className="text-xs font-bold text-amber-950 flex items-center gap-1 flex-row-reverse">
              <span className="hidden sm:inline">📅 סנכרון ונוחות מובייל / LOCAL CALENDAR & SHARE</span>
            </h5>
            <p className="hidden sm:block text-[11px] text-amber-950/80 leading-relaxed font-bold">באפשרותך לייצא את הנסיעות השבועות שלך ישירות ליומן המקומי במכשיר הנייד (כמו Google Calendar או Apple Calendar) או לשתף את כל הלוח שלך בקבוצה המשפחתית בוואטסאפ.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={() => exportDriverCalendar(activeDriverId)}
              className="w-full sm:w-auto bg-[#141414] hover:bg-[#2e2e2c] text-white border-2 border-[#141414] px-4 py-2 text-xs font-black shadow-[2px_2px_0_0_#d1d0cc] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-row-reverse"
            >
              <span>יצא ליומן המקומי (iCal) 📥</span>
            </button>
            <button
              onClick={() => shareDriverWeeklySchedule(activeDriverId)}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-[#141414] px-4 py-2 text-xs font-black shadow-[2px_2px_0_0_#141414] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-row-reverse"
            >
              <span>שתף את כל הלוח בוואטסאפ 💬</span>
            </button>
          </div>
        </div>
      )}

      {/* תצוגת גריד מלאה לשולחן עבודה (RTL Desktop Grid) */}
      <div className="hidden md:block overflow-x-auto p-4 bg-[#FFFDF9] border-4 border-[#141414] tech-shadow" id="weekly_grid_export_target">
        <table className="w-full text-right border-4 border-[#141414] border-collapse bg-white font-mono">
          <thead>
            <tr className="border-b-4 border-[#141414] bg-[#D1D0CC]">
              <th className="py-3 px-4 text-xs font-black text-[#141414] w-36 border-l-2 border-[#141414]">יום בשבוע</th>
              <th className="py-3 px-4 text-sm font-black text-[#141414] text-right border-l-2 border-[#141414] last:border-l-0">
                <div className="flex justify-between items-center flex-row-reverse">
                  <span className="bg-[#141414] text-white px-3 py-1 font-bold border border-[#141414] tracking-wider">
                    נסיעות ואיסופים לפי סדר כרונולוגי / CHRONOLOGICAL RIDES
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-[#141414]">
            {DAYS_OF_WEEK.map((day) => {
              // Get all pickups for this day
              let items = pickups.filter((p) => p.day === day && !p.isOneTimeDeleted);
              
              // Sort them by time
              items.sort((a, b) => a.time.localeCompare(b.time));

              // Filter for the active driver if needed
              if (userRole === "driver" && activeDriverId && driverFilter === "only-mine") {
                items = items.filter(item => item.driverId === activeDriverId);
              }

              return (
                <tr key={day} className="hover:bg-[#F2F2EF] transition-colors">
                  {/* עמודת היום */}
                  <td className="py-5 px-4 font-black text-[#141414] text-sm align-middle bg-[#D1D0CC] border-l-4 border-b-2 border-[#141414] w-36">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-1.5 flex-row-reverse">
                        <Calendar className="w-4 h-4" />
                        <span className="font-serif italic text-base">יום {day}</span>
                      </div>
                      {userRole === "parent" && (
                        <button
                          onClick={() => openAddForm(day, "יובל")}
                          className="mt-1 w-full px-2 py-1.5 bg-white hover:bg-[#141414] hover:text-white border-2 border-[#141414] text-[10px] font-black shadow-[1.5px_1.5px_0_0_#141414] active:translate-y-0.5 cursor-pointer text-center whitespace-nowrap"
                        >
                          + הוספת איסוף
                        </button>
                      )}
                    </div>
                  </td>

                  {/* נסיעות של אותו היום מסודרות לפי זמן */}
                  <td className="py-3 px-3 align-top">
                    {items.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map((item) => {
                          const driver = drivers.find((d) => d.id === item.driverId);
                          const isMyRide = userRole === "driver" && activeDriverId && item.driverId === activeDriverId;
                          const isOtherRide = userRole === "driver" && activeDriverId && item.driverId !== activeDriverId;
                          const isUrgentUnassigned = isPickupLessThan12HoursAway(item.day, item.time, item.driverId);

                          return (
                            <motion.div
                              key={item.id}
                              layoutId={`pickup_card_${item.id}_chrono`}
                              className={`p-4 transition-all relative group overflow-hidden ${
                                isUrgentUnassigned
                                  ? "border-4 border-red-600 ring-4 ring-red-300 ring-offset-1 bg-red-50/25 shadow-none"
                                  : isMyRide
                                  ? "bg-emerald-50 border-emerald-500 ring-4 ring-emerald-300 ring-offset-1 shadow-none border-2"
                                  : isOtherRide
                                  ? "bg-slate-50 opacity-40 grayscale-[50%] contrast-75 cursor-not-allowed select-none pointer-events-none border-2 border-[#141414]"
                                  : item.completed
                                  ? "bg-[#E4E3E0] opacity-85 shadow-none border-2 border-[#141414]"
                                  : item.status === "urgent"
                                  ? "bg-[#FFD4D4] shadow-[4px_4px_0_0_#141414] border-2 border-[#141414]"
                                  : "bg-white shadow-[2px_2px_0_0_#141414] hover:shadow-[4px_4px_0_0_#141414] border-2 border-[#141414]"
                              }`}
                            >
                              {/* שינוי דחוף - סטטוס פעימה גראפית */}
                              {item.status === "urgent" && !item.completed && (
                                <span className="absolute top-0 right-0 left-0 h-1.5 bg-red-600"></span>
                              )}

                              {isMyRide && (
                                <div className="absolute top-0 right-0 left-0 bg-emerald-500 text-white text-[9px] font-black tracking-wider text-center py-0.5">
                                  ★ הנסיעה המשויכת אליך ★
                                </div>
                              )}

                              <div className="flex justify-between items-start gap-2 flex-row-reverse mb-2 mt-1.5">
                                {/* שעה מודגשת */}
                                <span className="inline-flex items-center gap-1 text-sm font-black text-black bg-[#E4E3E0] border border-[#141414] px-2 py-0.5 flex-row-reverse">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span className="font-mono">{item.endTime ? `${item.time} - ${item.endTime}` : item.time}</span>
                                </span>

                                {/* סוג סטטוס */}
                                <span
                                  className={`text-[10px] px-2 py-0.5 border border-[#141414] font-black uppercase tracking-wider font-mono ${
                                    item.completed
                                      ? "bg-[#D1D0CC] text-[#141414]"
                                      : item.status === "urgent"
                                      ? "bg-red-600 text-white animate-pulse"
                                      : "bg-[#141414] text-white"
                                  }`}
                                >
                                  {item.completed ? "CLOSED" : item.status === "urgent" ? "URGENT !!" : "REGULAR"}
                                </span>
                              </div>

                              {/* תגיות ילד ובייביסיטר */}
                              <div className="flex flex-row-reverse flex-wrap gap-1.5 mt-2">
                                <span className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-900 text-indigo-950 font-black text-[10.5px] px-2 py-0.5 rounded shadow-[1px_1px_0_0_#1e1b4b] flex-row-reverse">
                                  <span>👦🧒</span>
                                  <span>עבור: {item.childName}</span>
                                </span>

                                {item.babysitterType && item.babysitterType !== "none" && (
                                  <span className="inline-flex items-center gap-1.5 bg-amber-50 border-2 border-amber-900 text-amber-950 font-black text-[10.5px] px-2 py-0.5 rounded shadow-[1px_1px_0_0_#78350f] flex-row-reverse">
                                    <span>🧸</span>
                                    <span>
                                      {item.babysitterType === "babysitter_only"
                                        ? "בייביסיטר בלבד"
                                        : "איסוף + בייביסיטר"}
                                    </span>
                                  </span>
                                )}
                              </div>

                              {/* אינדיקטור שבועי / שינוי חד פעמי */}
                              {item.isOneTimeOverride ? (
                                <div className="mt-2 flex flex-row-reverse flex-wrap items-center justify-start gap-1">
                                  <span className="inline-flex items-center gap-1 bg-amber-100 border border-amber-500 text-amber-950 font-black text-[9.5px] px-1.5 py-0.5 rounded flex-row-reverse shadow-[1px_1px_0_0_#141414]">
                                    <span>⚡</span>
                                    <span>שינוי חד-פעמי השבוע</span>
                                  </span>
                                  {userRole === "parent" && (
                                    <button
                                      onClick={() => {
                                        if (confirm("האם להחזיר את ההסעה הזו להגדרות הקבועות המקוריות שלה?")) {
                                          StorageEngine.updatePickup({
                                            ...item,
                                            time: item.originalRecurringValues?.time ?? item.time,
                                            driverId: item.originalRecurringValues?.driverId ?? item.driverId,
                                            notes: item.originalRecurringValues?.notes ?? item.notes,
                                            status: item.originalRecurringValues?.status ?? item.status,
                                            babysitterType: item.originalRecurringValues?.babysitterType ?? item.babysitterType,
                                            isOneTimeOverride: false,
                                            originalRecurringValues: undefined,
                                          });
                                        }
                                      }}
                                      className="text-[9.5px] font-black text-amber-900 hover:text-black cursor-pointer bg-white px-1.5 py-0.5 border border-amber-300 rounded shadow-[1px_1px_0_0_#141414]"
                                      title="בטל חריגה ושחזר ערכי קבוע מקוריים"
                                    >
                                      ↩️ שחזר לקבוע
                                    </button>
                                  )}
                                </div>
                              ) : (
                                item.isRecurring !== false && (
                                  <div className="mt-2 text-right font-sans">
                                    <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-350 text-slate-800 font-bold text-[9px] px-2 py-0.5 rounded flex-row-reverse">
                                      <span>🔄</span>
                                      <span>אירוע שבועי קבוע</span>
                                    </span>
                                  </div>
                                )
                              )}

                              {/* פרטי הנהג והרכב */}
                              <div className="space-y-1.5 text-right mt-3">
                                <div className="flex items-center gap-1.5 flex-row-reverse text-sm font-bold text-slate-900">
                                  {(!item.driverId || item.driverId === "unassigned") ? (
                                    <div className="flex flex-col items-end w-full space-y-1.5">
                                      <span className="text-red-700 font-extrabold bg-red-100 border-2 border-red-400 px-2.5 py-1 text-xs animate-pulse rounded flex items-center gap-1 flex-row-reverse">
                                        ⚠️ דרוש נהג! (נסיעה פנויה)
                                      </span>
                                      {userRole === "driver" && activeDriverId && (
                                        <button
                                          onClick={() => {
                                            const myDriverObject = drivers.find(d => d.id === activeDriverId);
                                            StorageEngine.updatePickup({
                                              ...item,
                                              driverId: activeDriverId
                                            });
                                            StorageEngine.addLog(
                                              "שיבוץ נהג עצמי",
                                              `הנהג/ת ${myDriverObject ? myDriverObject.name : activeDriverId} לקח/ה אחריות על האיסוף של ${item.childName} ביום ${item.day} בשעה ${item.time}.`,
                                              "system",
                                              item.childName
                                            );
                                            StorageEngine.addAlert(
                                              "נסיעה שובצה בהצלחה!",
                                              `${myDriverObject ? myDriverObject.name : "נהג"} שיבץ את עצמו לאיסוף של ${item.childName} ביום ${item.day}.`,
                                              "success"
                                            );
                                          }}
                                          className="w-full text-center py-1.5 px-3 bg-emerald-600 text-white font-black text-xs hover:bg-[#141414] border-2 border-emerald-950 transition-all cursor-pointer shadow-[2px_2px_0_0_#064e3b] active:translate-y-0.5 active:shadow-none"
                                        >
                                          🖐 אני אאסוף! (שייך אלי)
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <>
                                      <User className="w-4 h-4 text-slate-700" />
                                      <span className="font-bold underline">{driver ? driver.name : "רכב לא ידוע"}</span>
                                      {driver?.type === "guest" && (
                                        <span className="bg-orange-100 text-orange-900 border border-orange-500 text-[9px] font-black font-mono px-1">GUEST</span>
                                      )}
                                    </>
                                  )}
                                </div>

                                {driver?.phone && (
                                  <div className="text-xs text-slate-700 flex items-center gap-1 flex-row-reverse font-mono">
                                    <Phone className="w-3.5 h-3.5" />
                                    <a href={`tel:${driver.phone}`} className="hover:text-black font-bold ltr">
                                      {driver.phone}
                                    </a>
                                  </div>
                                )}

                                {/* הערות סציפיות */}
                                {item.notes ? (
                                  <p className="text-xs text-slate-700 bg-[#E4E3E0] p-2 border-r-4 border-[#141414] mt-2 font-mono text-right" style={{ direction: 'rtl' }}>
                                    {item.notes}
                                  </p>
                                ) : (
                                  <p className="text-xs italic text-slate-500 mt-1">אין הערות נוספות</p>
                                )}
                              </div>

                              {/* מערכת כפתורים חכמה */}
                              <div className="mt-4 pt-3 border-t-2 border-[#141414] flex justify-between items-center gap-2 flex-row-reverse">
                                {/* סימון השלמה לילד או הורה */}
                                <button
                                  onClick={() => handleToggleCompletion(item.id)}
                                  className={`flex items-center gap-1 text-xs font-black px-2 py-1 border border-[#141414] transition-all cursor-pointer flex-row-reverse ${
                                    item.completed
                                      ? "bg-emerald-100 text-emerald-950 font-black"
                                      : "bg-[#D1D0CC] text-slate-800 hover:bg-[#141414] hover:text-white"
                                  }`}
                                  title={item.completed ? "סמן כלא בוצע" : "סמן כהושלם בהצלחה!"}
                                >
                                  <CheckCircle className={`w-4 h-4 ${item.completed ? "text-emerald-700 fill-emerald-110" : ""}`} />
                                  <span>{item.completed ? "נאסף!" : "נאסף?"}</span>
                                </button>

                                {/* כפתור WhatsApp מהיר - זמין להורים, וכן לנהג המשויך כחלק מהתיאום */}
                                {(userRole === "parent" || isMyRide) && (
                                  <button
                                    onClick={() => shareOnWhatsApp(item)}
                                    className="p-1 px-1.5 text-white bg-[#25D366] hover:bg-[#128C7E] border border-[#141414] shadow-[1px_1px_0_0_#141414] font-black text-[9px] flex items-center gap-1 cursor-pointer transition-colors"
                                    title="שלח תזכורת ופרטים ב-WhatsApp"
                                  >
                                    <MessageSquare className="w-3 h-3 text-white fill-white" />
                                    <span>WhatsApp</span>
                                  </button>
                                )}

                                {/* כפתור ביטול שיבוץ מהיר לנהג (החזרת הנסיעה למאגר) */}
                                {isMyRide && (
                                  <button
                                    onClick={() => handleDriverCannotPickup(item)}
                                    className="p-1 px-1.5 text-red-950 bg-rose-50 hover:bg-rose-100 border border-red-900 shadow-[1px_1px_0_0_#991b1b] font-black text-[9px] flex items-center gap-1 cursor-pointer transition-colors"
                                    title="דווח שלא תוכל לבצע איסוף זה והחזר למאגר"
                                  >
                                    <span>🛑 לא יכול לאסוף</span>
                                  </button>
                                )}

                                {/* הרשאות הורים - מחיקה ועריכה */}
                                {userRole === "parent" && (
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => openEditForm(item)}
                                      className="p-1 text-slate-705 hover:text-black hover:bg-slate-100 border border-transparent hover:border-[#141414] transition-colors cursor-pointer"
                                      title="עריכת פרטי הסעה"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeletePickup(item.id)}
                                      className="p-1 text-slate-705 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-[#141414] transition-colors cursor-pointer"
                                      title="בטל הסעה"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="w-full py-6 border-2 border-dashed border-slate-300 text-center text-slate-500 font-mono text-xs italic bg-[#F2F2EF]">
                        אין נסיעות ליום זה
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* תצוגת מובייל יומית (Mobile View only selected Day Tab) */}
      <div className="md:hidden space-y-4 font-mono" id="mobile_day_layout">
        <div className="flex flex-col gap-2.5">
          <h3 className="text-sm font-black text-[#141414] text-right uppercase border-r-4 border-[#141414] pr-2">הסעות ליום {selectedDayTab} / DAILY LOG:</h3>
          
          {/* כפתור הוספה מרכזי להורים לתיאום קל ממקום אחד (יבקש יום, ילד, שעה וכו') */}
          {userRole === "parent" && (
            <button
              onClick={() => openAddForm(selectedDayTab, "יובל")}
              className="w-full py-3 bg-[#EEF2FF] hover:bg-white text-indigo-950 hover:text-black font-black text-xs border-2 border-dashed border-[#141414] shadow-[3px_3px_0_0_#141414] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5 flex-row-reverse cursor-pointer font-sans"
              id="parent_mobile_add_pickup_central_btn"
            >
              <Plus className="w-4 h-4 text-indigo-900" />
              <span>➕ תיאום נסיעה חדשה (בחירת יום, שעה וילד בטופס)</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4">
          {(() => {
            let items = pickups.filter((p) => p.day === selectedDayTab && !p.isOneTimeDeleted);
            items.sort((a, b) => a.time.localeCompare(b.time));

            // סינון במובייל לנהג הפעיל
            if (userRole === "driver" && activeDriverId && driverFilter === "only-mine") {
              items = items.filter(item => item.driverId === activeDriverId);
            }

            if (items.length > 0) {
              return (
                <div className="bg-white border-2 border-[#141414] p-4 text-right shadow-[2px_2px_0_0_#141414]">
                  <div className="border-b-2 border-[#141414] pb-2 mb-3 flex justify-between items-center flex-row-reverse">
                    <span className="font-black text-[#141414] text-sm uppercase">הסעות ליום {selectedDayTab} / RIDES FOR {selectedDayTab}</span>
                  </div>

                  <div className="space-y-4">
                    {items.map((item, idx) => {
                      const driver = drivers.find((d) => d.id === item.driverId);
                      const isMyRide = userRole === "driver" && activeDriverId && item.driverId === activeDriverId;
                      const isUrgentUnassigned = isPickupLessThan12HoursAway(item.day, item.time, item.driverId);

                      return (
                        <div key={item.id} className={`p-3 space-y-3 relative ${idx > 0 ? "mt-4 pt-4 border-t-2 border-dashed border-[#141414]" : ""} ${
                          isUrgentUnassigned 
                            ? "border-4 border-red-600 ring-4 ring-red-300 ring-offset-1 bg-red-50/25" 
                            : isMyRide 
                            ? "bg-emerald-50 border-emerald-500 border-2" 
                            : "border-2 border-[#141414]"
                        }`}>
                          <div className="flex justify-between items-center flex-row-reverse">
                            <span className="inline-flex items-center gap-1 text-sm font-black text-black bg-[#E4E3E0] border border-[#141414] px-2 py-0.5 flex-row-reverse font-mono">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{item.endTime ? `${item.time} - ${item.endTime}` : item.time}</span>
                            </span>

                            <span
                              className={`text-[10px] px-2 py-0.5 border border-[#141414] font-bold ${
                                item.status === "urgent" ? "bg-red-600 text-white animate-pulse" : "bg-[#141414] text-white"
                              }`}
                            >
                              {item.status === "urgent" ? "URGENT !!" : "REGULAR"}
                            </span>
                          </div>

                          <div className="flex flex-row-reverse flex-wrap gap-1.5 mt-1">
                            <span className="inline-flex items-center gap-1 bg-indigo-50 border-2 border-indigo-900 text-indigo-950 font-black text-[10.5px] px-2 py-0.5 rounded shadow-[1px_1px_0_0_#1e1b4b] flex-row-reverse">
                              <span>👦🧒</span>
                              <span>עבור: {item.childName}</span>
                            </span>

                            {item.babysitterType && item.babysitterType !== "none" && (
                              <span className="inline-flex items-center gap-1.5 bg-amber-50 border-2 border-amber-900 text-amber-950 font-black text-[10.5px] px-2 py-0.5 rounded shadow-[1px_1px_0_0_#78350f] flex-row-reverse">
                                <span>🧸</span>
                                <span>{item.babysitterType === "babysitter_only" ? "בייביסיטר" : "גם וגם"}</span>
                              </span>
                            )}
                          </div>

                          {/* אינדיקטור שבועי / שינוי חד פעמי למובייל */}
                          {item.isOneTimeOverride ? (
                            <div className="flex flex-row-reverse flex-wrap items-center justify-start gap-1 mt-1">
                              <span className="inline-flex items-center gap-1 bg-amber-100 border border-amber-500 text-amber-950 font-black text-[9.5px] px-2 py-0.5 rounded flex-row-reverse">
                                <span>⚡</span>
                                <span>שינוי חד-פעמי השבוע</span>
                              </span>
                              {userRole === "parent" && (
                                <button
                                  onClick={() => {
                                    if (confirm("האם להחזיר את ההסעה הזו להגדרות הקבועות המקוריות שלה?")) {
                                      StorageEngine.updatePickup({
                                        ...item,
                                        time: item.originalRecurringValues?.time ?? item.time,
                                        driverId: item.originalRecurringValues?.driverId ?? item.driverId,
                                        notes: item.originalRecurringValues?.notes ?? item.notes,
                                        status: item.originalRecurringValues?.status ?? item.status,
                                        babysitterType: item.originalRecurringValues?.babysitterType ?? item.babysitterType,
                                        isOneTimeOverride: false,
                                        originalRecurringValues: undefined,
                                      });
                                    }
                                  }}
                                  className="text-[9.5px] font-black text-amber-900 underline hover:text-black cursor-pointer bg-white px-1.5 py-0.5 border border-amber-300"
                                >
                                  ↩️ שחזר לקבוע
                                </button>
                              )}
                            </div>
                          ) : (
                            item.isRecurring !== false && (
                              <div className="text-right mt-1 font-sans">
                                <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-350 text-slate-800 font-bold text-[9px] px-2 py-0.5 rounded flex-row-reverse">
                                  <span>🔄</span>
                                  <span>אירוע שבועי קבוע</span>
                                </span>
                              </div>
                            )
                          )}

                          <div className="space-y-1 text-slate-800 text-xs text-right animate-transition">
                            {(!item.driverId || item.driverId === "unassigned") ? (
                              <div className="space-y-1.5 mt-1">
                                <p className="text-red-700 font-extrabold bg-red-100 border border-red-400 p-1.5 text-xs text-center rounded">
                                  ⚠️ דרוש נהג! (נסיעה פנויה)
                                </p>
                                {userRole === "driver" && activeDriverId && (
                                  <button
                                    onClick={() => {
                                      StorageEngine.updatePickup({ ...item, driverId: activeDriverId });
                                      StorageEngine.addLog(
                                        "שיבוץ נהג עצמי",
                                        `הנהג/ת ${drivers.find(d => d.id === activeDriverId)?.name || activeDriverId} שיבץ/ה את עצמו לאיסוף של ${item.childName} ביום ${item.day} בשעה ${item.time}.`,
                                        "system",
                                        item.childName
                                      );
                                    }}
                                    className="w-full text-center py-1.5 px-3 bg-emerald-600 text-white font-black text-xs hover:bg-emerald-700 border border-emerald-950 transition-all cursor-pointer shadow-[2px_2px_0_0_#064e3b]"
                                  >
                                    🖐 שבץ אותי כנהג!
                                  </button>
                                )}
                              </div>
                            ) : (
                              <p className="font-bold flex items-center gap-1 justify-end flex-row-reverse">
                                <User className="w-4 h-4 text-slate-800" />
                                <span>נהג/ת: {driver ? driver.name : "לא ידוע"}</span>
                              </p>
                            )}
                            {driver?.phone && (
                              <p className="flex items-center gap-1 justify-end flex-row-reverse">
                                <Phone className="w-3.5 h-3.5 text-slate-800" />
                                <a href={`tel:${driver.phone}`} className="hover:text-black font-bold ltr underline">
                                  {driver.phone}
                                </a>
                              </p>
                            )}
                            {item.notes && (
                              <p className="bg-[#E4E3E0] p-2 border-r-4 border-[#141414] text-slate-800 mt-2 text-right font-mono text-xs">
                                <strong>הערה: </strong> {item.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t border-slate-350 flex-row-reverse gap-2">
                            <button
                              onClick={() => handleToggleCompletion(item.id)}
                              className={`flex items-center gap-1 text-xs font-black px-2.5 py-1.5 border border-[#141414] transition-all cursor-pointer flex-row-reverse ${
                                item.completed
                                  ? "bg-emerald-100 text-emerald-900"
                                  : "bg-[#D1D0CC] text-slate-800"
                              }`}
                            >
                              <CheckCircle className="w-4 h-4 text-emerald-700" />
                              <span>{item.completed ? "נאסף!" : "איסוף בוצע?"}</span>
                            </button>

                            {/* כפתור WhatsApp מהיר - זמין להורים, וכן לנהג המשויך כחלק מהתיאום */}
                            {(userRole === "parent" || isMyRide) && (
                              <button
                                onClick={() => shareOnWhatsApp(item)}
                                className="p-1 px-1.5 text-white bg-[#25D366] hover:bg-[#128C7E] border border-[#141414] shadow-[1px_1px_0_0_#141414] font-black text-[9px] flex items-center gap-1 cursor-pointer transition-colors"
                                title="שלח תזכורת ופרטים ב-WhatsApp"
                              >
                                <MessageSquare className="w-3 h-3 text-white fill-white" />
                                <span>WhatsApp</span>
                              </button>
                            )}

                            {/* כפתור ביטול שיבוץ מהיר לנהג (החזרת הנסיעה למאגר) */}
                            {isMyRide && (
                              <button
                                onClick={() => handleDriverCannotPickup(item)}
                                className="p-1 px-1.5 text-red-950 bg-rose-50 hover:bg-rose-100 border border-red-900 shadow-[1px_1px_0_0_#991b1b] font-black text-[9px] flex items-center gap-1 cursor-pointer transition-colors"
                                title="דווח שלא תוכל לבצע איסוף זה והחזר למאגר"
                              >
                                <span>🛑 לא יכול לאסוף</span>
                              </button>
                            )}

                            {userRole === "parent" && (
                              <div className="flex gap-2 shrink-0">
                                <button
                                  onClick={() => openEditForm(item)}
                                  className="p-1 text-slate-705 hover:text-black border border-transparent hover:border-[#141414] hover:bg-slate-100"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeletePickup(item.id)}
                                  className="p-1 text-slate-705 hover:text-red-700 border border-transparent hover:border-[#141414] hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            } else {
              return (
                <div className="bg-white border-2 border-[#141414] p-6 text-center shadow-[2px_2px_0_0_#141414]">
                  <p className="text-xs text-slate-500 italic">אין איסוף רשום ליום זה</p>
                </div>
              );
            }
          })()}
        </div>
      </div>

      {/* רשימת שאר נסיעות המשפחה השבוע - להשפעת תיאום גמיש (מופיע רק במצב נהג פעיל שחוסך מקום) */}
      {userRole === "driver" && activeDriverId && driverFilter === "only-mine" && (
        <div className="bg-[#141414]/5 rounded-xl border-2 border-[#141414]/20 p-5 mt-4 space-y-3 font-mono" style={{ direction: "rtl" }}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#141414]/15 pb-2">
            <h4 className="text-sm font-black text-[#141414] text-right">
              📅 נסיעות של נהגים אחרים השבוע / Other Drivers' Pickups
            </h4>
            <span className="text-[10px] font-bold text-slate-500 uppercase">
              מידע בלבד (לצורך תיאום משפחתי)
            </span>
          </div>

          {pickups.filter(p => p.driverId !== activeDriverId && !p.isOneTimeDeleted).length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center py-4">אין נסיעות שבועיות נוספות משויכות לנהגים אחרים.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {pickups
                .filter(p => p.driverId !== activeDriverId && !p.isOneTimeDeleted)
                .sort((a, b) => {
                  const dayOrder = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
                  const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
                  if (dayDiff !== 0) return dayDiff;
                  return a.time.localeCompare(b.time);
                })
                .map((pickup) => {
                  const otherDriver = drivers.find(d => d.id === pickup.driverId);
                  return (
                    <div key={pickup.id} className="bg-white border border-[#141414] p-3 shadow-[1.5px_1.5px_0_0_#141414] text-right space-y-1.5 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center flex-row-reverse pb-1.5 border-b border-slate-100 mb-1.5">
                          <span className="text-xs font-black text-black">יום {pickup.day}</span>
                          <span className="text-[10px] bg-[#E4E3E0] px-1.5 py-0.5 border border-[#141414] font-bold">{pickup.endTime ? `${pickup.time} - ${pickup.endTime}` : pickup.time}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-900">ילדים: {pickup.childName}</p>
                        <p className="text-xs text-slate-700">נהג/ת: {otherDriver ? otherDriver.name : "טרם נקבע"}</p>
                        {pickup.notes && (
                          <p className="text-[11px] text-slate-500 bg-[#F2F2EF] p-1.5 border-r-2 border-[#141414] mt-1.5 italic">
                            💬 {pickup.notes}
                          </p>
                        )}
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center flex-row-reverse mt-2">
                        <span className={`text-[9px] px-1 border border-[#141414] font-bold uppercase ${
                          pickup.completed ? "bg-emerald-100 text-emerald-900 font-bold" : "bg-amber-100 text-amber-900 font-bold"
                        }`}>
                          {pickup.completed ? "נאסף" : "פעיל"}
                        </span>
                        {otherDriver?.phone && (
                          <a href={`tel:${otherDriver?.phone}`} className="text-[10px] text-indigo-700 hover:underline font-bold">
                            📞 התקשר ל{otherDriver.name.split(" ")[0]}
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* מודאל דיווח דחוף / ביטול (מנגנון התראה ומחיקה אוטומטי) */}
      <AnimatePresence>
        {isUrgentReporterOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-[#141414]/85" onClick={() => {
              setIsUrgentReporterOpen(false);
              setUrgentReportSuccessMsg(null);
            }} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#E4E3E0] border-4 border-[#141414] p-6 max-w-md w-full tech-shadow z-10 text-right overflow-y-auto max-h-[90vh] text-[#141414] font-mono relative"
              id="urgent_reporter_modal"
            >
              <div className="flex justify-between items-center mb-4 flex-row-reverse border-b-2 border-[#141414] pb-2">
                <h3 className="font-extrabold text-red-700 flex items-center gap-1.5 flex-row-reverse">
                  <ShieldAlert className="w-5 h-5 text-red-600 animate-pulse" />
                  <span>קריאת חירום ועדכון מטה מהיר / DISPATCH</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsUrgentReporterOpen(false);
                    setUrgentReportSuccessMsg(null);
                  }}
                  className="text-slate-700 hover:text-black cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>

              {urgentReportSuccessMsg ? (
                <div className="space-y-5 text-center py-2">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center border-2 border-emerald-600">
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h4 className="font-black text-emerald-800 text-sm sm:text-base">הדיווח עודכן וסונכרן בהצלחה!</h4>
                    <p className="text-xs text-slate-700 max-w-sm mx-auto leading-relaxed">
                      השינוי נרשם במערכת ונשלחה התראה להורים.
                      <br />
                      <strong className="text-red-700">כעת יש לשלוח הודעת ווטסאפ ישירה לשני ההורים בקליק:</strong>
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    {/* אמא - מיכל */}
                    <div className="bg-white p-3 border-2 border-[#141414] tech-shadow flex flex-col items-stretch text-right gap-2">
                      <div className="flex justify-between items-center flex-row-reverse">
                        <span className="text-xs font-black text-slate-800">עדכון אמא: {urgentReportSuccessMsg.motherName}</span>
                        <span className="text-[10px] bg-slate-100 px-1 border border-slate-400 font-mono text-slate-600">נייד רשום</span>
                      </div>
                      <a
                        href={urgentReportSuccessMsg.motherUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => {
                          setUrgentReportSuccessMsg(prev => prev ? { ...prev, motherSent: true } : null);
                        }}
                        className={`w-full py-2 border-2 border-[#141414] text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                          urgentReportSuccessMsg.motherSent
                            ? "bg-slate-200 text-slate-600 shadow-none border-slate-300"
                            : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-[2px_2px_0_0_#141414] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
                        }`}
                      >
                        <MessageSquare className="w-4 h-4 text-white" />
                        <span>{urgentReportSuccessMsg.motherSent ? "נשלח בהצלחה ✅ (שלח שוב)" : "שלח הודעת WhatsApp"}</span>
                      </a>
                    </div>

                    {/* אבא - ארז */}
                    <div className="bg-white p-3 border-2 border-[#141414] tech-shadow flex flex-col items-stretch text-right gap-2">
                      <div className="flex justify-between items-center flex-row-reverse">
                        <span className="text-xs font-black text-slate-800">עדכון אבא: {urgentReportSuccessMsg.fatherName}</span>
                        <span className="text-[10px] bg-slate-100 px-1 border border-slate-400 font-mono text-slate-600">נייד רשום</span>
                      </div>
                      <a
                        href={urgentReportSuccessMsg.fatherUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => {
                          setUrgentReportSuccessMsg(prev => prev ? { ...prev, fatherSent: true } : null);
                        }}
                        className={`w-full py-2 border-2 border-[#141414] text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                          urgentReportSuccessMsg.fatherSent
                            ? "bg-slate-200 text-slate-600 shadow-none border-slate-300"
                            : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-[2px_2px_0_0_#141414] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
                        }`}
                      >
                        <MessageSquare className="w-4 h-4 text-white" />
                        <span>{urgentReportSuccessMsg.fatherSent ? "נשלח בהצלחה ✅ (שלח שוב)" : "שלח הודעת WhatsApp"}</span>
                      </a>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#141414] flex justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUrgentReporterOpen(false);
                        setUrgentReportSuccessMsg(null);
                        setUrgentReportReason("");
                        setSelectedUrgentPickupId("");
                      }}
                      className="px-6 py-2.5 bg-[#141414] text-white hover:bg-white hover:text-[#141414] border-2 border-[#141414] text-xs font-black cursor-pointer shadow-[2px_2px_0_0_#141414] hover:shadow-none"
                    >
                      סיום וסגירה / DONE
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUrgentReportSubmit} className="space-y-4">
                  {/* תיבת בחירת נסיעה קיימת (dropdown filter) */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center flex-row-reverse pb-1">
                      <label className="text-xs font-bold text-slate-800">בחירת נסיעה מהלוח השבועי</label>
                      <span className="text-[10px] text-red-600 font-extrabold bg-red-100 border border-red-300 px-1.5 py-0.5">
                        {userRole === "driver" ? "הסעות שלך" : "כלל הסעות השבוע"}
                      </span>
                    </div>
                    <select
                      value={selectedUrgentPickupId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedUrgentPickupId(val);
                        const match = pickups.find(p => p.id === val);
                        if (match) {
                          setUrgentReportChild(match.childName);
                          setUrgentReportDay(match.day);
                          setUrgentReportTime(match.time);
                        }
                      }}
                      className="w-full text-xs px-2.5 py-2 border-2 border-[#141414] bg-white text-right focus:outline-none focus:border-red-600 font-sans"
                    >
                      <option value="">-- בחרו נסיעה מהלוח או השאירו מדויק ידני --</option>
                      {(userRole === "driver" && activeDriverId
                        ? pickups.filter(p => p.driverId === activeDriverId)
                        : pickups
                      ).map((p) => {
                        const drv = drivers.find(d => d.id === p.driverId);
                        return (
                          <option key={p.id} value={p.id}>
                            יום {p.day} | {p.time} | {p.childName} ({drv ? drv.name : "טרם נקבע"})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#141414] block">סוג הדיווח</label>
                    <div className="grid grid-cols-2 gap-2 flex-row-reverse">
                      <button
                        type="button"
                        onClick={() => setUrgentReportType("change")}
                        className={`text-xs py-2 px-3 border-2 font-bold cursor-pointer transition-all ${
                          urgentReportType === "change"
                            ? "bg-[#141414] text-white border-[#141414]"
                            : "bg-white border-[#141414] text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        שינוי דחוף של הרגע האחרון
                      </button>
                      <button
                        type="button"
                        onClick={() => setUrgentReportType("cancel")}
                        className={`text-xs py-2 px-3 border-2 font-bold cursor-pointer transition-all ${
                          urgentReportType === "cancel"
                            ? "bg-red-600 text-white border-[#141414]"
                            : "bg-white border-[#141414] text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        ביטול הסעה קיימת
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-800">עבור הילד/ה</label>
                      <select
                        value={urgentReportChild}
                        onChange={(e) => setUrgentReportChild(e.target.value)}
                        className="w-full text-xs px-2 py-2 border-2 border-[#141414] bg-white text-right focus:outline-none"
                      >
                        {DEFAULT_CHILDREN.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-800">היום</label>
                      <select
                        value={urgentReportDay}
                        onChange={(e) => setUrgentReportDay(e.target.value)}
                        className="w-full text-xs px-2 py-2 border-2 border-[#141414] bg-white text-right focus:outline-none"
                      >
                        {DAYS_OF_WEEK.map((d) => (
                          <option key={d} value={d}>
                            יום {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800 block">לפי שעה משוערכת</label>
                    <input
                      type="time"
                      value={urgentReportTime}
                      onChange={(e) => setUrgentReportTime(e.target.value)}
                      className="w-full text-xs px-2.5 py-2 border-2 border-[#141414] bg-white font-mono text-left focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800 block">סיבה או עדכון (יופיע בהתראה וב-WA)</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="למשל: נתקעתי בפקק, מעבירים נסיעה לסבתא..."
                      value={urgentReportReason}
                      onChange={(e) => setUrgentReportReason(e.target.value)}
                      className="w-full text-xs p-2.5 border-2 border-[#141414] bg-white text-right resize-none focus:outline-none focus:border-red-600"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUrgentReporterOpen(false);
                        setUrgentReportSuccessMsg(null);
                        setUrgentReportReason("");
                        setSelectedUrgentPickupId("");
                      }}
                      className="px-3.5 py-2 border-2 border-[#141414] bg-[#D1D0CC] text-[#141414] hover:bg-slate-350 text-xs font-bold cursor-pointer"
                    >
                      ביטול / CANCEL
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border-2 border-[#141414] bg-red-600 hover:bg-black text-white font-black text-xs cursor-pointer shadow-[2px_2px_0_0_#141414] transition-all"
                    >
                      שלח התראת חירום וסנכרן
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* מודאל תיאום / עריכת הסעה (עם קלט מהיר של נהגים מזדמנים) */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-[#141414]/85" onClick={() => setIsFormOpen(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#E4E3E0] border-4 border-[#141414] p-6 max-w-lg w-full tech-shadow z-10 text-right overflow-y-auto max-h-[90vh] text-[#141414] font-mono"
              id="scheduling_form_modal"
            >
              <h3 className="font-extrabold text-[#141414] border-b-2 border-[#141414] pb-2 mb-4 text-base italic uppercase">
                {editingPickup ? "עריכת הסעה קיימת / EDIT ENTRY" : `תיאום איסוף חדש עבור: ${formChildren.join(", ")}`}
              </h3>

              <form onSubmit={handleSavePickup} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800">יום</label>
                    <select
                      value={formDay}
                      onChange={(e) => setFormDay(e.target.value)}
                      className="w-full text-xs px-2.5 py-2 border-2 border-[#141414] bg-white text-right cursor-pointer focus:outline-none"
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d} value={d}>
                          יום {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800">משעה (איסוף)</label>
                    <input
                      type="time"
                      required
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                      className="w-full text-xs px-2.5 py-2 border-2 border-[#141414] bg-white text-left font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800 flex justify-between items-center flex-row-reverse">
                      <span>עד שעה (חזרה - אופציונלי)</span>
                      {formEndTime && (
                        <button
                          type="button"
                          onClick={() => setFormEndTime("")}
                          className="text-[10px] text-red-600 hover:underline cursor-pointer"
                        >
                          נקה
                        </button>
                      )}
                    </label>
                    <input
                      type="time"
                      value={formEndTime}
                      onChange={(e) => setFormEndTime(e.target.value)}
                      className="w-full text-xs px-2.5 py-2 border-2 border-[#141414] bg-white text-left font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block font-sans">עבור הילדים (ניתן לבחור יותר מילד אחד)</label>
                  <div className="flex gap-2 flex-wrap flex-row-reverse mt-1">
                    {DEFAULT_CHILDREN.map((c) => {
                      const isChecked = formChildren.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            if (isChecked) {
                              if (formChildren.length > 1) {
                                setFormChildren(formChildren.filter((x) => x !== c));
                              }
                            } else {
                              setFormChildren([...formChildren, c]);
                            }
                          }}
                          className={`px-4 py-2 border-2 border-[#141414] text-xs font-black transition-all cursor-pointer transform active:translate-y-0.5 flex items-center gap-1.5 ${
                            isChecked
                              ? "bg-[#141414] text-white shadow-none animate-press-feedback"
                              : "bg-white text-[#141414] hover:bg-slate-100 shadow-[2px_2px_0_0_#141414]"
                          }`}
                        >
                          <span>{c}</span>
                          <span>👦</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block font-sans">סוג פעילות / EVENT TYPE</label>
                  <div className="grid grid-cols-3 gap-2 flex-row-reverse">
                    <button
                      type="button"
                      onClick={() => setFormBabysitterType("none")}
                      className={`text-xs py-2 px-1 border-2 font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                        formBabysitterType === "none" || !formBabysitterType
                          ? "bg-[#141414] text-white border-[#141414]"
                          : "bg-white border-[#141414] text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      🚗 איסוף בלבד
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormBabysitterType("babysitter_only")}
                      className={`text-xs py-2 px-1 border-2 font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                        formBabysitterType === "babysitter_only"
                          ? "bg-indigo-950 text-white border-indigo-950"
                          : "bg-white border-[#141414] text-indigo-950 hover:bg-indigo-50"
                      }`}
                    >
                      🧸 בייביסיטר
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormBabysitterType("both")}
                      className={`text-xs py-2 px-1 border-2 font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                        formBabysitterType === "both"
                          ? "bg-amber-600 text-white border-amber-600"
                          : "bg-white border-[#141414] text-amber-900 hover:bg-amber-50"
                      }`}
                    >
                      🌟 משולב
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center flex-row-reverse pb-1">
                    <label className="text-xs font-bold text-slate-800">נהג/ת משויך</label>
                    <button
                      type="button"
                      onClick={() => setIsQuickDriver(!isQuickDriver)}
                      className="text-[11px] text-slate-800 font-bold hover:underline flex items-center gap-1 flex-row-reverse cursor-pointer align-middle"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isQuickDriver ? "בטל נהג מהיר" : "רישום נהג מהרגע להרגע..."}</span>
                    </button>
                  </div>

                  {!isQuickDriver ? (
                    <select
                      value={formDriverId}
                      onChange={(e) => setFormDriverId(e.target.value)}
                      className="w-full text-xs px-3 py-2 border-2 border-[#141414] bg-white focus:outline-none"
                      id="select_driver_selector"
                    >
                      <option value="unassigned">⚠️ ללא נהג משויך (נסיעה פנויה/דרוש נהג)</option>
                      {drivers.map((drv) => (
                        <option key={drv.id} value={drv.id}>
                          {drv.name} ({drv.type === "permanent" ? "קבוע" : "אורח"}) • {drv.phone}
                        </option>
                      ))}
                    </select>
                  ) : (
                    /* טופס קלט נהג מזדמן מתוך הטופס */
                    <div className="p-3 bg-[#FFD4D4] border-2 border-[#141414] space-y-2 mt-1">
                      <p className="text-[11px] text-red-955 font-bold">
                        פרטי נהג זמני קראפול או שינוי (יישרפו לתוך רשימת הנהגים)
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          required={isQuickDriver}
                          placeholder="שם נאור / נטלי אמא"
                          value={quickDriverName}
                          onChange={(e) => setQuickDriverName(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 border-2 border-[#141414] bg-white text-right focus:outline-none"
                        />
                        <input
                          type="tel"
                          required={isQuickDriver}
                          placeholder="טלפון נהג"
                          value={quickDriverPhone}
                          onChange={(e) => setQuickDriverPhone(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 border-2 border-[#141414] bg-white text-left ltr focus:outline-none"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="פרטי רכב לזיהוי קל (ללא חובה)"
                        value={quickDriverCar}
                        onChange={(e) => setQuickDriverCar(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border-2 border-[#141414] bg-white text-right focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">עדיפות / סוג סטטוס</label>
                  <div className="grid grid-cols-2 gap-2 flex-row-reverse">
                    <button
                      type="button"
                      onClick={() => setFormStatus("regular")}
                      className={`text-xs py-2 px-3 border-2 font-bold transition-colors ${
                        formStatus === "regular"
                          ? "bg-[#141414] text-white border-[#141414]"
                          : "bg-white border-[#141414] text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      איסוף רגיל
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormStatus("urgent")}
                      className={`text-xs py-2 px-3 border-2 font-bold transition-colors ${
                        formStatus === "urgent"
                          ? "bg-red-600 text-white border-[#141414]"
                          : "bg-white border-[#141414] text-red-650 hover:bg-red-50"
                      }`}
                    >
                      דחוף / חריג ⚠️
                    </button>
                  </div>
                </div>

                {/* הגדרת מחזוריות וסוג השינוי (קבוע או חד-פעמי) */}
                <div className="space-y-2 p-3 bg-amber-50/50 border-2 border-[#141414] space-y-2">
                  <label className="text-xs font-black text-slate-900 block">סוג האירוע במערכת / RECURRENCE TYPE</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormIsRecurring(true);
                      }}
                      className={`text-xs py-2 px-1 border-2 font-bold transition-all text-center flex items-center justify-center gap-1 ${
                        formIsRecurring
                          ? "bg-[#141414] text-white border-[#141414] shadow-none"
                          : "bg-white border-[#141414] text-slate-700 hover:bg-slate-100 shadow-[2px_2px_0_0_#141414]"
                      }`}
                    >
                      🔁 קבוע בכל שבוע
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormIsRecurring(false);
                        setFormOverrideType("onetime");
                      }}
                      className={`text-xs py-2 px-1 border-2 font-bold transition-all text-center flex items-center justify-center gap-1 ${
                        !formIsRecurring
                          ? "bg-[#141414] text-white border-[#141414] shadow-none"
                          : "bg-white border-[#141414] text-slate-700 hover:bg-slate-100 shadow-[2px_2px_0_0_#141414]"
                      }`}
                    >
                      📅 חד-פעמי לשבוע זה
                    </button>
                  </div>

                  {/* אם זה אירוע חוזר קבוע, וכעת אנחנו במצב עריכה - נאפשר לקבוע האם העריכה הנוכחית היא קבועה או חד-פעמית */}
                  {formIsRecurring && editingPickup && (
                    <div className="mt-2 pt-2 border-t border-dashed border-slate-350 space-y-1.5">
                      <label className="text-[11px] font-black text-amber-900 block">יישום שינויי עריכה / EDIT OPTION</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFormOverrideType("permanent")}
                          className={`text-[10px] py-1.5 px-2 border-2 font-bold transition-all ${
                            formOverrideType === "permanent"
                              ? "bg-amber-600 text-white border-[#141414] shadow-none"
                              : "bg-white border-[#141414] text-amber-900 hover:bg-amber-100/30 shadow-[1px_1px_0_0_#141414]"
                          }`}
                        >
                          💾 שינוי קבוע לכל שבוע
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormOverrideType("onetime")}
                          className={`text-[10px] py-1.5 px-2 border-2 font-bold transition-all ${
                            formOverrideType === "onetime"
                              ? "bg-amber-600 text-white border-[#141414] shadow-none"
                              : "bg-white border-[#141414] text-amber-900 hover:bg-amber-100/30 shadow-[1px_1px_0_0_#141414]"
                          }`}
                        >
                          ⚡ חריגה חד-פעמית לשבוע זה
                        </button>
                      </div>
                      <p className="text-[9px] text-amber-900 font-bold leading-tight bg-white p-1 border border-amber-200">
                        {formOverrideType === "onetime" 
                          ? "⚠️ שינוי חד-פעמי יישמר רק לשבוע זה, ויתאפס בשחזור שבוע הבא לערך המקורי." 
                          : "🌍 שינוי קבוע יעדכן את לוח הבסיס לצמיתות ותמיד יישאר משויך."}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">הערות אישיות לחוג / נהג</label>
                  <textarea
                    rows={2}
                    placeholder="למשל: איסוף מגביש סומסום, להמתין ברכב..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full text-xs p-2.5 border-2 border-[#141414] bg-white text-right resize-none focus:outline-none"
                    id="textarea_pickup_notes"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-3.5 py-2 border-2 border-[#141414] bg-[#D1D0CC] text-black text-xs font-bold cursor-pointer hover:bg-slate-300"
                  >
                    ביטול / CANCEL
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border-2 border-[#141414] bg-white text-black hover:bg-black hover:text-white font-black text-xs cursor-pointer shadow-[2px_2px_0_0_#141414]"
                    id="btn_submit_pickup_form"
                  >
                    שמור איסוף בלו״ז
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* מודאל התראה ועדכון משלוח וואטסאפ לנהג לאחר שינוי / מחיקה */}
      <AnimatePresence>
        {driverNotificationPending && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-[#141414]/90" onClick={() => setDriverNotificationPending(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FFFCE8] border-4 border-[#141414] p-6 max-w-md w-full tech-shadow z-10 text-right text-[#141414] font-mono"
              id="driver_notification_popup"
            >
              <div className="flex items-center gap-2 flex-row-reverse pb-2 mb-4 border-b-2 border-[#141414]">
                <Sparkles className="w-5 h-5 text-indigo-650 animate-bounce" />
                <h3 className="font-extrabold text-[#141414] text-base">
                  נשלח עדכון לנהג המוגדר!
                </h3>
              </div>

              <div className="space-y-4 text-xs leading-relaxed font-sans text-slate-800">
                <div className="font-bold text-slate-900 bg-white p-3 border-2 border-dashed border-[#141414]">
                  {driverNotificationPending.actionType === "delete" ? (
                    <span>
                      בוטלה ההסעה של <strong>{driverNotificationPending.pickup.childName}</strong> ביום {driverNotificationPending.pickup.day} בשעה {driverNotificationPending.pickup.time}.
                    </span>
                  ) : (
                    <span>
                      עודכנו פרטי ההסעה של <strong>{driverNotificationPending.pickup.childName}</strong>. 
                      {driverNotificationPending.oldPickup && (
                        <span className="block mt-1 text-slate-500 font-normal">
                          (קודם לכן: יום {driverNotificationPending.oldPickup.day} בשעה {driverNotificationPending.oldPickup.time})
                        </span>
                      )}
                      <span className="block mt-1">
                        המועד החדש: <strong>יום {driverNotificationPending.pickup.day} בשעה {driverNotificationPending.pickup.time}</strong>
                      </span>
                    </span>
                  )}
                </div>

                <p className="font-bold text-slate-900">
                  הודעת מערכת נשלחה בהצלחה לנהג/ת <strong>{driverNotificationPending.driver.name}</strong> 🔔
                </p>
                <p>
                  מכיוון שהנהג/ת משויך/כת להסעה זו, אנו ממליצים מאוד לשגר גם הודעת וואטסאפ מהירה כדי לוודא ששמו לב לשינוי המיידי:
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t border-slate-300 mt-4">
                <button
                  onClick={() => {
                    const drv = driverNotificationPending.driver;
                    const p = driverNotificationPending.pickup;
                    let text = "";
                    if (driverNotificationPending.actionType === "delete") {
                      text = `🚗 *עדכון על ביטול הסעה בסהרון* 🚗\n\nהיי ${drv.name},\nרצינו לעדכן שההסעה הרשומה על שמך בוטלה:\n\n👦🧒 *הילד/ה:* ${p.childName}\n📅 *מועד מבוטל:* יום ${p.day} בשעה ${p.time}\n\nאין צורך לבצע איסוף זה השבוע! תודה רבה 🧡`;
                    } else {
                      text = `🚗 *עדכון חשוב על שינוי בהסעה בסהרון* 🚗\n\nהיי ${drv.name},\nעודכן שינוי בהסעה המשוייכת אליך:\n\n👦🧒 *הילד/ה:* ${p.childName}\n📅 *המועד החדש:* יום ${p.day} בשעה ${p.time}\n${p.notes ? `💬 *הערות נוספות:* ${p.notes}\n` : ""}\nנודה לך אם תאשר/י בקבלת ההודעה! שבוע מקסים 👍`;
                    }

                    let phoneNum = drv.phone.replace(/[^0-9]/g, "");
                    if (phoneNum.startsWith("0")) {
                      phoneNum = "972" + phoneNum.substring(1);
                    }
                    const url = `https://api.whatsapp.com/send?phone=${phoneNum}&text=${encodeURIComponent(text)}`;
                    window.open(url, "_blank");
                  }}
                  className="w-full py-2.5 bg-[#25D366] text-white hover:bg-[#128C7E] border-2 border-[#141414] text-xs font-black cursor-pointer shadow-[2px_2px_0_0_#141414] hover:shadow-none transition-all text-center"
                >
                  💬 שלח הודעת עדכון ישירה בוואטסאפ
                </button>
                <button
                  onClick={() => setDriverNotificationPending(null)}
                  className="w-full py-2 bg-[#D1D0CC] hover:bg-slate-300 border-2 border-[#141414] text-xs font-black cursor-pointer text-center"
                >
                  הבנתי, סגור הודעה זו 👍
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* מודאל דיווח נהג על ביטול והצעה לשלוח הודעה להורים */}
      <AnimatePresence>
        {cancellationMessagePrompt && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-[#141414]/90" onClick={() => setCancellationMessagePrompt(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FFF5F5] border-4 border-[#141414] p-6 max-w-md w-full tech-shadow z-10 text-right text-[#141414] font-mono relative"
              id="driver_cancellation_msg_popup"
            >
              <div className="flex items-center gap-2 flex-row-reverse pb-2 mb-4 border-b-2 border-red-950 text-red-700">
                <AlertTriangle className="w-5 h-5 text-red-600 animate-bounce" />
                <h3 className="font-extrabold text-[#141414] text-base">
                  נסיעה בוטלה! שלח הודעה להורים
                </h3>
              </div>

              <div className="space-y-4 text-xs leading-relaxed font-sans text-slate-800">
                <p className="font-bold text-slate-950">
                  הנסיעה של <span className="underline decoration-red-500 font-black">{cancellationMessagePrompt.pickup.childName}</span> ביום {cancellationMessagePrompt.pickup.day} בשעה {cancellationMessagePrompt.pickup.time} הוחזרה למאגר.
                </p>
                <p className="text-slate-700">
                  נא עדכן את ההורים בדבר הביטול כדי שיוכלו לדאוג לשיבוץ נהג חלופי בהקדם:
                </p>

                <div className="bg-red-50/50 p-3 border border-[#141414] rounded text-right space-y-1 bg-white font-mono text-[11px] ltr text-left select-all whitespace-pre-wrap">
                  {cancellationMessagePrompt.parentMessage}
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t border-slate-300 mt-4 leading-normal">
                {/* כפתור לאמא */}
                <button
                  onClick={() => {
                    window.open(cancellationMessagePrompt.motherUrl, "_blank");
                  }}
                  className="w-full py-2.5 bg-[#25D366] text-white hover:bg-[#128C7E] border-2 border-[#141414] text-xs font-black cursor-pointer shadow-[2px_2px_0_0_#141414] hover:shadow-none transition-all text-center flex items-center justify-center gap-2 flex-row-reverse"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>שלח וואטסאפ לאמא ({cancellationMessagePrompt.motherName})</span>
                </button>

                {/* כפתור לאבא */}
                <button
                  onClick={() => {
                    window.open(cancellationMessagePrompt.fatherUrl, "_blank");
                  }}
                  className="w-full py-2.5 bg-[#25D366] text-white hover:bg-[#128C7E] border-2 border-[#141414] text-xs font-black cursor-pointer shadow-[2px_2px_0_0_#141414] hover:shadow-none transition-all text-center flex items-center justify-center gap-2 flex-row-reverse"
                >
                  <MessageSquare className="w-4 h-4 animate-pulse" />
                  <span>שלח וואטסאפ לאבא ({cancellationMessagePrompt.fatherName})</span>
                </button>

                {/* שיתוף כללי */}
                <button
                  onClick={() => {
                    window.open(cancellationMessagePrompt.generalUrl, "_blank");
                  }}
                  className="w-full py-2 bg-white text-[#141414] hover:bg-slate-100 border-2 border-[#141414] text-xs font-black cursor-pointer shadow-[1.5px_1.5px_0_0_#141414] hover:shadow-none transition-all text-center flex items-center justify-center gap-2 flex-row-reverse"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>קבוצת הורים (שיתוף כללי)</span>
                </button>

                {/* העתקה ללוח הטיפוס */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(cancellationMessagePrompt.parentMessage);
                    alert("נוסח ההודעה הועתק ללוח הגזירים! 📋");
                  }}
                  className="w-full py-2 bg-[#D1D0CC] hover:bg-slate-300 text-slate-800 border-2 border-[#141414] text-xs font-black cursor-pointer text-center"
                >
                  📋 העתק טקסט הודעה ללוח
                </button>

                <button
                  onClick={() => setCancellationMessagePrompt(null)}
                  className="w-full py-1.5 bg-[#E4E3E0] hover:bg-slate-200 border-2 border-dashed border-[#141414] text-xs font-black cursor-pointer text-center text-slate-600"
                >
                  סגור ללא שליחה
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* תחילת מודאלי שליטה */}

      {/* מודאל מחיקה מותאם אישית */}
      <AnimatePresence>
        {deleteConfirmId && (() => {
          const pickupToDelete = pickups.find(p => p.id === deleteConfirmId);
          if (!pickupToDelete) return null;
          return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-[#141414]/90" onClick={() => setDeleteConfirmId(null)} />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#FFFDF9] border-4 border-[#141414] p-6 max-w-sm w-full tech-shadow z-10 text-right text-[#141414] font-mono"
                id="delete_confirmation_modal"
              >
                <div className="flex items-center gap-2 flex-row-reverse pb-2 mb-4 border-b-2 border-[#141414] text-red-600">
                  <AlertTriangle className="w-5 h-5 text-red-600 animate-bounce shrink-0" />
                  <h3 className="font-extrabold text-[#141414] text-base">
                    אישור ביטול נסיעה
                  </h3>
                </div>

                <div className="space-y-4 text-xs leading-relaxed font-sans text-slate-800">
                  <p className="font-bold text-slate-900">
                    כיצד ברצונך לבטל נסיעה זו?
                  </p>
                  <div className="bg-red-50 p-3 border-2 border-dashed border-red-200 rounded text-right space-y-1">
                    <div>👦🧒 <strong>ילד/ה:</strong> {pickupToDelete.childName}</div>
                    <div>🗓️ <strong>יום:</strong> {pickupToDelete.day}</div>
                    <div>⏰ <strong>שעה:</strong> {pickupToDelete.time}</div>
                    {pickupToDelete.isRecurring && (
                      <div className="text-red-750 font-bold mt-1">🔄 הסעה זו הינה הסעה שבועית קבועה.</div>
                    )}
                  </div>
                </div>

                {pickupToDelete.isRecurring ? (
                  <div className="flex flex-col gap-2 pt-4 border-t border-slate-200 mt-4 text-center">
                    <button
                      onClick={() => {
                        if (deleteConfirmId) {
                          executeDeletePickup(deleteConfirmId, "onetime");
                        }
                      }}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white border-2 border-[#141414] text-xs font-black cursor-pointer shadow-[2px_2px_0_0_#141414] hover:shadow-none transition-all animate-pulse"
                      id="btn_confirm_delete_pickup_onetime"
                    >
                      ⚡ ביטול חד-פעמי (עבור שבוע זה בלבד)
                    </button>
                    <button
                      onClick={() => {
                        if (deleteConfirmId) {
                          executeDeletePickup(deleteConfirmId, "permanent");
                        }
                      }}
                      className="w-full py-2 bg-red-600 hover:bg-red-700 text-white border-2 border-[#141414] text-xs font-black cursor-pointer shadow-[2px_2px_0_0_#141414] hover:shadow-none transition-all"
                      id="btn_confirm_delete_pickup_permanent"
                    >
                      ❌ מחיקה לצמיתות (לכל השבועות הבאים)
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="w-full py-2 bg-[#D1D0CC] hover:bg-slate-300 border-2 border-[#141414] text-xs font-black cursor-pointer text-center"
                      id="btn_cancel_delete_pickup"
                    >
                      חזור ללו״ז (ביטול)
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 pt-4 border-t border-slate-200 mt-4 flex-row-reverse">
                    <button
                      onClick={() => {
                        if (deleteConfirmId) {
                          executeDeletePickup(deleteConfirmId, "permanent");
                        }
                      }}
                      className="flex-1 py-1.5 md:py-2 bg-red-650 text-white hover:bg-red-700 border-2 border-[#141414] text-xs font-black cursor-pointer shadow-[2px_2px_0_0_#141414] hover:shadow-none transition-all text-center"
                      id="btn_confirm_delete_pickup"
                    >
                      כן, מחק הסעה
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="flex-1 py-1.5 md:py-2 bg-[#D1D0CC] hover:bg-slate-300 border-2 border-[#141414] text-xs font-black cursor-pointer text-center"
                      id="btn_cancel_delete_pickup"
                    >
                      ביטול
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* מודאל אתחול שבוע מותאם אישית (ללא window.confirm) */}
      <AnimatePresence>
        {resetWeekConfirmOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-[#141414]/90" onClick={() => setResetWeekConfirmOpen(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FFFDF9] border-4 border-[#141414] p-6 max-w-md w-full tech-shadow z-10 text-right text-[#141414] font-mono"
              id="reset_week_confirmation_modal"
            >
              <div className="flex items-center gap-2 flex-row-reverse pb-2 mb-4 border-b-2 border-[#141414] text-indigo-950">
                <Trash2 className="w-5 h-5 text-indigo-950 shrink-0" />
                <h3 className="font-extrabold text-[#141414] text-base">
                  אישור אתחול שבוע
                </h3>
              </div>

              <div className="space-y-4 text-xs leading-relaxed font-sans text-slate-800">
                <p className="font-bold text-indigo-950">
                  האם לאתחל את השבוע הנוכחי ולהכין את האפליקציה לשבוע הבא?
                </p>
                <div className="space-y-1 text-slate-700 bg-indigo-50/50 p-3 border border-indigo-100 rounded text-right leading-relaxed font-bold" style={{ direction: "rtl" }}>
                  <div>🔄 שחזור הגדרות המקור הקבועות לכל אירוע קבוע שעבר שינוי חד-פעמי (Override).</div>
                  <div className="mt-1">🧹 איפוס כל סימוני ה-V (בוצע) לשבוע הבא.</div>
                  <div className="mt-1">❌ אירועים חד-פעמיים מיוחדים שנוספו השבוע בלבד (שאינם קבועים) יימחקו מהלוח המלא.</div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-200 mt-4 flex-row-reverse">
                <button
                  onClick={executeResetWeek}
                  className="flex-1 py-1.5 md:py-2 bg-indigo-950 text-white hover:bg-slate-900 border-2 border-[#141414] text-xs font-black cursor-pointer shadow-[2px_2px_0_0_#141414] hover:shadow-none transition-all text-center"
                  id="btn_confirm_reset_week"
                >
                  כן, אתחל שבוע
                </button>
                <button
                  onClick={() => setResetWeekConfirmOpen(false)}
                  className="flex-1 py-1.5 md:py-2 bg-[#D1D0CC] hover:bg-slate-300 border-2 border-[#141414] text-xs font-black cursor-pointer text-center"
                  id="btn_cancel_reset_week"
                >
                  ביטול
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
