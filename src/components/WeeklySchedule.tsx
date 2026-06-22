/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Pickup, Driver, DAYS_OF_WEEK, DEFAULT_CHILDREN } from "../types";
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

  // מודאל עריכה
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPickup, setEditingPickup] = useState<Pickup | null>(null);

  // ערכי טופס
  const [formDay, setFormDay] = useState("ראשון");
  const [formChildren, setFormChildren] = useState<string[]>(["איתי"]);
  const [formTime, setFormTime] = useState("13:30");
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
  const [urgentReportChild, setUrgentReportChild] = useState("איתי");
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

  useEffect(() => {
    setPickups(StorageEngine.getPickups());
    setDrivers(StorageEngine.getDrivers());

    const unsubscribe = subscribeToStore(() => {
      setPickups(StorageEngine.getPickups());
      setDrivers(StorageEngine.getDrivers());
    });
    return unsubscribe;
  }, []);

  // שליחת תזכורת נסיעה או שינוי דרך הווטסאפ (WhatsApp)
  const shareOnWhatsApp = (pickup: Pickup) => {
    const driver = drivers.find((d) => d.id === pickup.driverId);
    const text = `🚗 *עדכון נסיעה חשוב מסהרון* 🚗\n\n*יום:* יום ${pickup.day}\n*שעה:* ${pickup.time}\n*עבור הילדים:* ${pickup.childName}\n*הנהג/ת המשויך:* ${driver ? driver.name : "טרם שוייך"}\n${driver?.phone ? `*טלפון:* ${driver.phone}` : ""}\n${pickup.notes ? `*הערות איסוף:* ${pickup.notes}` : ""}\n\nנא לאשר קבלת ההסעה! נסיעה בטוחה! 🧡🚲`;
    
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

    const myPickups = pickups.filter(p => p.driverId === driverId);
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

    const myPickups = pickups.filter(p => p.driverId === driverId);
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
    if (drivers.length > 0) {
      setFormDriverId(drivers[0].id);
    } else {
      setFormDriverId("unassigned");
    }
    setFormStatus("regular");
    setFormNotes("");
    setFormBabysitterType("none");
    setIsQuickDriver(false);
    setIsFormOpen(true);
  };

  const openEditForm = (pickup: Pickup) => {
    if (userRole !== "parent") return; // מורשה להורים בלבד
    setEditingPickup(pickup);
    setFormDay(pickup.day);
    const parsed = pickup.childName.split(",").map(c => c.trim()).filter(Boolean);
    setFormChildren(parsed.length > 0 ? parsed : ["איתי"]);
    setFormTime(pickup.time);
    setFormDriverId(pickup.driverId || "unassigned");
    setFormStatus(pickup.status);
    setFormNotes(pickup.notes);
    setFormBabysitterType(pickup.babysitterType || "none");
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
    if (editingPickup) {
      // עדכון הקיים
      StorageEngine.updatePickup({
        ...editingPickup,
        day: formDay,
        childName: childNamesString,
        time: formTime,
        driverId: targetDriverId,
        status: formStatus,
        notes: formNotes,
        babysitterType: formBabysitterType,
      });
    } else {
      // יצירת חדש
      StorageEngine.addPickup({
        day: formDay,
        childName: childNamesString,
        time: formTime,
        driverId: targetDriverId,
        status: formStatus,
        notes: formNotes,
        completed: false,
        babysitterType: formBabysitterType,
      });
    }

    setIsFormOpen(false);
  };

  const handleDeletePickup = (id: string) => {
    if (userRole !== "parent") return; // מורשה להורים בלבד
    if (confirm("האם למחוק או לבטל הסעה זו לחלוטין מלו״ז השבוע?")) {
      StorageEngine.deletePickup(id);
    }
  };

  const handleToggleCompletion = (id: string) => {
    if (userRole === "child") return; // ילדים יכולים רק לצפות

    const pickupItem = pickups.find(p => p.id === id);
    if (userRole === "driver" && activeDriverId && pickupItem && pickupItem.driverId !== activeDriverId) {
      alert("שגיאת הרשאה: נהגים מורשים לסמן השלמה עבור נסיעות המשויכות אליהם בלבד!");
      return;
    }

    StorageEngine.togglePickupCompletion(id);
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
    return pickups.filter((p) => p.day === day && p.childName.split(",").map(c => c.trim()).includes(child));
  };

  // שליפת איסוף יחיד (הראשון) לצורכי תאימות במידת הצורך
  const getPickupFor = (day: string, child: string): Pickup | undefined => {
    return getPickupsFor(day, child)[0];
  };

  const unassignedPickups = pickups.filter(p => !p.driverId || p.driverId === "unassigned");

  return (
    <div className="space-y-6" id="scheduling_dashboard_module">
      {/* כפתור דיווח מהיר על שינויים עליון */}
      {(userRole === "parent" || userRole === "driver") && (
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#FFD4D4] border-4 border-[#141414] tech-shadow p-5 flex-row-reverse text-right">
          <div className="space-y-1">
            <h4 className="text-sm font-black text-red-900 flex items-center gap-1.5 justify-end flex-row-reverse uppercase">
              <ShieldAlert className="w-4 h-4 text-red-700 animate-pulse" />
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
              return (
                <div key={p.id} className="bg-white border-2 border-[#141414] p-3.5 flex flex-col justify-between space-y-2 hover:bg-amber-50/20 shadow-[2px_2px_0_0_#141414]">
                  <div className="flex justify-between items-center flex-row-reverse border-b border-dashed border-slate-350 pb-1.5">
                    <span className="font-extrabold text-[#141414] text-xs">יום {p.day} • {p.time}</span>
                    <span className="bg-amber-100 text-amber-950 text-[10px] px-1.5 py-0.5 border border-amber-950 font-black font-mono">
                      {p.childName}
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 space-y-1">
                    {p.notes ? <p className="italic">🎯 &quot;{p.notes}&quot;</p> : <p className="text-slate-400">אין הערות מיוחדות</p>}
                    {p.babysitterType && p.babysitterType !== "none" && (
                      <span className="inline-block mt-1 font-black text-[10px] bg-indigo-50 text-indigo-950 border border-indigo-300 px-1.5 py-0.5 rounded">
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
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b-4 border-[#141414] pb-4 flex-row-reverse">
        <div className="text-right">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#141414] text-[#E4E3E0] px-2 py-0.5 border border-[#141414]">
            לוח בקרה שבועי / WEEKLY CONTROL GRID
          </span>
          <h2 className="hidden sm:block text-2xl font-black text-[#141414] mt-1 font-serif uppercase italic">תוכנית האיסופים השבועית</h2>
          <p className="hidden sm:block text-xs text-slate-700 mt-1 font-mono">מפגש שבועי המפצל את ההסעות לפי 3 הילדים. כחול = קבוע, כתום/אדום = דחוף.</p>
        </div>

        {/* טאבים על ימים במובייל / סינונים */}
        <div className="md:hidden flex gap-1 bg-slate-150 p-1 rounded-xl w-full overflow-x-auto select-none" style={{ direction: "rtl" }}>
          {DAYS_OF_WEEK.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDayTab(day)}
              className={`flex-1 text-center py-2 px-3 text-xs font-semibold rounded-lg shrink-0 transition-all ${
                selectedDayTab === day
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              יום {day}
            </button>
          ))}
        </div>
      </div>

      {/* פילטר ייחודי למצב נהג פעיל */}
      {userRole === "driver" && activeDriverId && (
        <div className="bg-[#E4E3E0] border-4 border-[#141414] p-4 flex flex-col md:flex-row justify-between items-center gap-4 text-right" style={{ direction: "rtl" }}>
          <div className="space-y-1">
            <h4 className="text-sm font-black text-[#141414] uppercase flex items-center gap-1.5 flex-row-reverse">
              <Sparkles className="w-4 h-4 text-indigo-600 animate-bounce" />
              <span>מצב סינון לוח שבועי / WEEKLY CONTROL MODE</span>
            </h4>
            <p className="hidden sm:block text-xs text-slate-700 font-medium">כנהג משפחתי פעיל, באפשרותך לסנן את הלוח כדי להתרכז רק במשימות שלך השבוע, או לצפות בכלל נסיעות הבית.</p>
          </div>
          <div className="flex bg-white border-2 border-[#141414] p-1 shadow-[2px_2px_0_0_#141414] shrink-0 select-none">
            <button
              onClick={() => setDriverFilter("only-mine")}
              className={`px-4 py-2 text-xs font-black transition-all cursor-pointer ${
                driverFilter === "only-mine"
                  ? "bg-[#141414] text-white"
                  : "bg-white text-slate-700 hover:bg-[#F2F2EF]"
              }`}
            >
              רק הנסיעות שלי השבוע 🚗
            </button>
            <button
              onClick={() => setDriverFilter("all")}
              className={`px-4 py-2 text-xs font-black transition-all border-r-2 border-[#141414] cursor-pointer ${
                driverFilter === "all"
                  ? "bg-[#141414] text-white"
                  : "bg-white text-slate-700 hover:bg-[#F2F2EF]"
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
            <p className="hidden sm:block text-[11px] text-amber-950/80 leading-relaxed">באפשרותך לייצא את הנסיעות השבועות שלך ישירות ליומן המקומי במכשיר הנייד (כמו Google Calendar או Apple Calendar) או לשתף את כל הלוח שלך בקבוצה המשפחתית בוואטסאפ.</p>
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
      <div className="hidden md:block overflow-x-auto" id="desktop_weekly_grid">
        <table className="w-full text-right border-4 border-[#141414] border-collapse bg-white font-mono">
          <thead>
            <tr className="border-b-4 border-[#141414] bg-[#D1D0CC]">
              <th className="py-3 px-4 text-xs font-black text-[#141414] w-28 border-l-2 border-[#141414]">יום בשבוע</th>
              {DEFAULT_CHILDREN.map((child) => (
                <th key={child} className="py-3 px-4 text-sm font-black text-[#141414] text-center w-80 border-l-2 border-[#141414] last:border-l-0">
                  <div className="flex flex-col items-center">
                    <span className="bg-[#141414] text-white px-3 py-1 font-bold border border-[#141414] tracking-wider">
                      הסעות {child} / {child.toUpperCase()}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-[#141414]">
            {DAYS_OF_WEEK.map((day) => (
              <tr key={day} className="hover:bg-[#F2F2EF] transition-colors">
                {/* עמודת היום */}
                <td className="py-5 px-4 font-black text-[#141414] text-sm align-middle bg-[#D1D0CC] border-l-4 border-b-2 border-[#141414]">
                  <div className="flex items-center gap-1.5 flex-row-reverse">
                    <Calendar className="w-4 h-4" />
                    <span className="font-serif italic text-base">יום {day}</span>
                  </div>
                </td>

                {/* משבצות הילדים */}
                {DEFAULT_CHILDREN.map((child) => {
                  let items = getPickupsFor(day, child);

                  // סינון לנהג הנוכחי
                  if (userRole === "driver" && activeDriverId && driverFilter === "only-mine") {
                    items = items.filter(item => item.driverId === activeDriverId);
                  }

                  return (
                    <td key={child} className="py-3 px-3 align-top border-l-2 border-[#141414] last:border-l-0">
                      {items.length > 0 ? (
                        <div className="space-y-3.5">
                          {items.map((item) => {
                            const driver = drivers.find((d) => d.id === item.driverId);
                            const isMyRide = userRole === "driver" && activeDriverId && item.driverId === activeDriverId;
                            const isOtherRide = userRole === "driver" && activeDriverId && item.driverId !== activeDriverId;

                            return (
                              <motion.div
                                key={item.id}
                                layoutId={`pickup_card_${item.id}_${child}`}
                                className={`p-4 border-2 border-[#141414] transition-all relative group overflow-hidden ${
                                  isMyRide
                                    ? "bg-emerald-50 border-emerald-500 ring-4 ring-emerald-300 ring-offset-1 shadow-none"
                                    : isOtherRide
                                    ? "bg-slate-50 opacity-40 grayscale-[50%] contrast-75 cursor-not-allowed select-none pointer-events-none"
                                    : item.completed
                                    ? "bg-[#E4E3E0] opacity-85 shadow-none"
                                    : item.status === "urgent"
                                    ? "bg-[#FFD4D4] shadow-[4px_4px_0_0_#141414]"
                                    : "bg-white shadow-[2px_2px_0_0_#141414] hover:shadow-[4px_4px_0_0_#141414]"
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
                                    <span className="font-mono">{item.time}</span>
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

                                {item.babysitterType && item.babysitterType !== "none" && (
                                  <div className="mt-1 text-right">
                                    <span className="inline-flex items-center gap-1.5 bg-indigo-50 border-2 border-indigo-900 text-indigo-950 font-black text-[10.5px] px-2 py-0.5 rounded shadow-[1px_1px_0_0_#1e1b4b] flex-row-reverse">
                                      <span>🧸</span>
                                      <span>
                                        {item.babysitterType === "babysitter_only"
                                          ? "בייביסיטר בלבד"
                                          : "איסוף + בייביסיטר"}
                                      </span>
                                    </span>
                                  </div>
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

                          {/* כפתור הוספה נוספת מהיר להורים */}
                          {userRole === "parent" && (
                            <button
                              onClick={() => openAddForm(day, child)}
                              className="w-full py-2 border-2 border-dashed border-[#141414] hover:bg-[#D1D0CC]/35 text-[#141414] text-xs font-black transition-all flex items-center justify-center gap-1.5 bg-white cursor-pointer"
                            >
                              <Plus className="w-4 h-4 text-slate-700" />
                              <span>הוסף נסיעה נוספת ליום {day}</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        /* מקום ריק - אפשרות הוספה להורים */
                        userRole === "parent" ? (
                          <button
                            onClick={() => openAddForm(day, child)}
                            className="w-full py-6 border-2 border-dashed border-[#141414] hover:bg-[#D1D0CC]/35 text-[#141414] text-xs font-black uppercase transition-all flex flex-col items-center justify-center gap-1.5 bg-white cursor-pointer"
                          >
                            <PlusCircle className="w-5 h-5 text-slate-700" />
                            <span>תיאום איסוף {child}</span>
                          </button>
                        ) : (
                          <div className="w-full py-6 border-2 border-dashed border-slate-300 text-center text-slate-500 font-mono text-xs italic bg-[#F2F2EF]">
                            אין עדכון להסעה
                          </div>
                        )
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* תצוגת מובייל יומית (Mobile View only selected Day Tab) */}
      <div className="md:hidden space-y-4 font-mono" id="mobile_day_layout">
        <h3 className="text-sm font-black text-[#141414] text-right uppercase border-r-4 border-[#141414] pr-2">הסעות ליום {selectedDayTab} / DAILY LOG:</h3>
        <div className="grid grid-cols-1 gap-4">
          {DEFAULT_CHILDREN.map((child) => {
            let item = getPickupFor(selectedDayTab, child);

            // סינון במובייל לנהג הפעיל
            if (item && userRole === "driver" && activeDriverId && driverFilter === "only-mine") {
              if (item.driverId !== activeDriverId) {
                item = undefined;
              }
            }

            const driver = item ? drivers.find((d) => d.id === item.driverId) : null;

            return (
              <div key={child} className="bg-white border-2 border-[#141414] p-4 text-right shadow-[2px_2px_0_0_#141414]">
                <div className="border-b-2 border-[#141414] pb-2 mb-3 flex justify-between items-center flex-row-reverse">
                  <span className="font-black text-[#141414] text-sm uppercase">עבור: {child} / FOR {child.toUpperCase()}</span>
                  <span className="text-[10px] bg-[#D1D0CC] text-[#141414] border border-[#141414] px-1.5 py-0.5 font-bold">יום {selectedDayTab}</span>
                </div>

                {item ? (
                  <div className="space-y-3.5">
                    <div className="flex justify-between items-center flex-row-reverse">
                      <span className="inline-flex items-center gap-1 text-sm font-black text-black bg-[#E4E3E0] border border-[#141414] px-2 py-0.5 flex-row-reverse font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{item.time}</span>
                      </span>

                      <span
                        className={`text-[10px] px-2 py-0.5 border border-[#141414] font-bold ${
                          item.status === "urgent" ? "bg-red-600 text-white" : "bg-[#141414] text-white"
                        }`}
                      >
                        {item.status === "urgent" ? "URGENT !!" : "REGULAR"}
                      </span>
                    </div>

                    {item.babysitterType && item.babysitterType !== "none" && (
                      <div className="text-right pb-1">
                        <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-950 text-[10px] px-2 py-0.5 rounded border border-indigo-300 font-black font-mono flex-row-reverse">
                          <span>🧸</span>
                          <span>
                            {item.babysitterType === "babysitter_only"
                              ? "בייביסיטר בלבד"
                              : "איסוף + בייביסיטר"}
                          </span>
                        </span>
                      </div>
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
                        <p className="bg-[#E4E3E0] p-2 border-r-4 border-[#141414] text-slate-800 mt-2 text-right font-mono">
                          <strong>הערה: </strong> {item.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-300 flex-row-reverse">
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

                      {userRole === "parent" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditForm(item)}
                            className="p-1 text-slate-700 hover:text-black border border-transparent hover:border-[#141414] hover:bg-slate-100"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePickup(item.id)}
                            className="p-1 text-slate-700 hover:text-red-700 border border-transparent hover:border-[#141414] hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  userRole === "parent" ? (
                    <button
                      onClick={() => openAddForm(selectedDayTab, child)}
                      className="w-full py-4 text-xs font-black text-black bg-white hover:bg-slate-100 border-2 border-dashed border-[#141414] flex items-center justify-center gap-1 flex-row-reverse cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>הוסף הסעה ל{child}</span>
                    </button>
                  ) : (
                    <p className="text-xs text-slate-500 italic text-center py-2">אין איסוף רשום</p>
                  )
                )}
              </div>
            );
          })}
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

          {pickups.filter(p => p.driverId !== activeDriverId).length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center py-4">אין נסיעות שבועיות נוספות משויכות לנהגים אחרים.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {pickups
                .filter(p => p.driverId !== activeDriverId)
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
                          <span className="text-[10px] bg-[#E4E3E0] px-1.5 py-0.5 border border-[#141414] font-bold">{pickup.time}</span>
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
                    <label className="text-xs font-bold text-slate-800">שעה</label>
                    <input
                      type="time"
                      required
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
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
                      איסוף רגיל / סדיר (REGULAR)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormStatus("urgent")}
                      className={`text-xs py-2 px-3 border-2 font-bold transition-colors ${
                        formStatus === "urgent"
                          ? "bg-red-650 text-white border-[#141414] animate-pulse"
                          : "bg-white border-[#141414] text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      דחוף / שינוי בהול (URGENT)
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">האם נדרש בייביסיטר? 🧸</label>
                  <div className="grid grid-cols-3 gap-2 flex-row-reverse">
                    <button
                      type="button"
                      onClick={() => setFormBabysitterType("none")}
                      className={`text-[11px] py-1.5 px-0.5 border-2 border-[#141414] font-black transition-colors ${
                        formBabysitterType === "none"
                          ? "bg-[#141414] text-white"
                          : "bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      🚗 איסוף בלבד
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormBabysitterType("babysitter_only")}
                      className={`text-[11px] py-1.5 px-0.5 border-2 border-[#141414] font-black transition-colors ${
                        formBabysitterType === "babysitter_only"
                          ? "bg-amber-600 text-white"
                          : "bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      🧸 בייביסיטר בלבד
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormBabysitterType("both")}
                      className={`text-[11px] py-1.5 px-0.5 border-2 border-[#141414] font-black transition-colors ${
                        formBabysitterType === "both"
                          ? "bg-indigo-650 text-white"
                          : "bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      🚗+🧸 גם וגם
                    </button>
                  </div>
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
    </div>
  );
}
